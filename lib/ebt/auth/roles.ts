import { redirect } from 'next/navigation'
import { createClient } from '@/lib/ebt/supabase/server'

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

/** Read the authenticated user + role from the verified JWT claims (server-only). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) return null
  const roleClaim = (claims as Record<string, unknown>).user_role
  const role =
    typeof roleClaim === 'string' && (ROLES as readonly string[]).includes(roleClaim)
      ? (roleClaim as AppRole)
      : null
  return { id: String(claims.sub), email: (claims.email as string) ?? null, role }
}

/** Gate a server component / action: redirect to /login if unauthenticated,
 *  or to / if authenticated but under-privileged. Returns the user otherwise. */
export async function requireRole(required: AppRole): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect('/auth/login')
  if (!hasRole(user.role, required)) redirect('/dashboard/ebt')
  return user
}
