import { describe, expect, it } from 'vitest'
import { requireDefaultUserPassword } from '@/lib/services/auth-service'

describe('requireDefaultUserPassword', () => {
  it('throws when DEFAULT_USER_PASSWORD is not configured', () => {
    expect(() => requireDefaultUserPassword(undefined)).toThrow('DEFAULT_USER_PASSWORD')
    expect(() => requireDefaultUserPassword('')).toThrow('DEFAULT_USER_PASSWORD')
  })

  it('returns the configured default password', () => {
    expect(requireDefaultUserPassword('temporary-secure-password')).toBe(
      'temporary-secure-password'
    )
  })
})
