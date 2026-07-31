#!/usr/bin/env node
/**
 * One-off remediation: rotate the two account passwords that were published in this public repo.
 *
 * Both were verified still live (the stored admin hash matched the one committed in migration
 * 20251228080938). This generates strong random replacements, writes them to a gitignored local
 * file, and revokes each account's active sessions so anything created with the old password dies.
 *
 * Passwords are never printed to stdout. Before any database mutation they are written to a
 * unique, mode-0600 `.env.rotated-credentials.*.local` recovery artifact.
 *
 * Usage: node --env-file=.env.local scripts/debug/rotate-published-credentials.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { clearRedisUserSessions } from '../../lib/services/redis-session-cleanup.mjs'

const ROUNDS = 10 // matches BCRYPT_SALT_ROUNDS in lib/constants/auth.ts

const TARGETS = [
  {
    table: 'an_users',
    lookupColumn: 'email',
    lookupValue: 'skycruzer@icloud.com',
    label: 'ADMIN — dashboard login at /auth/login',
    loginField: 'email',
    sessionTable: 'admin_sessions',
    sessionUserIdColumn: 'admin_user_id',
  },
  {
    table: 'pilot_users',
    lookupColumn: 'employee_id',
    lookupValue: '2393',
    label: 'PILOT — portal login at /portal/login',
    loginField: 'staffId',
    loginColumn: 'employee_id',
    sessionTable: 'pilot_sessions',
    sessionUserIdColumn: 'pilot_user_id',
  },
]

// 24 random bytes -> 32 base64url chars. No ambiguous characters, no shell-quoting hazards.
const strongPassword = () => crypto.randomBytes(24).toString('base64url')

export async function rotatePublishedCredentials({
  env = process.env,
  args = process.argv.slice(2),
} = {}) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
    return 1
  }

  const redisUrl = env.UPSTASH_REDIS_REST_URL
  const redisToken = env.UPSTASH_REDIS_REST_TOKEN
  if (Boolean(redisUrl) !== Boolean(redisToken)) {
    console.error('Both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required together')
    return 1
  }
  if (!redisUrl && !args.includes('--confirm-no-redis')) {
    console.error(
      'Redis configuration is absent. Pass --confirm-no-redis only after verifying the target environment has no Upstash Redis.'
    )
    return 1
  }

  const db = createClient(url, key)
  const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null
  let allOk = true
  const resolvedTargets = []

  // Resolve every account and login identifier before changing either password. This prevents a
  // malformed later target from leaving the earlier account rotated without a usable handoff.
  for (const target of TARGETS) {
    const { data: account, error: lookupError } = await db
      .from(target.table)
      .select(`id, password_hash${target.loginColumn ? `, ${target.loginColumn}` : ''}`)
      .eq(target.lookupColumn, target.lookupValue)
      .single()

    const loginValue = target.loginColumn ? account?.[target.loginColumn] : target.lookupValue
    if (lookupError || !account?.id || !account.password_hash || !loginValue) {
      console.log(
        `${target.lookupValue}: PREFLIGHT FAILED — ${
          lookupError?.message ?? 'account ID, current password hash, or login identifier missing'
        }`
      )
      allOk = false
      continue
    }

    resolvedTargets.push({
      ...target,
      accountId: account.id,
      currentPasswordHash: account.password_hash,
      loginValue,
    })
  }

  if (!allOk) {
    return 1
  } else {
    const rotations = await Promise.all(
      resolvedTargets.map(async (target) => {
        const password = strongPassword()
        return {
          ...target,
          password,
          hash: await bcrypt.hash(password, ROUNDS),
        }
      })
    )

    const lines = [
      '# Credential rotation recovery artifact.',
      '# Written before database mutation so a generated password cannot be lost mid-run.',
      '# If the script exits nonzero, inspect its output: a listed credential may not be active.',
      '# Delete this file after the credentials have been delivered through a secure channel.',
      "# Matches .gitignore's `.env*` rule — NOT tracked by git.",
      '',
      ...rotations.flatMap((target) => [
        `# ${target.label}`,
        `${target.loginField}: ${target.loginValue}`,
        `password: ${target.password}`,
        '',
      ]),
    ]
    const timestamp = new Date().toISOString().replaceAll(':', '-')
    const recoveryPath = `.env.rotated-credentials.${timestamp}.${crypto
      .randomBytes(4)
      .toString('hex')}.local`

    try {
      fs.writeFileSync(recoveryPath, lines.join('\n'), {
        mode: 0o600,
        flag: 'wx',
      })
    } catch (artifactError) {
      console.error(
        `RECOVERY ARTIFACT WRITE FAILED — ${
          artifactError instanceof Error ? artifactError.message : String(artifactError)
        }`
      )
      allOk = false
    }

    if (allOk) {
      for (const target of rotations) {
        const { data: after, error: updateError } = await db
          .from(target.table)
          .update({ password_hash: target.hash })
          .eq('id', target.accountId)
          .eq('password_hash', target.currentPasswordHash)
          .select('id, password_hash')
          .single()

        if (updateError) {
          console.log(
            `${target.lookupValue}: UPDATE FAILED OR CONCURRENT ROTATION DETECTED — ${updateError.message}`
          )
          allOk = false
          continue
        }

        // Verify the exact row returned by the ID-scoped update.
        const verified = after?.password_hash
          ? await bcrypt.compare(target.password, after.password_hash)
          : false
        if (!verified) {
          console.log(`${target.lookupValue}: READ-BACK VERIFICATION FAILED`)
          allOk = false
          continue
        }

        let revokedSessions = 0
        let targetRemediationOk = true
        if (redis) {
          try {
            await clearRedisUserSessions(redis, target.accountId)
          } catch (redisError) {
            console.log(
              `${target.lookupValue}: REDIS SESSION REVOCATION FAILED — ${
                redisError instanceof Error ? redisError.message : String(redisError)
              }`
            )
            allOk = false
            targetRemediationOk = false
          }
        }

        const { count, error: sessionError } = await db
          .from(target.sessionTable)
          .update({ is_active: false }, { count: 'exact' })
          .eq(target.sessionUserIdColumn, target.accountId)
          .eq('is_active', true)
        if (sessionError) {
          console.log(
            `${target.lookupValue}: DATABASE SESSION REVOCATION FAILED — ${sessionError.message}`
          )
          allOk = false
          targetRemediationOk = false
        } else {
          revokedSessions = count ?? 0
        }

        for (const table of ['failed_login_attempts', 'account_lockouts']) {
          const { error: cleanupError } = await db
            .from(table)
            .delete()
            .eq('email', String(target.loginValue).trim().toLowerCase())
          if (cleanupError) {
            console.log(
              `${target.lookupValue}: ${table.toUpperCase()} CLEANUP FAILED — ${cleanupError.message}`
            )
            allOk = false
            targetRemediationOk = false
          }
        }

        if (targetRemediationOk) {
          console.log(
            `${target.lookupValue}: rotated=true new_password_verified=${verified} ` +
              `sessions_revoked=${revokedSessions}`
          )
        } else {
          console.log(
            `${target.lookupValue}: rotated=true new_password_verified=${verified} ` +
              'remediation_complete=false'
          )
        }
      }
      console.log(`\nRecovery credentials written to ${recoveryPath} (mode 600, gitignored).`)
    }
  }

  return allOk ? 0 : 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await rotatePublishedCredentials()
}
