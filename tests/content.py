"""Validate authored practice content without a server or third-party packages."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
from app.practice import CHALLENGES, feedback, public_challenge


class ContentTests(unittest.TestCase):
    def test_catalog_and_answers_are_consistent(self):
        self.assertGreaterEqual(len(CHALLENGES), 5)
        for challenge in CHALLENGES.values():
            with self.subTest(challenge=challenge['id']):
                public = public_challenge(challenge)
                self.assertIsNone(public['result'])
                self.assertNotIn('answer', public)
                self.assertTrue(all(set(o) == {'id', 'label'} for o in public['options']))
                results = [feedback(challenge, o['id']) for o in challenge['options']]
                self.assertEqual(sum(r['correct'] for r in results), 1)
                self.assertTrue(all(r['feedback'] and r['verification'] for r in results))

    def test_old_content_version_does_not_claim_a_current_result(self):
        challenge = next(iter(CHALLENGES.values()))
        row = (challenge['id'], challenge['version'] - 1, challenge['answer'])
        self.assertIsNone(public_challenge(challenge, row)['result'])
        row = (challenge['id'], challenge['version'], challenge['answer'])
        self.assertTrue(public_challenge(challenge, row)['result']['correct'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
