#!/usr/bin/env node
/**
 * Remediation helper: rotate account passwords that were published or lost.
 *
 * Writes strong random replacements to a gitignored local file and revokes
 * active sessions. Passwords are never printed to stdout.
 *
 * IMPORTANT — credential stores are separate by portal:
 *   - Admin / manager dashboard (`/auth/login`) → `an_users.password_hash`
 *   - Pilot portal (`/portal/login`)            → `pilot_users.password_hash`
 * Dual-role users can share a UUID across both tables but keep independent hashes.
 * Pilot portal login uses Staff ID (`employee_id`), not email.
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

/**
 * Targets to rotate. Each entry must declare which credential store to write.
 *
 * @typedef {'an_users' | 'pilot_users'} CredentialStore
 * @type {Array<{
 *   label: string
 *   store: CredentialStore
 *   email?: string
 *   staffId?: string
 * }>}
 */
const TARGETS = [
  {
    label: 'ADMIN — dashboard login at /auth/login (email field)',
    store: 'an_users',
    email: 'skycruzer@icloud.com',
  },
  {
    label: 'PILOT — portal login at /portal/login (Staff ID field, not email)',
    store: 'pilot_users',
    staffId: '2393',
  },
]

// 24 random bytes -> 32 base64url chars. No ambiguous characters, no shell-quoting hazards.
const strongPassword = () => crypto.randomBytes(24).toString('base64url')

const lines = [
  `# Rotated credentials — ${new Date().toISOString().slice(0, 10)}.`,
  '# Log in with these, then change them to something you choose. Delete this file afterwards.',
  "# Matches .gitignore's `.env*` rule — NOT tracked by git.",
  '# Pilot portal: use staff_id as the login identifier (not email).',
  '',
]

let allOk = true

for (const target of TARGETS) {
  const password = strongPassword()
  const hash = await bcrypt.hash(password, ROUNDS)

  if (target.store === 'an_users') {
    const email = target.email?.toLowerCase()
    if (!email) {
      console.log(`${target.label}: missing email for an_users target`)
      allOk = false
      continue
    }

    const { error } = await db.from('an_users').update({ password_hash: hash }).eq('email', email)
    if (error) {
      console.log(`${email}: an_users UPDATE FAILED — ${error.message}`)
      allOk = false
      continue
    }

    const { data: after } = await db
      .from('an_users')
      .select('id, password_hash')
      .eq('email', email)
      .single()

    const verified = after?.password_hash
      ? await bcrypt.compare(password, after.password_hash)
      : false
    if (!verified) allOk = false

    let revokedAdmin = 0
    if (after?.id) {
      const { count: ra } = await db
        .from('admin_sessions')
        .update({ is_active: false }, { count: 'exact' })
        .eq('admin_user_id', after.id)
        .eq('is_active', true)
      revokedAdmin = ra ?? 0
    }

    await db.from('failed_login_attempts').delete().eq('email', email)

    console.log(
      `${email}: store=an_users rotated=true verified=${verified} sessions_revoked(admin=${revokedAdmin})`
    )

    lines.push(`# ${target.label}`, `email: ${email}`, `password: ${password}`, '')
    continue
  }

  // pilot_users — portal login matches employee_id (staff ID)
  const staffId = target.staffId
  if (!staffId) {
    console.log(`${target.label}: missing staffId for pilot_users target`)
    allOk = false
    continue
  }

  const { data: pilot, error: findError } = await db
    .from('pilot_users')
    .select('id, email, employee_id, password_hash')
    .eq('employee_id', staffId)
    .single()

  if (findError || !pilot) {
    console.log(
      `staff ${staffId}: pilot_users LOOKUP FAILED — ${findError?.message || 'not found'}`
    )
    allOk = false
    continue
  }

  const { error } = await db
    .from('pilot_users')
    .update({ password_hash: hash })
    .eq('id', pilot.id)

  if (error) {
    console.log(`staff ${staffId}: pilot_users UPDATE FAILED — ${error.message}`)
    allOk = false
    continue
  }

  const { data: after } = await db
    .from('pilot_users')
    .select('id, email, employee_id, password_hash')
    .eq('id', pilot.id)
    .single()

  const verified = after?.password_hash
    ? await bcrypt.compare(password, after.password_hash)
    : false
  if (!verified) allOk = false

  let revokedPilot = 0
  if (after?.id) {
    const { count: rp } = await db
      .from('pilot_sessions')
      .update({ is_active: false }, { count: 'exact' })
      .eq('pilot_user_id', after.id)
      .eq('is_active', true)
    revokedPilot = rp ?? 0
  }

  await db.from('failed_login_attempts').delete().eq('email', staffId)
  if (after?.email) {
    await db.from('failed_login_attempts').delete().eq('email', after.email)
  }

  console.log(
    `staff ${staffId}: store=pilot_users rotated=true verified=${verified} sessions_revoked(pilot=${revokedPilot})`
  )

  lines.push(
    `# ${target.label}`,
    `staff_id: ${staffId}`,
    `email: ${after?.email || pilot.email}  # profile only — login field is Staff ID`,
    `password: ${password}`,
    ''
  )
}

fs.writeFileSync('.env.rotated-credentials.local', lines.join('\n'), { mode: 0o600 })
console.log('\nNew passwords written to .env.rotated-credentials.local (mode 600, gitignored).')
process.exit(allOk ? 0 : 1)
