#!/usr/bin/env node
/**
 * Guard: no NEW ad-hoc SQL that disables Row Level Security.
 *
 * Background: `public.pilot_users` — the pilot portal's credential store, holding bcrypt
 * password hashes and full pilot PII — was readable with the public anon key that ships in
 * every browser bundle. One of the two causes was RLS being off on that table, and
 * `fix-all-rls-policies.sql` (`ALTER TABLE pilot_users DISABLE ROW LEVEL SECURITY`) is the
 * most plausible origin: a dozen ad-hoc scripts at the repo root were evidently pasted into
 * the SQL editor by hand over time.
 *
 * This does NOT fail on the existing scripts — each is baselined below at its current count and
 * carries a DANGER banner. It fails when a NEW statement appears, including one appended to an
 * already-listed file, so the pattern cannot quietly return.
 *
 * `supabase/migrations/` is exempt: that is the source of truth, and a migration may legitimately
 * toggle RLS as part of a reviewed change.
 *
 * Run: node scripts/check-rls-guard.mjs
 */

import { readFileSync } from 'node:fs'
// execFileSync, not execSync: no shell is spawned, so nothing here can be
// interpreted as a shell metacharacter even if the glob ever becomes dynamic.
import { execFileSync } from 'node:child_process'

/**
 * Baseline of ACTIVE (non-commented) `DISABLE ROW LEVEL SECURITY` statements per legacy file.
 *
 * Counted, not exempted: a whole-file exemption would let a NEW disable be appended to any
 * listed file and still pass. Exceeding the recorded count fails the check; dropping below it
 * is fine and the number should be lowered (or the entry removed) in the same change.
 *
 * scripts/enable-rls-safe.sql is deliberately ABSENT — its only DISABLE is commented out.
 */
const BASELINE = new Map([
  ['COMPLETE-FIX-SQL.sql', 2],
  ['CREATE-TABLES-AND-FIX-RLS.sql', 2],
  ['DISABLE_RLS_TEMPORARILY.sql', 1],
  ['FIX_CRITICAL_ERRORS.sql', 1],
  ['final-rls-fix.sql', 1],
  ['fix-all-rls-policies.sql', 9],
  ['fix-an-users-rls-policies.sql', 1],
  ['re-enable-rls-FINAL.sql', 8],
  ['re-enable-rls-step-by-step.sql', 8],
])

const DISABLE_RLS = /DISABLE\s+ROW\s+LEVEL\s+SECURITY/gi

/**
 * Count active DISABLE statements, tolerating ones split across lines.
 *
 * PostgreSQL accepts arbitrary whitespace between keywords, so `DISABLE` can end one line and
 * `ROW LEVEL SECURITY` begin the next. A per-line matcher misses that. Line comments are stripped
 * first so a commented-out statement is not counted; block comments are stripped too. String and
 * dollar-quoted literals are left intact — a false positive inside one is far cheaper here than
 * a miss.
 */
function countActiveDisables(body) {
  const withoutComments = body
    .replace(/\/\*[\s\S]*?\*\//g, ' ') // block comments
    .split('\n')
    .map((line) => line.replace(/--.*$/, ' ')) // line comments
    .join('\n')
  return (withoutComments.match(DISABLE_RLS) || []).length
}

const files = execFileSync('git', ['ls-files', '*.sql'], { encoding: 'utf8' })
  .split('\n')
  .map((f) => f.trim())
  .filter(Boolean)
  .filter((f) => !f.startsWith('supabase/migrations/'))

const offenders = []
for (const file of files) {
  let body
  try {
    body = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  const count = countActiveDisables(body)
  if (count === 0) continue

  const allowed = BASELINE.get(file) ?? 0
  if (count > allowed) {
    offenders.push(
      allowed === 0
        ? `${file} (${count} statement${count === 1 ? '' : 's'})`
        : `${file} (${count} statements, baseline ${allowed})`
    )
  }
}

if (offenders.length > 0) {
  console.error('\n✖ New SQL that disables Row Level Security:\n')
  for (const f of offenders) console.error(`    ${f}`)
  console.error(
    '\n  RLS protects tables holding bcrypt password hashes and pilot PII from the public\n' +
      '  anon key. Put schema/RLS changes in supabase/migrations/ where they are reviewed,\n' +
      '  rather than in an ad-hoc script that can be pasted into the SQL editor.\n' +
      "  If this is genuinely intentional, raise the file's count in BASELINE in this\n" +
      '  script and say why in the PR.\n'
  )
  process.exit(1)
}

const stale = [...BASELINE.keys()].filter((f) => !files.includes(f))
if (stale.length > 0) {
  console.log(`✓ No new RLS-disabling SQL. ${stale.length} baselined file(s) now removed:`)
  for (const f of stale) console.log(`    ${f}`)
  console.log('  — drop them from BASELINE in the same change.')
} else {
  console.log(`✓ No new RLS-disabling SQL (${BASELINE.size} legacy files at baseline).`)
}
