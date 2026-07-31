import { describe, expect, it } from 'vitest'
import { PilotLoginSchema } from '@/lib/validations/pilot-portal-schema'

describe('PilotLoginSchema', () => {
  it('canonicalizes surrounding whitespace in the staff ID', () => {
    const result = PilotLoginSchema.parse({
      staffId: '  2393  ',
      password: 'Password1',
    })

    expect(result.staffId).toBe('2393')
  })
})
