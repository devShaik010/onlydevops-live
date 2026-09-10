"""Original, versioned practice content and public response serialization."""
import json
from pathlib import Path


def load_challenges():
    challenges = json.loads(Path(__file__).with_name('challenges.json').read_text())
    ids = set()
    topics = {t['id'] for t in json.loads(Path(__file__).with_name('syllabus.json').read_text())}
    for challenge in challenges:
        assert challenge['id'] not in ids, 'Duplicate challenge ID'
        ids.add(challenge['id'])
        assert challenge['topic'] in topics, 'Unknown topic'
        assert isinstance(challenge['version'], int) and challenge['version'] > 0
        options = challenge['options']
        assert len(options) >= 2
        assert len({o['id'] for o in options}) == len(options), 'Duplicate option ID'
        assert challenge['answer'] in {o['id'] for o in options}, 'Missing answer'
        assert all(o['feedback'] and o['label'] for o in options)
        assert challenge['evidence'] and challenge['explanation'] and challenge['verification']
        assert all(s['url'].startswith('https://') for s in challenge['sources'])
    return {c['id']: c for c in challenges}


CHALLENGES = load_challenges()


def feedback(challenge, choice_id):
    option = next(o for o in challenge['options'] if o['id'] == choice_id)
    return {
        'choice_id': choice_id,
        'correct': choice_id == challenge['answer'],
        'answer': challenge['answer'],
        'feedback': option['feedback'],
        'explanation': challenge['explanation'],
        'verification': challenge['verification'],
        'sources': challenge['sources'],
    }


def public_challenge(challenge, progress=None):
    # Answers and explanations are returned only after an answer has been saved.
    result = {k: challenge[k] for k in ('id', 'version', 'topic', 'title', 'summary',
                                       'difficulty', 'minutes', 'brief', 'evidence', 'question')}
    result['options'] = [{'id': o['id'], 'label': o['label']} for o in challenge['options']]
    result['result'] = None
    if progress and progress[1] == challenge['version']:
        result['result'] = feedback(challenge, progress[2])
    return result
