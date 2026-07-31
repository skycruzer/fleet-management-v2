#!/usr/bin/env node
/**
 * Guard: no hardcoded credentials in tracked files
 *
 * Scans all git-tracked text files for:
 *   1. Known burned production credentials (rotated after the Jul-2026 exposure —
 *      they must never re-enter the tree).
 *   2. String literals assigned directly to a `password` field/variable, which is
 *      how the burned credentials got committed in the first place. Test fixtures
 *      must generate passwords per run or read them from the environment.
 *
 * Wired into `npm run validate`, so CI fails on regression.
 *
 * Usage: node scripts/check-no-hardcoded-credentials.mjs
 */

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Credentials that were committed to this (public) repository and later rotated.
// Never quote a live credential here — this list is for BURNED values only.
const BURNED_VALUES = ['mron2393', 'Lemakot@1972', 'admin123', 'Rondeau2024@']

// Files whose purpose is to LIST weak/burned passwords (common-password blocklists).
// Burned values are expected here; literal-assignment check still applies.
const BURNED_VALUE_ALLOWED_FILES = new Set([
  'components/auth/password-strength-meter.tsx',
  'lib/services/password-validation-service.ts',
])

// Deliberate non-credential placeholders allowed as password literals.
const PLACEHOLDERS = new Set([
  'weak',
  'wrongpassword',
  'wrong-password',
  'test-password',
  'Password123!', // negative-test value for a non-existent account (rate-limiting spec)
  'your-password-here',
  'your-test-password',
  '********',
  'changeme',
  'password',
])

const PASSWORD_LITERAL = /(?:password|PASSWORD)\s*[:=]\s*['"`]([^'"`$]{2,})['"`]/

const SELF = 'scripts/check-no-hardcoded-credentials.mjs'
const SKIP_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.pdf',
  '.woff',
  '.woff2',
  '.ttf',
  '.lock',
  '.db',
  '.snap',
])
const SKIP_FILES = new Set([SELF, 'package-lock.json'])

function trackedFiles() {
  return execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean)
}

function extname(path) {
  const base = path.split('/').pop()
  const dot = base.lastIndexOf('.')
  return dot === -1 ? '' : base.slice(dot)
}

const findings = []

for (const file of trackedFiles()) {
  if (SKIP_FILES.has(file) || SKIP_EXTENSIONS.has(extname(file))) continue

  let content
  try {
    content = readFileSync(file, 'utf8')
  } catch {
    continue // unreadable or non-text
  }
  if (content.includes(String.fromCharCode(0))) continue // binary

  const lines = content.split('\n')
  lines.forEach((line, i) => {
    for (const burned of BURNED_VALUES) {
      if (!BURNED_VALUE_ALLOWED_FILES.has(file) && line.includes(burned)) {
        findings.push(`${file}:${i + 1}: burned credential value present (rotated Jul-2026)`)
      }
    }
    const match = line.match(PASSWORD_LITERAL)
    if (match && !PLACEHOLDERS.has(match[1])) {
      findings.push(
        `${file}:${i + 1}: string literal assigned to password — use env vars or a per-run generated value`
      )
    }
  })
}

if (findings.length > 0) {
  console.error('❌ Hardcoded credential check failed:\n')
  for (const finding of findings) console.error(`  ${finding}`)
  console.error(
    '\nSee scripts/check-no-hardcoded-credentials.mjs. Burned values must never return; new code must read credentials from the environment.'
  )
  process.exit(1)
}

console.log('✅ No hardcoded credentials in tracked files')
