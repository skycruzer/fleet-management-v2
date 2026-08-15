import { describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { PilotLoginSchema } from '@/lib/validations/pilot-portal-schema'

// Generated per run rather than hardcoded — see scripts/check-no-hardcoded-credentials.mjs.
// The value is filler: the schema only requires a non-empty string, and this test asserts
// staff-ID trimming, not anything about the password.
const TEST_PASSWORD = `Valid-password-${randomUUID()}`

describe('PilotLoginSchema', () => {
  it('canonicalizes surrounding whitespace in the staff ID', () => {
    const result = PilotLoginSchema.parse({
      staffId: '  2393  ',
      password: TEST_PASSWORD,
    })

    expect(result.staffId).toBe('2393')
  })
})
