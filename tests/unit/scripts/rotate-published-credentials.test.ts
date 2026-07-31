import { beforeEach, describe, expect, it, vi } from 'vitest'

const writeFileSyncMock = vi.fn()
const hashMock = vi.fn()
const compareMock = vi.fn()
const createClientMock = vi.fn()
const smembersMock = vi.fn()
const pipelineDelMock = vi.fn()
const pipelineExecMock = vi.fn()
const pipelineMock = vi.fn()
const redisConstructorMock = vi.fn()

vi.mock('node:fs', () => ({
  default: {
    writeFileSync: writeFileSyncMock,
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: hashMock,
    compare: compareMock,
  },
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}))

vi.mock('@upstash/redis', () => ({
  Redis: redisConstructorMock,
}))

function fakeQuery(
  table: string,
  tableCalls: string[],
  options: {
    sessionError?: Error
    cleanupError?: Error
    events?: string[]
    filters?: Array<{ table: string; column: string; value: unknown }>
  } = {}
) {
  tableCalls.push(table)

  const builder: Record<string, any> = {}
  builder.update = vi.fn(() => {
    options.events?.push(`update:${table}`)
    return builder
  })
  builder.delete = vi.fn(() => {
    options.events?.push(`delete:${table}`)
    return builder
  })
  builder.select = vi.fn(() => {
    options.events?.push(`select:${table}`)
    return builder
  })
  builder.eq = vi.fn((column: string, value: unknown) => {
    options.filters?.push({ table, column, value })
    return builder
  })
  builder.single = vi.fn().mockResolvedValue({
    data: {
      id: `${table}-id`,
      password_hash: 'stored-hash',
      employee_id: '2393',
    },
    error: null,
  })
  builder.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve({
      error: table.endsWith('_sessions')
        ? (options.sessionError ?? null)
        : ['failed_login_attempts', 'account_lockouts'].includes(table)
          ? (options.cleanupError ?? null)
          : null,
      count: 0,
    }).then(resolve, reject)
  return builder
}

