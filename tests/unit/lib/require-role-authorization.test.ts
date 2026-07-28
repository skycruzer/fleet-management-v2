/**
 * Regression coverage for the admin-only authorization gate.
 *
 * `requireRole()` used to return `{ authorized: true }` for ANY valid admin session whenever the
 * required roles contained ADMIN, without ever reading the caller's role. Admin sessions are
 * issued to managers as well as admins, so every `roles: [UserRole.ADMIN]` route — including
 * `POST /api/users`, whose schema accepts a `role` — was reachable by a manager, letting one mint
 * an admin account.
 *
 * The paired defect: the old role lookup read `an_users` with the RLS-bound anon client, which
 * migration 20260703000001 revoked. It therefore always returned null, so "just call
 * verifyUserRole()" would have locked every admin out instead of fixing the escalation. These
 * tests pin both halves: managers are refused admin-only routes, and admins still get through.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedAdminMock = vi.fn()

vi.mock('@/lib/middleware/admin-auth-helper', () => ({
  getAuthenticatedAdmin: getAuthenticatedAdminMock,
}))

// Pulled in transitively by the module under test; stubbed so the test needs no Supabase/Redis.
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/services/admin-auth-service', () => ({ validateAdminSession: vi.fn() }))

function request() {
  return new Request('http://localhost:3001/api/users', { method: 'POST' }) as any
}

describe('requireRole', () => {
  beforeEach(() => {
    vi.resetModules()
    getAuthenticatedAdminMock.mockReset()
  })

  it('refuses a manager on an admin-only route', async () => {
    getAuthenticatedAdminMock.mockResolvedValue({
      authenticated: true,
      source: 'admin-session',
      userId: 'manager-1',
      email: 'manager@example.com',
      role: 'manager',
    })

    const { requireRole, UserRole } = await import('@/lib/middleware/authorization-middleware')
    const result = await requireRole(request(), [UserRole.ADMIN])

    expect(result.authorized).toBe(false)
    expect(result.statusCode).toBe(403)
  })

  it('admits an admin on an admin-only route', async () => {
    getAuthenticatedAdminMock.mockResolvedValue({
      authenticated: true,
      source: 'admin-session',
      userId: 'admin-1',
      email: 'admin@example.com',
      role: 'admin',
    })

    const { requireRole, UserRole } = await import('@/lib/middleware/authorization-middleware')
    const result = await requireRole(request(), [UserRole.ADMIN])

    expect(result.authorized).toBe(true)
  })

  it('admits a manager where the route allows managers', async () => {
    getAuthenticatedAdminMock.mockResolvedValue({
      authenticated: true,
      source: 'admin-session',
      userId: 'manager-1',
      email: 'manager@example.com',
      role: 'manager',
    })

    const { requireRole, UserRole } = await import('@/lib/middleware/authorization-middleware')
    const result = await requireRole(request(), [UserRole.ADMIN, UserRole.MANAGER])

    expect(result.authorized).toBe(true)
  })

  it('normalizes casing so a stray capitalized role still matches', async () => {
    getAuthenticatedAdminMock.mockResolvedValue({
      authenticated: true,
      source: 'supabase',
      userId: 'admin-2',
      email: 'admin2@example.com',
      role: 'Admin',
    })

    const { requireRole, UserRole } = await import('@/lib/middleware/authorization-middleware')
    const result = await requireRole(request(), [UserRole.ADMIN])

    expect(result.authorized).toBe(true)
  })

  it('rejects an unauthenticated caller with 401', async () => {
    getAuthenticatedAdminMock.mockResolvedValue({
      authenticated: false,
      source: null,
      userId: null,
      email: null,
      role: null,
    })

    const { requireRole, UserRole } = await import('@/lib/middleware/authorization-middleware')
    const result = await requireRole(request(), [UserRole.ADMIN])

    expect(result.authorized).toBe(false)
    expect(result.statusCode).toBe(401)
  })

  it('rejects an authenticated caller whose role could not be resolved', async () => {
    // Fail closed: a null role must never be treated as permission.
    getAuthenticatedAdminMock.mockResolvedValue({
      authenticated: true,
      source: 'admin-session',
      userId: 'ghost-1',
      email: 'ghost@example.com',
      role: null,
    })

    const { requireRole, UserRole } = await import('@/lib/middleware/authorization-middleware')
    const result = await requireRole(request(), [UserRole.ADMIN])

    expect(result.authorized).toBe(false)
    expect(result.statusCode).toBe(401)
  })
})
