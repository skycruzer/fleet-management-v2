import { beforeEach, describe, expect, it, vi } from 'vitest'
import bcrypt from 'bcryptjs'

const createAdminClientMock = vi.fn()
const destroyAllUserSessionsMock = vi.fn()
const revokePilotSessionMock = vi.fn()
const rpcMock = vi.fn()

function resetTokenQuery(result: unknown) {
  const query: Record<string, any> = {}
  query.select = vi.fn(() => query)
  query.eq = vi.fn(() => query)
  query.single = vi.fn().mockResolvedValue(result)
  return query
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/lib/services/session-service', () => ({
  createPilotSession: vi.fn(),
  validatePilotSession: vi.fn(),
  revokePilotSession: revokePilotSessionMock,
}))

vi.mock('@/lib/services/redis-session-service', () => ({
  destroyAllUserSessions: destroyAllUserSessionsMock,
}))

describe('pilot password reset', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    createAdminClientMock.mockReturnValue({
      from: vi.fn(() =>
        resetTokenQuery({
          data: {
            user_id: 'pilot-id',
            expires_at: new Date(Date.now() + 60_000).toISOString(),
            used_at: null,
            pilot_users: { email: 'pilot@example.com' },
          },
          error: null,
        })
      ),
      rpc: rpcMock.mockResolvedValue({
        data: { userId: 'pilot-id', staffId: '2393', email: 'pilot@example.com' },
        error: null,
      }),
    })
    destroyAllUserSessionsMock.mockResolvedValue({
      redisCleared: true,
      dbDeactivated: true,
      failures: [],
    })
  })

  it('uses the atomic reset RPC and revokes Redis sessions before reporting success', async () => {
    const client = createAdminClientMock()
    createAdminClientMock.mockReturnValue(client)
    const { resetPassword } = await import('@/lib/services/pilot-portal-service')

    const result = await resetPassword('reset-token', 'StrongPassword1')

    expect(result.success).toBe(true)
    expect(client.rpc).toHaveBeenCalledWith(
      'consume_pilot_password_reset',
      expect.objectContaining({
        p_token: 'reset-token',
        p_password_hash: expect.any(String),
      })
    )
    expect(destroyAllUserSessionsMock).toHaveBeenCalledWith(
      'pilot-id',
      'pilot_sessions',
      'pilot_user_id'
    )
  })

  it('does not report full success if Redis session revocation is incomplete', async () => {
    destroyAllUserSessionsMock.mockResolvedValue({
      redisCleared: false,
      dbDeactivated: true,
      failures: ['redis-pipeline'],
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { resetPassword } = await import('@/lib/services/pilot-portal-service')

    const result = await resetPassword('reset-token', 'StrongPassword1')

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/session revocation was incomplete/i)
  })

  it('rejects an invalid token before bcrypt hashing or the reset RPC', async () => {
    createAdminClientMock.mockReturnValue({
      from: vi.fn(() =>
        resetTokenQuery({
          data: null,
          error: { code: 'PGRST116', message: 'Token not found' },
        })
      ),
      rpc: rpcMock,
    })
    const hashSpy = vi.spyOn(bcrypt, 'hash')
    const { resetPassword } = await import('@/lib/services/pilot-portal-service')

    const result = await resetPassword('invalid-token', 'StrongPassword1')

    expect(result.success).toBe(false)
    expect(hashSpy).not.toHaveBeenCalled()
    expect(rpcMock).not.toHaveBeenCalled()
    hashSpy.mockRestore()
  })

  it('always clears the custom session during logout without pre-validating it', async () => {
    revokePilotSessionMock.mockResolvedValue({ success: true })
    createAdminClientMock.mockReturnValue({
      auth: {
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
    })
    const { pilotLogout } = await import('@/lib/services/pilot-portal-service')

    const result = await pilotLogout()

    expect(result.success).toBe(true)
    expect(revokePilotSessionMock).toHaveBeenCalledWith('', 'User logout')
  })
})
