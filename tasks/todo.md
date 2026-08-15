# Repo cleanup — remove dead scratch and session artifacts (2026-08-15)

Goal: remove files and folders no longer required, without destroying anything
unrecoverable. Tracked files go via `git rm`, so every deletion stays
recoverable from git history.

## Tier 2 — tracked junk (DONE, PR #83, 522 files / −85,311 lines)

- [x] **Pass 1 `ac13b18`** — root scratch: 27 one-off SQL, 22 debug screenshots,
      14 shell scripts, 10 test harnesses, 6 cloud-sync duplicates, 4 captured
      command outputs, 27 AI-tool symlink dirs, `.DS_Store`, empty `cookies.txt`.
- [x] **Pass 2 `46b3437`** — emptied the `check-rls-guard.mjs` BASELINE; all nine
      entries were the SQL files deleted in pass 1. No RLS-disabling SQL now
      exists outside `supabase/migrations/`.
- [x] **Pass 3 `adc9e19`** — `todos/`, `openspec/` + root `AGENTS.md`,
      `.specify/`, `.planning/`, 22 dated `docs/` session reports,
      `AUDIT-REPORT-2026-02-21.md`, `design-mockups/`, `expo/`, two `.claude`
      install docs.
- [x] **Pass 4 `46a793c`** — 225 of 234 `scripts/` files (only 9 are reachable);
      `.claude/README.md` + `.claude/AGENTS.md`; rewrote `docs/README.md`, which
      had indexed the deleted 2025-10-23 reports.

### Verification

- [x] `type-check`, `lint`, `prettier --check` pass in CI on every pass.
- [x] `check:rls` exit 0 (empty baseline); `validate:naming` exit 0.
- [x] Markdown link check: 6 broken → 1, and that one is pre-existing and points
      outside the repo.
- [x] No reference to any removed file in `tests/`, `e2e/`, `.github/`,
      `.husky/`, or `package.json`.
- [ ] Unit tests: **not run anywhere.** vitest workers time out in this local
      environment, and CI's test job is skipped (`NEXT_PUBLIC_SUPABASE_URL`
      unset). The one test importing a kept script was verified by hand.

## Blocked — needs the user to run it

- [ ] `.claude/worktrees/` — 7 idle worktrees (~1.5 GB) and the regenerable bulk
      (`.next`, `screenshots`, `storybook-static`, …, ~2 GB total). The auto-mode
      permission classifier blocks moving them to Trash; see the session report
      for the copy-pasteable commands. `deep-review-fixes` is EXCLUDED — a live
      session was running in it (pid 67594).
- [ ] `claude-talk-to-figma-mcp/` (86 MB) — gitignored third-party clone, user's call.

## Pre-existing, not fixed here

- [ ] `main` is red: PR #82's `check-no-hardcoded-credentials.mjs` rejects two
      pre-existing unit-test fixtures (`admin-auth-service.test.ts:60`,
      `pilot-login-schema.test.ts:8`). Needs its own change.
