import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('atomic pilot password reset migration', () => {
  it('consumes the token and revokes database login state in one transaction', () => {
    const sql = readFileSync(
      path.resolve(
        process.cwd(),
        'supabase/migrations/20260731163000_atomic_pilot_password_reset.sql'
      ),
      'utf8'
    )

    expect(sql).toMatch(/create or replace function public\.consume_pilot_password_reset/i)
    expect(sql).toMatch(/for update/i)
    expect(sql).toMatch(/update public\.pilot_users/i)
    expect(sql).toMatch(/update public\.pilot_sessions/i)
    expect(sql).toMatch(/delete from public\.account_lockouts/i)
    expect(sql).toMatch(/revoke all on function/i)
    expect(sql).toMatch(/grant execute on function.*to service_role/i)
  })
})
