#!/usr/bin/env node
/**
 * Guard: no NEW ad-hoc SQL that disables Row Level Security.
 *
 * Background: `public.pilot_users` — the pilot portal's credential store, holding bcrypt
 * password hashes and full pilot PII — was readable with the public anon key that ships in
 * every browser bundle. One of the two causes was RLS being off on that table, and
 * `fix-all-rls-policies.sql:76` (`ALTER TABLE pilot_users DISABLE ROW LEVEL SECURITY`) is the
 * most plausible origin: a dozen ad-hoc scripts at the repo root were evidently pasted into
 * the SQL editor by hand over time.
 *
 * This does NOT fail on the existing scripts — they are grandfathered below and carry a DANGER
 * banner. It fails when a NEW one appears, so the pattern cannot quietly return.
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

/** Scripts that already contained a DISABLE when this guard was introduced. */
const GRANDFATHERED = new Set([
  'COMPLETE-FIX-SQL.sql',
  'CREATE-TABLES-AND-FIX-RLS.sql',
  'DISABLE_RLS_TEMPORARILY.sql',
  'FIX_CRITICAL_ERRORS.sql',
  'final-rls-fix.sql',
  'fix-all-rls-policies.sql',
  'fix-an-users-rls-policies.sql',
  're-enable-rls-FINAL.sql',
  're-enable-rls-step-by-step.sql',
  'scripts/enable-rls-safe.sql',
])

const DISABLE_RLS = /DISABLE\s+ROW\s+LEVEL\s+SECURITY/i

const files = execFileSync('git', ['ls-files', '*.sql'], { encoding: 'utf8' })
  .split('\n')
  .map((f) => f.trim())
  .filter(Boolean)
  .filter((f) => !f.startsWith('supabase/migrations/'))

const offenders = []
for (const file of files) {
  if (GRANDFATHERED.has(file)) continue
  let body
  try {
    body = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  // Ignore the pattern when it appears inside a comment line.
  const hit = body
    .split('\n')
    .some((line) => DISABLE_RLS.test(line) && !line.trimStart().startsWith('--'))
  if (hit) offenders.push(file)
}

if (offenders.length > 0) {
  console.error('\n✖ New SQL that disables Row Level Security:\n')
  for (const f of offenders) console.error(`    ${f}`)
  console.error(
    '\n  RLS protects tables holding bcrypt password hashes and pilot PII from the public\n' +
      '  anon key. Put schema/RLS changes in supabase/migrations/ where they are reviewed,\n' +
      '  rather than in an ad-hoc script that can be pasted into the SQL editor.\n' +
      '  If this is genuinely intentional, add the file to GRANDFATHERED in this script\n' +
      '  and say why in the PR.\n'
  )
  process.exit(1)
}

const stale = [...GRANDFATHERED].filter((f) => !files.includes(f))
if (stale.length > 0) {
  console.log(`✓ No new RLS-disabling SQL. (${stale.length} grandfathered file(s) now removed:`)
  for (const f of stale) console.log(`    ${f}`)
  console.log('  — safe to drop from GRANDFATHERED.)')
} else {
  console.log(`✓ No new RLS-disabling SQL (${GRANDFATHERED.size} grandfathered).`)
}
