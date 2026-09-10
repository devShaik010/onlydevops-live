"""Integration checks against the running three-tier stack (stdlib only)."""
import http.cookiejar
import json
import os
import unittest
import urllib.request
import urllib.error

BASE = os.getenv('BASE_URL', 'http://localhost:8080')

class SmokeTests(unittest.TestCase):
    def setUp(self):
        self.client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def request(self, path, body=None, client=None):
        req = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body is not None else None,
            headers={'Content-Type': 'application/json'}, method='PUT' if body is not None else 'GET')
        with (client or self.client).open(req) as r:
            return json.load(r)

    def test_health(self):
        self.assertEqual(self.request('/api/health'), {'status':'ok'})

    def test_progress_isolation_validation_and_undo(self):
        sheet = self.request('/api/sheet')
        self.assertEqual([t['id'] for t in sheet['topics']], ['linux', 'shell', 'git', 'docker', 'kubernetes', 'cicd', 'jenkins', 'github-actions', 'gitops', 'argocd', 'terraform'])
        ids = [i['id'] for t in sheet['topics'] for s in t['sections'] for c in s['commands'] for i in c['items']]
        self.assertEqual(len(ids), len(set(ids)))
        item = ids[0]
        try:
            for _ in range(2):
                self.request('/api/progress/' + item, {'completed':True})
            self.assertEqual(self.request('/api/sheet')['completed'], [item])
            other = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
            self.assertEqual(self.request('/api/sheet', client=other)['completed'], [])
            for path,body,status in [('/api/progress/unknown',{'completed':True},404),('/api/progress/'+item,{'completed':'yes'},422)]:
                with self.assertRaises(urllib.error.HTTPError) as ctx:
                    self.request(path, body)
                self.assertEqual(ctx.exception.code, status)
        finally:
            self.request('/api/progress/'+item, {'completed':False})
        self.assertEqual(self.request('/api/sheet')['completed'], [])

    def test_session_required(self):
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            self.request('/api/progress/linux-0-0-0', {'completed':True})
        self.assertEqual(ctx.exception.code, 401)

if __name__ == '__main__':
    unittest.main(verbosity=2)
