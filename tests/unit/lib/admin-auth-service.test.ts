import { beforeEach, describe, expect, it, vi } from 'vitest'
import bcrypt from 'bcryptjs'

const createServiceRoleClientMock = vi.fn()
const createRedisSessionMock = vi.fn()
const destroyAllUserSessionsMock = vi.fn()
const checkAccountLockoutMock = vi.fn()
const recordFailedAttemptMock = vi.fn()
const clearFailedAttemptsMock = vi.fn()

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: createServiceRoleClientMock,
}))

vi.mock('@/lib/services/redis-session-service', () => ({
  createRedisSession: createRedisSessionMock,
  validateRedisSession: vi.fn(),
  destroyRedisSession: vi.fn(),
  destroyAllUserSessions: destroyAllUserSessionsMock,
}))

vi.mock('@/lib/services/account-lockout-service', () => ({
  checkAccountLockout: checkAccountLockoutMock,
  recordFailedAttempt: recordFailedAttemptMock,
  clearFailedAttempts: clearFailedAttemptsMock,
}))

function resolvedBuilder(result: unknown) {
  const builder: Record<string, any> = {}
  builder.select = vi.fn(() => builder)
  builder.update = vi.fn(() => builder)
  builder.eq = vi.fn(() => builder)
  builder.ilike = vi.fn(() => builder)
  builder.single = vi.fn().mockResolvedValue(result)
  builder.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject)
  return builder
}

describe('adminLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    checkAccountLockoutMock.mockResolvedValue({
      success: true,
      data: { isLocked: false, failedAttempts: 0 },
    })
    clearFailedAttemptsMock.mockResolvedValue({ success: true, data: null })
    createRedisSessionMock.mockResolvedValue({
      success: true,
      sessionToken: 'session-token',
    })
    destroyAllUserSessionsMock.mockResolvedValue({
      redisCleared: true,
      dbDeactivated: true,
      failures: [],
    })
  })

  it('normalizes the submitted email before looking up the admin account', async () => {
    const password = 'Valid-password-123'
    const passwordHash = await bcrypt.hash(password, 4)
    const lookup = resolvedBuilder({
      data: {
        id: 'admin-1',
        email: 'Admin@Example.com',
        name: 'Admin',
        role: 'admin',
        user_type: 'admin',
        password_hash: passwordHash,
      },
      error: null,
    })
    const update = resolvedBuilder({ data: null, error: null })
    const from = vi.fn().mockReturnValueOnce(lookup).mockReturnValueOnce(update)
    createServiceRoleClientMock.mockReturnValue({ from })

    const { adminLogin } = await import('@/lib/services/admin-auth-service')
    const result = await adminLogin({
      email: '  Admin@Example.com  ',
      password,
    })

    expect(result.success).toBe(true)
    expect(lookup.ilike).toHaveBeenCalledWith('email', 'admin@example.com')
  })

  it('does not report a password change as fully successful if session revocation fails', async () => {
    const currentPassword = 'Valid-password-123'
    const passwordHash = await bcrypt.hash(currentPassword, 4)
    const lookup = resolvedBuilder({
      data: {
        id: 'admin-1',
        password_hash: passwordHash,
      },
      error: null,
    })
    const update = resolvedBuilder({ data: null, error: null })
    createServiceRoleClientMock.mockReturnValue({
      from: vi.fn().mockReturnValueOnce(lookup).mockReturnValueOnce(update),
    })
    destroyAllUserSessionsMock.mockResolvedValue({
      redisCleared: false,
      dbDeactivated: true,
      failures: ['redis-pipeline'],
    })

    const { changeAdminPassword } = await import('@/lib/services/admin-auth-service')
    const result = await changeAdminPassword('admin-1', currentPassword, 'Different-password-456')

    expect(destroyAllUserSessionsMock).toHaveBeenCalledWith(
      'admin-1',
      'admin_sessions',
      'admin_user_id'
    )
    expect(result.success).toBe(false)
  })
})
