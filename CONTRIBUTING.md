# Working on OnlyDevOps

Use a feature branch for each change. Keep `main` as the reviewed integration branch. Do not force-push shared branches or replace another developer's uncommitted work.

```sh
git status
git fetch origin
git switch -c feat/short-description origin/main
```

Start only from a clean worktree. If existing work is unfinished, commit it on a checkpoint branch or use a separate worktree. Review staged file names and `git diff --cached` before committing. `.env`, dependencies, build output, browser traces, and database backups do not belong in commits.

## Checks and pull requests

Run `python3 tests/content.py` and `npm --prefix frontend run build`. Against a development Compose stack, run the smoke, account, practice, and Playwright suites listed in the README. Push the feature branch and open a pull request; GitHub Actions supplies the `verify` check. Inspect the diff and passing checks before merging. The workflow does not deploy or publish the application.

The repository owner should enable a branch rule requiring pull requests and the `verify` check for `main`, with force pushes and branch deletion disallowed. A workflow file alone does not enforce branch protection. This feature does not change repository-wide protection settings.

## Checkpoint before troubleshooting practice

The branch `backup/before-troubleshooting-2026-09-11` preserves the previously uncommitted tracker, accounts, tests, and product research at commit `ecd6d11`. The implementation is on `feat/troubleshooting-practice`; the historical branch and main history are retained.

An additional local repository bundle, PostgreSQL custom-format dump, and owner-only environment-settings copy were created outside the repository, in the owner's `onlydevops-backups/2026-09-11-before-troubleshooting` directory. The bundle was verified. The database archive was restored into a separate test database, and the practice migration was run twice there; fingerprints confirmed that all existing account, session, rate-limit, and checklist rows were unchanged. Keep an off-device backup as well. Git itself does not back up the database, `.env`, or other ignored files.

To inspect the checkpoint without changing the active worktree:

```sh
git worktree add ../onlydevops-checkpoint backup/before-troubleshooting-2026-09-11
```

Do not start that checkout's default Compose project alongside another checkout: the Compose project name and volume would be shared. Use an explicitly different project name and port for isolated verification.

If a feature must be rolled back, prefer a revert commit through a pull request. The practice migration is additive, so the checkpoint application can run with the extra practice tables present. Preserve those tables and their data. Review later migrations separately before rolling back across them; this guarantee does not cover arbitrary future changes.

Never use `docker compose down -v`, `git reset --hard`, or destructive database restores as a routine rollback. Restore a database archive into a separate database first, verify it, and make a deliberate recovery plan before replacing live data.
