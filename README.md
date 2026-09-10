# OnlyDevOps

A minimal DevOps syllabus tracker inspired by Striver’s sheet format. Open a topic, expand a section, and check off individual skills or command variations. No lesson pages, definitions, or examples.

## Run

```sh
docker compose up --build -d
```

Open **http://localhost:8080**. Docker Engine with Compose v2 is the only requirement. Optional settings are documented in `.env.example`; copy it to `.env` to change the port or database password before the first launch.

```sh
docker compose ps
docker compose logs -f
docker compose down
```

`down` preserves progress in the named PostgreSQL volume. `down -v` permanently deletes it.

## POC scope

Linux → Shell scripting → Git / GitHub → Docker → Kubernetes → CI / CD → Jenkins → GitHub Actions → GitOps → Argo CD → Terraform.

The initial syllabus has **452 items across 11 topics**. Each topic contains sections, command groups, and individually tracked items. For example: Linux → File & folder management → ls → `ls -a`, `ls -l`. Search works within the current topic. All / To do / Completed filters and section, topic, and overall counts use saved progress.

**Continue learning** opens and focuses the first unfinished item in the current topic, then checks later topics and wraps to earlier ones. It clears search and completion filters so the target is visible. A completed roadmap shows a completion message instead.

The last topic, expanded sections, filters, and scroll position are saved per topic in this browser. Reloading or returning to the root URL restores the view; an explicit topic link takes precedence. These view preferences are local to the browser (account checklist progress still syncs across devices). If browser storage is unavailable, the sheet remains usable without view persistence.

You can use the sheets as a guest or choose **Save my progress** to create an account. Usernames are case-insensitive (3–32 letters, numbers, or underscores); passwords require 12–128 characters. Sign in on another device to use the same progress. The current browser’s completed guest items merge into your account on registration or sign-in, without removing existing account checks. The guest copy is consumed after merging, so it cannot re-add old checks later.

Signed-in sheets refresh every 15 seconds while visible and when the window regains focus. Each checkbox writes independently; if two devices change the same item, the last successful write wins. Checkboxes update after a successful save and remain unchanged if saving fails. Signing out clears access on that device and opens a fresh guest sheet, while the account’s progress remains saved.

Guest progress still belongs to a browser cookie and can be lost when cookies are cleared. Account progress survives cleared cookies: sign in again to retrieve it. Password reset, username recovery, and email verification are not included yet; save credentials in a password manager.

## Architecture

```text
Browser → web:8080 (Nginx + React/Tailwind)
              → api:8000 (FastAPI)
                    → db:5432 (PostgreSQL 17 + named volume)
```

Only the web port is published. The API and database communicate on a private backend network. The frontend image uses a multi-stage build and an unprivileged Nginx runtime; the API runs as a non-root user with a read-only filesystem. Health checks gate startup. No host source mounts are needed.

- `frontend/src/`: responsive React UI and Tailwind/CSS styling.
- `backend/app/syllabus.json`: syllabus source of truth. Preserve existing item IDs when editing to retain saved progress. Add new unique IDs for new items.
- `backend/app/main.py`: API and idempotent initial schema creation.
- `docker-compose.yml`: all three services, networks, and persistent storage.

This is a working POC syllabus, not an exhaustive reference for every tool. Admin editing, versioned schema migrations, backups, and production TLS are future work. Before public deployment, set a strong database password, terminate HTTPS at your ingress, and set `COOKIE_SECURE=true`. Fonts (Inter, Space Grotesk, and JetBrains Mono) are self-hosted through Fontsource. Tool logos are vendored from [Devicon](https://github.com/devicons/devicon); attribution and license are in `frontend/public/logos/`. CI/CD and GitOps use workflow symbols because they are practices rather than products.

## Development & verification

```sh
npm --prefix frontend ci
npm --prefix frontend run dev
```

Vite proxies `/api` to the local Compose preview at port 8088. If your Compose stack uses another port, update the proxy target in `frontend/vite.config.js`.

The current local checkout uses `APP_PORT=8088` in its ignored `.env` because port 8080 is occupied. For this checkout, use `BASE_URL=http://localhost:8088` before each test command. Fresh clones default to port 8080.

With the Compose stack running:

```sh
python3 tests/smoke.py
python3 tests/accounts.py
cd frontend
npx playwright install chromium
npx playwright test
```

For an optional container restart persistence test, run `python3 tests/restart.py` (this restarts the API and database).

The smoke suite checks real PostgreSQL persistence through the API, isolation between browser sessions, idempotent checks, undo, and validation. Browser tests cover check/reload, filtering, navigation, mobile layout, and failed saves. Account tests also cover guest import, two-device sync, sign-out isolation, session expiry, wrong credentials, account-ID cookie forgery, and origin checks. Account tests require access to this Compose stack and remove only their own test accounts.

Container setup follows [FastAPI’s Docker guidance](https://fastapi.tiangolo.com/deployment/docker/) and [Compose health-based startup ordering](https://docs.docker.com/compose/how-tos/startup-order/).

Syllabus references: [OpenGitOps principles](https://opengitops.dev/), [Argo CD](https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/), and [Terraform CLI](https://developer.hashicorp.com/terraform/cli/commands).

## Account implementation

Passwords use salted scrypt hashes. Random 256-bit session tokens are stored as SHA-256 hashes in PostgreSQL, expire after 30 days, and are revoked on sign-out. Cookies are HTTP-only and SameSite=Strict. Mutations require JSON and reject foreign browser origins. Database-backed rate limits apply to authentication by username and IP. Nginx overwrites the client-IP header; keep the API private as configured in Compose.

Startup creates the account/session/rate-limit tables without replacing existing progress. All account data lives in the existing PostgreSQL volume. Set `COOKIE_SECURE=true` behind HTTPS in production. Session handling follows [OWASP guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
