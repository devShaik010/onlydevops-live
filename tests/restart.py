"""Optional persistence test. Restarts this project's API and database containers."""
import subprocess
import time
from smoke import SmokeTests

client = SmokeTests()
client.setUp()
item = 'linux-0-0-0'
client.request('/api/sheet')
try:
    client.request('/api/progress/' + item, {'completed': True})
    subprocess.run(['docker', 'compose', 'restart', 'db', 'api'], check=True)
    for attempt in range(60):
        try:
            sheet = client.request('/api/sheet')
            break
        except Exception:
            time.sleep(1)
    else:
        raise RuntimeError('Stack did not recover after restart')
    assert item in sheet['completed'], 'Progress was lost after restart'
    print('PASS: PostgreSQL progress survives database and API restarts')
finally:
    client.request('/api/progress/' + item, {'completed': False})
