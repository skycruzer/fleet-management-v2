import { ROLES, type AppRole } from '@/lib/ebt/auth/roles'

export function sanitizeRoles(input: string[]): AppRole[] {
  const out: AppRole[] = []
  for (const r of input) {
    if ((ROLES as readonly string[]).includes(r) && !out.includes(r as AppRole))
      out.push(r as AppRole)
  }
  return out
}

/** True if applying `desired` to `userId` would leave zero admins. */
export function wouldRemoveLastAdmin(
  allAdminUserIds: string[],
  userId: string,
  desired: AppRole[]
): boolean {
  const removingAdmin = !desired.includes('admin')
  const distinctAdmins = new Set(allAdminUserIds)
  return removingAdmin && distinctAdmins.has(userId) && distinctAdmins.size <= 1
}

export function diffRoles(
  current: AppRole[],
  desired: AppRole[]
): { toAdd: AppRole[]; toRemove: AppRole[] } {
  const cur = new Set(current)
  const des = new Set(desired)
  return {
    toAdd: desired.filter((r) => !cur.has(r)),
    toRemove: current.filter((r) => !des.has(r)),
  }
}
