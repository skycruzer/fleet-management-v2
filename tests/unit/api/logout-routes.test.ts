import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'

const validateCsrfMock = vi.fn()
const destroyRedisSessionMock = vi.fn()
const createAdminClientMock = vi.fn()

vi.mock('@/lib/middleware/csrf-middleware', () => ({
  validateCsrf: validateCsrfMock,
}))

vi.mock('@/lib/services/redis-session-service', () => ({
  destroyRedisSession: destroyRedisSessionMock,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

function mockRequest(path = '/api/auth/logout') {
  return new Request(`http://localhost:3001${path}`, { method: 'POST' }) as any
}

describe('logout routes', () => {
  beforeEach(() => {
    vi.resetModules()
    validateCsrfMock.mockReset()
    destroyRedisSessionMock.mockReset()
    createAdminClientMock.mockReset()
    createAdminClientMock.mockReturnValue({
      auth: {
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
    })
  })

  it('admin logout returns the CSRF error and does not destroy sessions', async () => {
    const csrfResponse = NextResponse.json({ error: 'Invalid CSRF' }, { status: 403 })
    validateCsrfMock.mockResolvedValue(csrfResponse)

    const { POST } = await import('@/app/api/auth/logout/route')
    const response = await POST(mockRequest('/api/auth/logout'))

    expect(response.status).toBe(403)
    expect(destroyRedisSessionMock).not.toHaveBeenCalled()
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })

  it('pilot logout returns the CSRF error and does not sign out', async () => {
    const csrfResponse = NextResponse.json({ error: 'Invalid CSRF' }, { status: 403 })
    validateCsrfMock.mockResolvedValue(csrfResponse)

    const { POST } = await import('@/app/api/pilot/logout/route')
    const response = await POST(mockRequest('/api/pilot/logout'))

    expect(response.status).toBe(403)
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })

  it('auth signout returns the CSRF error and does not sign out', async () => {
    const csrfResponse = NextResponse.json({ error: 'Invalid CSRF' }, { status: 403 })
    validateCsrfMock.mockResolvedValue(csrfResponse)

    const { POST } = await import('@/app/api/auth/signout/route')
    const response = await POST(mockRequest('/api/auth/signout'))

    expect(response.status).toBe(403)
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })
})
