"""Practice persistence, identity isolation, and guest import against Compose."""
import json
import unittest
import urllib.error
from uuid import uuid4
from accounts import client, call, sql, PASSWORD


class PracticeTests(unittest.TestCase):
    def setUp(self):
        self.a, self.b = client(), client()
        self.learners = []
        self.username = 'practice_' + uuid4().hex[:14]
        self.credentials = {'username': self.username, 'password': PASSWORD}
        self.sheet = self.open(self.a)
        self.item = self.sheet['challenges'][0]

    def open(self, browser):
        sheet = call(browser, '/api/practice')
        self.learners.append(sheet['learner'])
        return sheet

    def answer(self, browser, learner, choice='container-port', version=1, challenge='docker-upstream-port'):
        return call(browser, f'/api/practice/{challenge}/answer',
                    {'choice_id': choice, 'version': version}, headers={'X-Learner': learner})

    def tearDown(self):
        sql('''import json
for learner in json.loads(sys.argv[1]):
    db.execute("DELETE FROM practice_progress WHERE learner = %s", (learner,))
db.execute("DELETE FROM practice_progress WHERE learner IN (SELECT id FROM accounts WHERE username = %s)", (sys.argv[2],))
db.execute("DELETE FROM accounts WHERE username = %s", (sys.argv[2],))
db.execute("DELETE FROM auth_limits WHERE bucket = %s", ("user:" + sys.argv[2],))''', json.dumps(self.learners), self.username)

    def assert_status(self, status, fn):
        with self.assertRaises(urllib.error.HTTPError) as error:
            fn()
        self.assertEqual(error.exception.code, status)

    def test_save_retry_reload_and_guest_isolation(self):
        self.assertNotIn('answer', self.item)
        self.assertTrue(all('feedback' not in o for o in self.item['options']))
        wrong = self.answer(self.a, self.sheet['learner'], 'localhost')
        self.assertFalse(wrong['correct'])
        self.assertTrue(wrong['explanation'])
        self.assertEqual(self.open(self.a)['challenges'][0]['result']['choice_id'], 'localhost')
        self.assertTrue(self.answer(self.a, self.sheet['learner'])['correct'])
        self.assertTrue(self.answer(self.a, self.sheet['learner'])['correct'])
        self.assertTrue(self.open(self.a)['challenges'][0]['result']['correct'])
        self.assertIsNone(self.open(self.b)['challenges'][0]['result'])
        self.assertEqual(call(self.a, '/api/sheet')['completed'], [])
        sql('assert db.execute("SELECT count(*) FROM practice_progress WHERE learner = %s", (sys.argv[1],)).fetchone()[0] == 1', self.sheet['learner'])

    def test_validation_and_stale_identity(self):
        self.assert_status(422, lambda: self.answer(self.a, self.sheet['learner'], 'unknown'))
        self.assert_status(409, lambda: self.answer(self.a, self.sheet['learner'], version=99))
        self.assert_status(404, lambda: self.answer(self.a, self.sheet['learner'], challenge='unknown'))
        self.assert_status(401, lambda: self.answer(client(), self.sheet['learner']))
        self.assert_status(409, lambda: self.answer(self.a, str(uuid4())))
        self.assert_status(409, lambda: call(self.a, '/api/practice/docker-upstream-port/answer', {'choice_id': 'container-port', 'version': 1}))
        self.assert_status(403, lambda: call(self.a, '/api/practice/docker-upstream-port/answer',
            {'choice_id': 'container-port', 'version': 1}, headers={'Origin': 'https://unrelated.example', 'X-Learner': self.sheet['learner']}))
        self.assertIsNone(self.open(self.a)['challenges'][0]['result'])

    def test_migration_reentry_preserves_saved_answers(self):
        self.answer(self.a, self.sheet['learner'])
        sql('''from app.migrations import migrate
before = db.execute("SELECT * FROM practice_progress WHERE learner = %s", (sys.argv[1],)).fetchall()
migrate(db)
migrate(db)
after = db.execute("SELECT * FROM practice_progress WHERE learner = %s", (sys.argv[1],)).fetchall()
assert before == after
assert db.execute("SELECT count(*) FROM schema_migrations WHERE name = '001_practice_progress'").fetchone()[0] == 1''', self.sheet['learner'])

    def test_guest_import_account_sync_and_signout(self):
        self.answer(self.a, self.sheet['learner'])
        call(self.a, '/api/auth/register', self.credentials)
        account = self.open(self.a)
        self.assertTrue(account['challenges'][0]['result']['correct'])
        self.assert_status(409, lambda: self.answer(self.a, self.sheet['learner']))
        call(self.b, '/api/auth/login', self.credentials)
        self.assertTrue(self.open(self.b)['challenges'][0]['result']['correct'])
        self.answer(self.b, account['learner'], 'localhost')
        self.assertFalse(self.open(self.a)['challenges'][0]['result']['correct'])
        call(self.a, '/api/auth/logout', {})
        self.assertIsNone(self.open(self.a)['challenges'][0]['result'])
        self.assertFalse(self.open(self.b)['challenges'][0]['result']['correct'])
        sql('assert db.execute("SELECT count(*) FROM practice_progress WHERE learner = %s", (sys.argv[1],)).fetchone()[0] == 0', self.sheet['learner'])

    def test_newer_account_answer_wins_over_older_guest_answer(self):
        other = self.open(self.b)
        self.answer(self.b, other['learner'], 'localhost')
        call(self.a, '/api/auth/register', self.credentials)
        account = self.open(self.a)
        self.answer(self.a, account['learner'])
        call(self.b, '/api/auth/login', self.credentials)
        self.assertTrue(self.open(self.b)['challenges'][0]['result']['correct'])

    def test_expired_session_and_forged_account_cookie(self):
        call(self.a, '/api/auth/register', self.credentials)
        account = self.open(self.a)
        self.answer(self.a, account['learner'])
        forged = call(client(), '/api/practice', headers={'Cookie': 'onlydevops_learner=' + account['learner']})
        self.learners.append(forged['learner'])
        self.assertIsNone(forged['challenges'][0]['result'])
        sql('db.execute("UPDATE sessions SET expires_at = now() - interval \'1 second\' WHERE account_id = %s", (sys.argv[1],))', account['learner'])
        self.assert_status(401, lambda: self.answer(self.a, account['learner']))


if __name__ == '__main__':
    unittest.main(verbosity=2)
