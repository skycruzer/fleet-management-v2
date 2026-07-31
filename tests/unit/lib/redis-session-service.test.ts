import { beforeEach, describe, expect, it, vi } from 'vitest'

const createServiceRoleClientMock = vi.fn()
const cookiesMock = vi.fn()
const pipelineSetMock = vi.fn()
const pipelineSaddMock = vi.fn()
const pipelineExpireMock = vi.fn()
const pipelineExecMock = vi.fn()
const pipelineMock = vi.fn()
const redisConstructorMock = vi.fn()
const redisGetMock = vi.fn()
const redisDelMock = vi.fn()

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: createServiceRoleClientMock,
}))

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}))

vi.mock('@/lib/error-logger', () => ({
  logError: vi.fn(),
  logWarning: vi.fn(),
  ErrorSeverity: { HIGH: 'high' },
}))

vi.mock('@upstash/redis', () => ({
  Redis: redisConstructorMock,
}))

describe('redis session index', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'redis-token')

    const query: Record<string, any> = {}
    query.insert = vi.fn(() => query)
    query.select = vi.fn(() => query)
    query.single = vi.fn().mockResolvedValue({ data: { id: 'session-id' }, error: null })
    createServiceRoleClientMock.mockReturnValue({
      from: vi.fn(() => query),
    })
    cookiesMock.mockResolvedValue({
      set: vi.fn(),
    })

    pipelineSetMock.mockReturnThis()
    pipelineSaddMock.mockReturnThis()
    pipelineExpireMock.mockReturnThis()
    pipelineExecMock.mockResolvedValue([1, 1, 1])
    pipelineMock.mockReturnValue({
      set: pipelineSetMock,
      sadd: pipelineSaddMock,
      expire: pipelineExpireMock,
      exec: pipelineExecMock,
    })
    redisConstructorMock.mockImplementation(
      class {
        pipeline = pipelineMock
        get = redisGetMock
        del = redisDelMock
      } as any
    )
  })

  it('keeps the user-session index for the maximum supported session lifetime', async () => {
    const { createRedisSession } = await import('@/lib/services/redis-session-service')

    const result = await createRedisSession(
      {
        userId: 'pilot-id',
        role: 'pilot',
        email: 'pilot@example.com',
        staffId: '2393',
        name: 'Pilot',
        pilotId: 'pilot-id',
        mustChangePassword: false,
      },
      {
        cookieName: 'pilot-session',
        dbTable: 'pilot_sessions',
        dbUserIdColumn: 'pilot_user_id',
        ttlSeconds: 24 * 60 * 60,
      }
    )

    expect(result.success).toBe(true)
    expect(pipelineExpireMock).toHaveBeenCalledWith('user:sessions:pilot-id', 30 * 24 * 60 * 60)
  })

  it('treats Redis cleanup as complete when Redis is explicitly not configured', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    vi.resetModules()

    const query: Record<string, any> = {}
    query.update = vi.fn(() => query)
    query.eq = vi.fn(() => query)
    query.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve({ error: null }).then(resolve, reject)
    createServiceRoleClientMock.mockReturnValue({
      from: vi.fn(() => query),
    })

    const { destroyAllUserSessions } = await import('@/lib/services/redis-session-service')
    const result = await destroyAllUserSessions('pilot-id', 'pilot_sessions', 'pilot_user_id')

    expect(result.redisCleared).toBe(true)
    expect(result.dbDeactivated).toBe(true)
    expect(result.failures).toEqual([])
  })

  it('rejects a cached token after its authoritative DB session is revoked', async () => {
    const cachedSession = {
      sessionId: 'session-id',
      userId: 'pilot-id',
      role: 'pilot',
      email: 'pilot@example.com',
      staffId: '2393',
      name: 'Pilot',
      pilotId: 'pilot-id',
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      lastActivityAt: new Date().toISOString(),
    }
    redisGetMock.mockResolvedValue(JSON.stringify(cachedSession))
    redisDelMock.mockResolvedValue(1)
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'cached-token' }),
    })

    const query: Record<string, any> = {}
    query.select = vi.fn(() => query)
    query.eq = vi.fn(() => query)
    query.single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'No active session' },
    })
    createServiceRoleClientMock.mockReturnValue({
      from: vi.fn(() => query),
    })

    const { validateRedisSession } = await import('@/lib/services/redis-session-service')
    const result = await validateRedisSession('pilot-session', 'pilot_sessions', 'pilot_user_id')

    expect(result.isValid).toBe(false)
    expect(result.error).toMatch(/revoked or expired/i)
    expect(redisDelMock).toHaveBeenCalledWith('session:cached-token')
  })
})
