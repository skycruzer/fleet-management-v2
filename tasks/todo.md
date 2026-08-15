# Repo cleanup — remove dead Claude Code / dev-scratch artifacts (2026-08-15)

Goal: remove files and folders that are no longer required, without destroying
anything unrecoverable. Tracked files are removed via `git rm` so every deletion
stays recoverable from git history.

## Tier 1 — untracked / gitignored bulk (NOT done here — needs approval)

These live only in the working checkout, so deleting them is irreversible. They
were deliberately left in place; see the PR description and final report.

- [ ] `.claude/worktrees/*` — 7 idle worktrees (~1.5 GB). Branches are unmerged,
      so worktree dirs are disposable but **branches must be kept**.
      `deep-review-fixes` is EXCLUDED — a live session is running in it (pid 67594).
- [ ] `.next/` (329 MB), `storybook-static/`, `playwright-report/`, `test-results/`,
      `screenshots/` (69 MB), `test-screenshots/`, `.playwright-mcp/` (8.7 MB),
      `scratch/`, `firebase-debug.log`, `tsconfig.tsbuildinfo` — all regenerable.
- [ ] `claude-talk-to-figma-mcp/` (86 MB) — untracked AND not gitignored, and not
      referenced by `.mcp.json`. Flagged only; user decides.

## Tier 2 — tracked junk (DONE in this branch, recoverable via git)

- [x] Cloud-sync duplicate copies (`<name> N.<ext>`) — the `.gitignore` patterns
      never untracked the copies already in the index.
- [x] Root-level debug/test screenshots (PNG).
- [x] One-off SQL fix/patch scripts at repo root (schema of record is
      `supabase/migrations/`).
- [x] Root-level one-off `test-*.js` / `test_*.py` scripts — the real suites are
      `tests/`, `e2e/` (Playwright/Vitest, wired into package.json).
- [x] Captured command output committed as files (`build-output.txt`,
      `lint-output.txt`, `deploy-log.txt`, `type-check-output.txt`).
- [x] One-off shell scripts at root superseded by npm scripts / CI.
- [x] 27 AI-tool skill fan-out dirs (`.adal`, `.augment`, … ) — symlinks into
      `.agents/skills/`; the real content stays.
- [x] `.DS_Store`, empty `cookies.txt`.

## Verification

- [x] `git grep` for references before removing (only `DATABASE-INDEXES.sql` is
      cited, by a historical audit report — noted, not a build dependency).
- [x] No `package.json` script references any removed file.
- [ ] `npm run build` after removal.
