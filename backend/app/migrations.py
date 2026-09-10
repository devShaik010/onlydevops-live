"""Additive, transactional migrations. Never edit an applied migration."""

MIGRATIONS = [
    ('001_practice_progress', '''CREATE TABLE practice_progress (
        learner UUID NOT NULL,
        challenge_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        choice_id TEXT NOT NULL,
        correct BOOLEAN NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (learner, challenge_id)
    )'''),
]


def migrate(db):
    # Serialize startup across API workers; the lock lasts for this transaction.
    db.execute('SELECT pg_advisory_xact_lock(72638104)')
    db.execute('''CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )''')
    for name, sql in MIGRATIONS:
        if not db.execute('SELECT 1 FROM schema_migrations WHERE name = %s', (name,)).fetchone():
            db.execute(sql)
            db.execute('INSERT INTO schema_migrations(name) VALUES (%s)', (name,))
