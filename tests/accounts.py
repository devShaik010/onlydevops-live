"""Account integration tests against the running Compose stack."""
import http.cookiejar
import json
import os
import subprocess
import unittest
import urllib.request
import urllib.error
from uuid import uuid4

BASE = os.getenv('BASE_URL', 'http://localhost:8080')
PASSWORD = 'test-password-long-enough'

def client():
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

def call(c, path, body=None, method=None, headers=None):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body is not None else None,
        headers={'Content-Type':'application/json', **(headers or {})}, method=method or ('POST' if body is not None else 'GET'))
    with c.open(req) as r:
        return json.load(r)

def sql(code, *args):
    subprocess.run(['docker','compose','exec','-T','api','python','-c',
        'import os,sys,psycopg\nwith psycopg.connect(os.environ["DATABASE_URL"]) as db:\n' + '\n'.join('    '+line for line in code.splitlines()), *args], check=True)

class Accounts(unittest.TestCase):
    def setUp(self):
        self.username = 'test_' + uuid4().hex[:16]
        self.credentials = {'username':self.username, 'password':PASSWORD}
        self.a, self.b = client(), client()

    def tearDown(self):
        sql('db.execute("DELETE FROM progress WHERE learner IN (SELECT id FROM accounts WHERE username = %s)", (sys.argv[1],))\ndb.execute("DELETE FROM accounts WHERE username = %s", (sys.argv[1],))\ndb.execute("DELETE FROM auth_limits WHERE bucket = %s", ("user:"+sys.argv[1],))', self.username)

    def fails(self, status, c, path, body=None, method=None, headers=None):
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            call(c,path,body,method,headers)
        self.assertEqual(ctx.exception.code,status)

    def test_guest_merge_sync_isolation_and_logout(self):
        call(self.a,'/api/sheet')
        call(self.a,'/api/progress/linux-0-0-0',{'completed':True},'PUT')
        call(self.a,'/api/auth/register',self.credentials)
        first=call(self.a,'/api/sheet')
        self.assertEqual(first['user']['username'],self.username)
        self.assertIn('linux-0-0-0',first['completed'])
        call(self.b,'/api/sheet')
        call(self.b,'/api/progress/linux-0-0-1',{'completed':True},'PUT')
        call(self.b,'/api/auth/login',{**self.credentials,'username':self.username.upper()})
        self.assertEqual(set(call(self.a,'/api/sheet')['completed']), {'linux-0-0-0','linux-0-0-1'})
        call(self.b,'/api/progress/linux-0-0-0',{'completed':False},'PUT')
        self.assertEqual(call(self.a,'/api/sheet')['completed'],['linux-0-0-1'])
        outsider=client()
        forged=call(outsider,'/api/sheet',headers={'Cookie':'onlydevops_learner='+first['learner']})
        self.assertEqual(forged['completed'],[])
        self.fails(401,outsider,'/api/progress/linux-0-0-1',{'completed':False},'PUT',{'Cookie':'onlydevops_learner='+first['learner']})
        self.fails(409,self.a,'/api/progress/linux-0-0-1',{'completed':False},'PUT',{'X-Learner':str(uuid4())})
        jar = next(h.cookiejar for h in self.a.handlers if isinstance(h, urllib.request.HTTPCookieProcessor))
        old_token = next(c.value for c in jar if c.name == 'onlydevops_session')
        call(self.a,'/api/auth/logout',{})
        self.fails(401,client(),'/api/progress/linux-0-0-0',{'completed':True},'PUT',{'Cookie':'onlydevops_session='+old_token})
        self.assertIsNone(call(self.a,'/api/sheet')['user'])
        self.assertEqual(call(self.a,'/api/sheet')['completed'],[])
        self.assertEqual(call(self.b,'/api/sheet')['completed'],['linux-0-0-1'])
        call(self.a,'/api/auth/login',self.credentials)
        self.assertEqual(call(self.a,'/api/sheet')['completed'],['linux-0-0-1'])
        sql('row=db.execute("SELECT password_hash FROM accounts WHERE username = %s", (sys.argv[1],)).fetchone()\nassert row and sys.argv[2] not in row[0]\nassert db.execute("SELECT count(*) FROM sessions WHERE account_id IN (SELECT id FROM accounts WHERE username = %s)", (sys.argv[1],)).fetchone()[0] == 2',self.username,PASSWORD)

    def test_credentials_expiry_and_csrf(self):
        self.fails(422,self.a,'/api/auth/register',{**self.credentials,'password':'short'})
        call(self.a,'/api/auth/register',self.credentials)
        self.fails(409,self.b,'/api/auth/register',self.credentials)
        self.fails(401,self.b,'/api/auth/login',{**self.credentials,'password':'wrong-password-long'})
        self.fails(403,self.a,'/api/auth/logout',{},headers={'Origin':'https://unrelated.example'})
        sql('db.execute("UPDATE sessions SET expires_at = now() - interval \'1 second\' WHERE account_id IN (SELECT id FROM accounts WHERE username = %s)", (sys.argv[1],))', self.username)
        self.fails(401,self.a,'/api/progress/linux-0-0-0',{'completed':True},'PUT')
        self.assertIsNone(call(self.a,'/api/sheet')['user'])
        call(self.a,'/api/auth/login',self.credentials)
        self.assertEqual(call(self.a,'/api/sheet')['user']['username'],self.username)

    def test_auth_rate_limit(self):
        for _ in range(15):
            self.fails(401,self.a,'/api/auth/login',self.credentials)
        self.fails(429,self.a,'/api/auth/login',self.credentials)

if __name__ == '__main__':
    unittest.main(verbosity=2)
