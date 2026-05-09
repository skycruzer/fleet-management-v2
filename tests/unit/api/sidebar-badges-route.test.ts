import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedAdminMock = vi.fn()
const getSidebarBadgeCountsMock = vi.fn()

vi.mock('@/lib/middleware/admin-auth-helper', () => ({
  getAuthenticatedAdmin: getAuthenticatedAdminMock,
}))

vi.mock('@/lib/services/sidebar-badges-service', () => ({
  getSidebarBadgeCounts: getSidebarBadgeCountsMock,
}))

describe('/api/sidebar-badges', () => {
  beforeEach(() => {
    vi.resetModules()
    getAuthenticatedAdminMock.mockReset()
    getSidebarBadgeCountsMock.mockReset()
  })

  it('returns the counts produced by the service for an authenticated admin', async () => {
    getAuthenticatedAdminMock.mockResolvedValue({ authenticated: true })
    getSidebarBadgeCountsMock.mockResolvedValue({
      degraded: false,
      pendingRequests: 7,
      expiredCertifications: 2,
      expiringCertifications: 5,
    })

    const { GET } = await import('@/app/api/sidebar-badges/route')
    const response = await GET()
    const body = await response.json()

    expect(body).toEqual({
      success: true,
      data: {
        pendingRequests: 7,
        expiredCertifications: 2,
        expiringCertifications: 5,
      },
    })
    expect(getSidebarBadgeCountsMock).toHaveBeenCalledTimes(1)
  })

  it('marks the response as degraded when the service reports partial failures', async () => {
    getAuthenticatedAdminMock.mockResolvedValue({ authenticated: true })
    getSidebarBadgeCountsMock.mockResolvedValue({
      degraded: true,
      failures: ['expiredCertifications'],
      pendingRequests: 3,
      expiredCertifications: 0,
      expiringCertifications: 4,
    })

    const { GET } = await import('@/app/api/sidebar-badges/route')
    const response = await GET()
    const body = await response.json()

    expect(body).toEqual({
      success: true,
      data: {
        pendingRequests: 3,
        expiredCertifications: 0,
        expiringCertifications: 4,
      },
      degraded: true,
      failures: ['expiredCertifications'],
    })
  })

  it('returns 401 when not authenticated', async () => {
    getAuthenticatedAdminMock.mockResolvedValue({ authenticated: false })

    const { GET } = await import('@/app/api/sidebar-badges/route')
    const response = await GET()

    expect(response.status).toBe(401)
    expect(getSidebarBadgeCountsMock).not.toHaveBeenCalled()
  })

  it('marks badge counts as private short-lived data', async () => {
    getAuthenticatedAdminMock.mockResolvedValue({ authenticated: true })
    getSidebarBadgeCountsMock.mockResolvedValue({
      degraded: false,
      pendingRequests: 0,
      expiredCertifications: 0,
      expiringCertifications: 0,
    })

    const { GET } = await import('@/app/api/sidebar-badges/route')
    const response = await GET()

    expect(response.headers.get('Cache-Control')).toBe(
      'private, max-age=30, stale-while-revalidate=60'
    )
  })
})
