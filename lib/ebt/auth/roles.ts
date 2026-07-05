import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'

export const ROLES = ['examiner', 'fleet_manager', 'admin'] as const
export type AppRole = (typeof ROLES)[number]

// Privilege ordering: admin ⊇ fleet_manager ⊇ examiner.
const RANK: Record<AppRole, number> = { examiner: 1, fleet_manager: 2, admin: 3 }

/** True if `actual` meets or exceeds the privilege of `required`. */
export function hasRole(actual: AppRole | null, required: AppRole): boolean {
  if (!actual) return false
  return RANK[actual] >= RANK[required]
}

export interface SessionUser {
  id: string
  email: string | null
  role: AppRole | null
}

// EBT was built for a standalone Supabase-Auth app whose JWT carried a `user_role` claim.
// In the fleet app there is no such claim — access is governed by the fleet admin auth
// (Supabase Auth or the bcrypt admin-session cookie). Map the fleet role onto the EBT role
// ladder: fleet admins get full EBT admin, fleet managers get fleet_manager. Anyone the
// fleet gate rejects (role `user` / unauthenticated) has no EBT access.
const FLEET_TO_EBT: Record<string, AppRole> = {
  admin: 'admin',
  manager: 'fleet_manager',
}

/** Read the authenticated user + EBT role from the fleet admin auth (server-only). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const admin = await getAuthenticatedAdmin()
  if (!admin.authenticated || !admin.userId) return null
  const role = (admin.role && FLEET_TO_EBT[admin.role]) ?? null
  if (!role) return null
  return { id: admin.userId, email: admin.email, role }
}

/** Gate a server component / action: redirect to the admin login if unauthenticated,
 *  or to the EBT home if authenticated but under-privileged. Returns the user otherwise. */
export async function requireRole(required: AppRole): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect('/auth/login?redirect=/dashboard/ebt')
  if (!hasRole(user.role, required)) redirect('/dashboard/ebt')
  return user
}
