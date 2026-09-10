import hashlib
import hmac
import json
import os
import re
import secrets
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import urlsplit
from uuid import UUID, uuid4

import psycopg
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, StrictBool

SYLLABUS = json.loads(Path(__file__).with_name('syllabus.json').read_text())
ITEM_IDS = {i['id'] for t in SYLLABUS for s in t['sections'] for c in s['commands'] for i in c['items']}
SESSION_SECONDS = 60 * 60 * 24 * 30


def connect():
    return psycopg.connect(os.environ['DATABASE_URL'])


@asynccontextmanager
async def lifespan(app):
    with connect() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS progress (
            learner UUID NOT NULL, item_id TEXT NOT NULL,
            completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (learner, item_id))''')
        db.execute('''CREATE TABLE IF NOT EXISTS accounts (
            id UUID PRIMARY KEY, username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())''')
        db.execute('''CREATE TABLE IF NOT EXISTS sessions (
            token_hash TEXT PRIMARY KEY, account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            expires_at TIMESTAMPTZ NOT NULL)''')
        db.execute('''CREATE TABLE IF NOT EXISTS auth_limits (
            bucket TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at TIMESTAMPTZ NOT NULL)''')
    yield


app = FastAPI(title='OnlyDevOps API', lifespan=lifespan)


@app.middleware('http')
async def protect_requests(request: Request, call_next):
    if request.method in {'POST', 'PUT', 'DELETE', 'PATCH'}:
        origin = request.headers.get('origin')
        if (request.headers.get('sec-fetch-site') == 'cross-site' or
                (origin and urlsplit(origin).netloc != request.headers.get('host'))):
            return JSONResponse({'detail': 'Request origin is not allowed.'}, status_code=403)
        if request.headers.get('content-type', '').split(';')[0] != 'application/json':
            return JSONResponse({'detail': 'JSON requests are required.'}, status_code=415)
    response = await call_next(request)
    if request.url.path.startswith('/api/'):
        response.headers['Cache-Control'] = 'no-store'
    return response


def learner_id(value):
    try:
        return UUID(value) if value else None
    except (ValueError, TypeError):
        return None


def cookie(response, name, value, max_age):
    response.set_cookie(name, value, httponly=True, samesite='strict',
                        secure=os.getenv('COOKIE_SECURE') == 'true', max_age=max_age)


def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def account(db, request):
    token = request.cookies.get('onlydevops_session')
    if not token:
        return None
    return db.execute('''SELECT a.id, a.username FROM sessions s JOIN accounts a ON a.id = s.account_id
                         WHERE s.token_hash = %s AND s.expires_at > now()''', (token_hash(token),)).fetchone()


def guest(db, request):
    value = learner_id(request.cookies.get('onlydevops_learner'))
    # An account ID is never accepted as an anonymous bearer cookie.
    if value and db.execute('SELECT 1 FROM accounts WHERE id = %s', (value,)).fetchone():
        return None
    return value


def password_hash(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=32768,
                            r=8, p=3, maxmem=64*1024*1024).hex()
    return salt + ':' + digest


DUMMY_HASH = password_hash('dummy-password-for-timing')


def valid_password(password, encoded):
    return hmac.compare_digest(password_hash(password, encoded.split(':')[0]), encoded)


class Credentials(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=12, max_length=128)


def normalized_username(value):
    value = value.strip().lower()
    if not re.fullmatch(r'[a-z0-9_]{3,32}', value):
        raise HTTPException(422, 'Use 3–32 letters, numbers, or underscores for your username.')
    return value


def rate_limit(request, username):
    # Nginx overwrites X-Real-IP; the API is not exposed on a host port.
    ip = request.headers.get('x-real-ip') or request.client.host
    exceeded = False
    with connect() as db:
        db.execute('DELETE FROM auth_limits WHERE expires_at <= now()')
        for key, limit in [('ip:' + ip, 60), ('user:' + username, 15)]:
            row = db.execute('''INSERT INTO auth_limits(bucket, attempts, expires_at)
                VALUES (%s, 1, now() + interval '15 minutes')
                ON CONFLICT(bucket) DO UPDATE SET attempts = auth_limits.attempts + 1
                RETURNING attempts''', (key,)).fetchone()
            exceeded |= row[0] > limit
    if exceeded:
        raise HTTPException(429, 'Too many attempts. Try again in 15 minutes.')


def start_session(db, request, response, user):
    anonymous = guest(db, request)
    if anonymous:
        db.execute('''INSERT INTO progress(learner, item_id, completed_at)
            SELECT %s, item_id, completed_at FROM progress WHERE learner = %s
            ON CONFLICT DO NOTHING''', (user[0], anonymous))
        db.execute('DELETE FROM progress WHERE learner = %s', (anonymous,))
    old_token = request.cookies.get('onlydevops_session')
    if old_token:
        db.execute('DELETE FROM sessions WHERE token_hash = %s', (token_hash(old_token),))
    db.execute('DELETE FROM sessions WHERE expires_at <= now()')
    token = secrets.token_urlsafe(32)
    db.execute("INSERT INTO sessions VALUES (%s, %s, now() + interval '30 days')", (token_hash(token), user[0]))
    cookie(response, 'onlydevops_session', token, SESSION_SECONDS)
    response.delete_cookie('onlydevops_learner')
    return {'user': {'username': user[1]}}


@app.post('/api/auth/register', status_code=201)
def register(body: Credentials, request: Request, response: Response):
    username = normalized_username(body.username)
    rate_limit(request, username)
    encoded = password_hash(body.password)
    try:
        with connect() as db:
            user = db.execute('INSERT INTO accounts(id, username, password_hash) VALUES (%s, %s, %s) RETURNING id, username',
                              (uuid4(), username, encoded)).fetchone()
            return start_session(db, request, response, user)
    except psycopg.errors.UniqueViolation:
        raise HTTPException(409, 'That username is taken. Choose another or sign in.')


@app.post('/api/auth/login')
def login(body: Credentials, request: Request, response: Response):
    username = normalized_username(body.username)
    rate_limit(request, username)
    with connect() as db:
        user = db.execute('SELECT id, username, password_hash FROM accounts WHERE username = %s', (username,)).fetchone()
        matches = valid_password(body.password, user[2] if user else DUMMY_HASH)
        if not user or not matches:
            raise HTTPException(401, 'Username or password is incorrect.')
        return start_session(db, request, response, user)


@app.post('/api/auth/logout')
def logout(request: Request, response: Response):
    token = request.cookies.get('onlydevops_session')
    if token:
        with connect() as db:
            db.execute('DELETE FROM sessions WHERE token_hash = %s', (token_hash(token),))
    response.delete_cookie('onlydevops_session')
    cookie(response, 'onlydevops_learner', str(uuid4()), 60*60*24*365)
    return {'ok': True}


@app.get('/api/health')
def health():
    with connect() as db:
        db.execute('SELECT 1')
    return {'status': 'ok'}


@app.get('/api/sheet')
def sheet(request: Request, response: Response):
    with connect() as db:
        user = account(db, request)
        learner = user[0] if user else guest(db, request) or uuid4()
        if not user:
            cookie(response, 'onlydevops_learner', str(learner), 60*60*24*365)
            if request.cookies.get('onlydevops_session'):
                response.delete_cookie('onlydevops_session')
        rows = db.execute('SELECT item_id FROM progress WHERE learner = %s', (learner,)).fetchall()
    return {'topics': SYLLABUS, 'completed': [r[0] for r in rows if r[0] in ITEM_IDS],
            'learner': str(learner), 'user': {'username': user[1]} if user else None}


class ProgressUpdate(BaseModel):
    completed: StrictBool


@app.put('/api/progress/{item_id}')
def update(item_id: str, body: ProgressUpdate, request: Request):
    if item_id not in ITEM_IDS:
        raise HTTPException(404, 'Checklist item not found.')
    with connect() as db:
        user = account(db, request)
        if request.cookies.get('onlydevops_session') and not user:
            raise HTTPException(401, 'Your session expired. Sign in again.')
        learner = user[0] if user else guest(db, request)
        if not learner:
            raise HTTPException(401, 'Open your sheet before updating progress.')
        expected = request.headers.get('x-learner')
        if expected and expected != str(learner):
            raise HTTPException(409, 'Your account changed. Refresh your sheet and try again.')
        if body.completed:
            db.execute('INSERT INTO progress (learner, item_id) VALUES (%s, %s) ON CONFLICT DO NOTHING', (learner, item_id))
        else:
            db.execute('DELETE FROM progress WHERE learner = %s AND item_id = %s', (learner, item_id))
    return {'item_id': item_id, 'completed': body.completed}