describe('rotate-published-credentials script', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'redis-token')
    hashMock.mockResolvedValue('new-hash')
    compareMock.mockResolvedValue(true)
    smembersMock.mockResolvedValue(['token-a', 'token-b'])
    pipelineDelMock.mockReturnThis()
    pipelineExecMock.mockResolvedValue([1, 1, 1])
    pipelineMock.mockReturnValue({
      del: pipelineDelMock,
      exec: pipelineExecMock,
    })
    redisConstructorMock.mockImplementation(
      class {
        smembers = smembersMock
        pipeline = pipelineMock
      } as any
    )
  })

  it('rotates each account in its real credential store, writes the staff ID, and revokes Redis sessions', async () => {
    const tableCalls: string[] = []
    const events: string[] = []
    const filters: Array<{ table: string; column: string; value: unknown }> = []
    writeFileSyncMock.mockImplementation(() => {
      events.push('write:recovery-artifact')
    })
    createClientMock.mockReturnValue({
      from: vi.fn((table: string) => fakeQuery(table, tableCalls, { events, filters })),
    })
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const { rotatePublishedCredentials } =
      await import('../../../scripts/debug/rotate-published-credentials.mjs')
    const exitCode = await rotatePublishedCredentials()

    expect(tableCalls).toContain('an_users')
    expect(tableCalls).toContain('pilot_users')
    expect(tableCalls.filter((table) => table === 'admin_sessions')).toHaveLength(1)
    expect(tableCalls.filter((table) => table === 'pilot_sessions')).toHaveLength(1)
    expect(tableCalls.filter((table) => table === 'failed_login_attempts')).toHaveLength(2)
    expect(tableCalls.filter((table) => table === 'account_lockouts')).toHaveLength(2)
    expect(smembersMock).toHaveBeenCalledWith('user:sessions:an_users-id')
    expect(smembersMock).toHaveBeenCalledWith('user:sessions:pilot_users-id')
    expect(pipelineDelMock).toHaveBeenCalledWith('session:token-a')
    expect(pipelineDelMock).toHaveBeenCalledWith('session:token-b')
    expect(pipelineDelMock).toHaveBeenCalledWith('user:sessions:an_users-id')
    expect(pipelineDelMock).toHaveBeenCalledWith('user:sessions:pilot_users-id')
    expect(pipelineExecMock).toHaveBeenCalledTimes(2)
    expect(events.indexOf('select:pilot_users')).toBeLessThan(
      events.indexOf('write:recovery-artifact')
    )
    expect(events.indexOf('write:recovery-artifact')).toBeLessThan(
      events.indexOf('update:an_users')
    )
    expect(filters).toContainEqual({
      table: 'an_users',
      column: 'id',
      value: 'an_users-id',
    })
    expect(filters).toContainEqual({
      table: 'pilot_users',
      column: 'employee_id',
      value: '2393',
    })
    expect(filters).toContainEqual({
      table: 'pilot_users',
      column: 'id',
      value: 'pilot_users-id',
    })
    expect(filters).toContainEqual({
      table: 'an_users',
      column: 'password_hash',
      value: 'stored-hash',
    })
    expect(filters).toContainEqual({
      table: 'pilot_users',
      column: 'password_hash',
      value: 'stored-hash',
    })
    expect(filters).toContainEqual({
      table: 'failed_login_attempts',
      column: 'email',
      value: 'skycruzer@icloud.com',
    })
    expect(filters).toContainEqual({
      table: 'failed_login_attempts',
      column: 'email',
      value: '2393',
    })

    const output = String(writeFileSyncMock.mock.calls[0]?.[1])
    expect(output).toMatch(/# PILOT[\s\S]*staffId: 2393/)
    expect(writeFileSyncMock.mock.calls[0]?.[2]).toMatchObject({
      mode: 0o600,
      flag: 'wx',
    })
    expect(exitCode).toBe(0)
  })

  it('fails closed when database session revocation fails', async () => {
    const tableCalls: string[] = []
    createClientMock.mockReturnValue({
      from: vi.fn((table: string) =>
        fakeQuery(table, tableCalls, {
          sessionError: new Error('session update failed'),
        })
      ),
    })
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const { rotatePublishedCredentials } =
      await import('../../../scripts/debug/rotate-published-credentials.mjs')
    const exitCode = await rotatePublishedCredentials()

    expect(tableCalls).toContain('admin_sessions')
    expect(tableCalls).toContain('pilot_sessions')
    expect(tableCalls.filter((table) => table === 'failed_login_attempts')).toHaveLength(2)
    expect(tableCalls.filter((table) => table === 'account_lockouts')).toHaveLength(2)
    expect(exitCode).toBe(1)
  })

  it('fails closed when Redis session revocation fails', async () => {
    const tableCalls: string[] = []
    createClientMock.mockReturnValue({
      from: vi.fn((table: string) => fakeQuery(table, tableCalls)),
    })
    smembersMock.mockRejectedValueOnce(new Error('redis unavailable'))
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const { rotatePublishedCredentials } =
      await import('../../../scripts/debug/rotate-published-credentials.mjs')
    const exitCode = await rotatePublishedCredentials()

    expect(tableCalls).toContain('admin_sessions')
    expect(tableCalls).toContain('pilot_sessions')
    expect(tableCalls.filter((table) => table === 'failed_login_attempts')).toHaveLength(2)
    expect(tableCalls.filter((table) => table === 'account_lockouts')).toHaveLength(2)
    expect(exitCode).toBe(1)
  })

  it('fails closed when lockout state cannot be cleared', async () => {
    const tableCalls: string[] = []
    createClientMock.mockReturnValue({
      from: vi.fn((table: string) =>
        fakeQuery(table, tableCalls, {
          cleanupError: new Error('lockout cleanup failed'),
        })
      ),
    })
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const { rotatePublishedCredentials } =
      await import('../../../scripts/debug/rotate-published-credentials.mjs')
    const exitCode = await rotatePublishedCredentials()

    expect(exitCode).toBe(1)
  })

  it('does not mutate a password if the recovery artifact cannot be persisted', async () => {
    const tableCalls: string[] = []
    const events: string[] = []
    createClientMock.mockReturnValue({
      from: vi.fn((table: string) => fakeQuery(table, tableCalls, { events })),
    })
    writeFileSyncMock.mockImplementation(() => {
      throw new Error('disk full')
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const { rotatePublishedCredentials } =
      await import('../../../scripts/debug/rotate-published-credentials.mjs')
    const exitCode = await rotatePublishedCredentials()

    expect(events).not.toContain('update:an_users')
    expect(events).not.toContain('update:pilot_users')
    expect(exitCode).toBe(1)
  })

  it('requires an explicit operator confirmation when the target has no Redis', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { rotatePublishedCredentials } =
      await import('../../../scripts/debug/rotate-published-credentials.mjs')

    await expect(rotatePublishedCredentials()).resolves.toBe(1)
    expect(createClientMock).not.toHaveBeenCalled()
  })
})
