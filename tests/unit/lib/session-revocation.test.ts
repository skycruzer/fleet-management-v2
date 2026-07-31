import { beforeEach, describe, expect, it, vi } from 'vitest'

const destroyRedisSessionMock = vi.fn()
const destroyAllUserSessionsMock = vi.fn()
const createServiceRoleClientMock = vi.fn()
const cookiesMock = vi.fn()
const rpcMock = vi.fn()

vi.mock('@/lib/services/redis-session-service', () => ({
  createRedisSession: vi.fn(),
  validateRedisSession: vi.fn(),
  destroyRedisSession: destroyRedisSessionMock,
  destroyAllUserSessions: destroyAllUserSessionsMock,
}))

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: createServiceRoleClientMock,
}))

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}))

describe('pilot session revocation wrappers', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    const updateQuery: Record<string, any> = {}
    updateQuery.update = vi.fn(() => updateQuery)
    updateQuery.eq = vi.fn(() => updateQuery)
    updateQuery.then = (
      resolve: (value: unknown) => unknown,
      reject: (reason: unknown) => unknown
    ) => Promise.resolve({ error: null }).then(resolve, reject)

    createServiceRoleClientMock.mockReturnValue({
      from: vi.fn(() => updateQuery),
      rpc: rpcMock.mockResolvedValue({ data: 2, error: null }),
    })
    cookiesMock.mockResolvedValue({
      delete: vi.fn(),
    })
  })

  it('does not report a single-session revocation as successful after partial cleanup', async () => {
    destroyRedisSessionMock.mockResolvedValue({
      cookieCleared: true,
      redisCleared: false,
      dbDeactivated: true,
      failures: ['redis-delete'],
    })
    const { revokePilotSession } = await import('@/lib/services/session-service')

    const result = await revokePilotSession('', 'Password changed')

    expect(result.success).toBe(false)
  })

  it('reports success when every single-session cleanup layer succeeds', async () => {
    destroyRedisSessionMock.mockResolvedValue({
      cookieCleared: true,
      redisCleared: true,
      dbDeactivated: true,
      failures: [],
    })
    const { revokePilotSession } = await import('@/lib/services/session-service')

    const result = await revokePilotSession('', 'User logout')

    expect(result.success).toBe(true)
    expect(createServiceRoleClientMock).not.toHaveBeenCalled()
  })

  it('does not report revoke-all as successful after partial cleanup', async () => {
    destroyAllUserSessionsMock.mockResolvedValue({
      redisCleared: true,
      dbDeactivated: false,
      failures: ['db-deactivate'],
    })
    const { revokeAllPilotSessions } = await import('@/lib/services/session-service')

    const result = await revokeAllPilotSessions('pilot-id')

    expect(rpcMock).toHaveBeenCalledWith('revoke_all_pilot_sessions', {
      user_id: 'pilot-id',
    })
    expect(result.success).toBe(false)
  })
})
