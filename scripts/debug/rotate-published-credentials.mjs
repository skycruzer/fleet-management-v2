#!/usr/bin/env node
/**
 * One-off remediation: rotate the two account passwords that were published in this public repo.
 *
 * Both were verified still live (the stored admin hash matched the one committed in migration
 * 20251228080938). This generates strong random replacements, writes them to a gitignored local
 * file, and revokes each account's active sessions so anything created with the old password dies.
 *
 * Passwords are never printed to stdout — only written to `.env.rotated-credentials.local`.
 *
 * Usage: node --env-file=.env.local scripts/debug/rotate-published-credentials.mjs
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import fs from 'node:fs'

const ROUNDS = 10 // matches BCRYPT_SALT_ROUNDS in lib/constants/auth.ts

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(url, key)

const TARGETS = [
  { email: 'skycruzer@icloud.com', label: 'ADMIN — dashboard login at /auth/login' },
  { email: 'mrondeau@airniugini.com.pg', label: 'PILOT — portal login at /portal/login' },
]

// 24 random bytes -> 32 base64url chars. No ambiguous characters, no shell-quoting hazards.
const strongPassword = () => crypto.randomBytes(24).toString('base64url')

const lines = [
  '# Rotated credentials — production-readiness remediation, 2026-07-28.',
  '# The previous passwords were published in the public GitHub repo and verified still live.',
  '# Log in with these, then change them to something you choose. Delete this file afterwards.',
  "# Matches .gitignore's `.env*` rule — NOT tracked by git.",
  '',
]

let allOk = true

for (const target of TARGETS) {
  const password = strongPassword()
  const hash = await bcrypt.hash(password, ROUNDS)

  const { error } = await db
    .from('an_users')
    .update({ password_hash: hash })
    .eq('email', target.email)

  if (error) {
    console.log(`${target.email}: UPDATE FAILED — ${error.message}`)
    allOk = false
    continue
  }

  // Read back and verify rather than trusting the write
  const { data: after } = await db
    .from('an_users')
    .select('id, password_hash')
    .eq('email', target.email)
    .single()

  const verified = after?.password_hash
    ? await bcrypt.compare(password, after.password_hash)
    : false
  if (!verified) allOk = false

  let revokedAdmin = 0
  let revokedPilot = 0
  if (after?.id) {
    const { count: ra } = await db
      .from('admin_sessions')
      .update({ is_active: false }, { count: 'exact' })
      .eq('admin_user_id', after.id)
      .eq('is_active', true)
    revokedAdmin = ra ?? 0

    const { count: rp } = await db
      .from('pilot_sessions')
      .update({ is_active: false }, { count: 'exact' })
      .eq('pilot_user_id', after.id)
      .eq('is_active', true)
    revokedPilot = rp ?? 0
  }

  console.log(
    `${target.email}: rotated=true new_password_verified=${verified} ` +
      `sessions_revoked(admin=${revokedAdmin}, pilot=${revokedPilot})`
  )

  lines.push(`# ${target.label}`, `email: ${target.email}`, `password: ${password}`, '')
}

fs.writeFileSync('.env.rotated-credentials.local', lines.join('\n'), { mode: 0o600 })
console.log('\nNew passwords written to .env.rotated-credentials.local (mode 600, gitignored).')
process.exit(allOk ? 0 : 1)
