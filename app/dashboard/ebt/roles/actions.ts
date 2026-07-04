'use server'
import { randomBytes } from 'crypto'
import { requireRole, type AppRole } from '@/lib/ebt/auth/roles'
import { createAdminClient } from '@/lib/ebt/supabase/admin'
import { sanitizeRoles, wouldRemoveLastAdmin, diffRoles } from './roles-logic'

export type AdminUser = { id: string; email: string; roles: AppRole[]; createdAt: string }

function genPassword(): string {
  return randomBytes(12).toString('base64url') // ~16 chars
}

export async function listUsers(): Promise<AdminUser[]> {
  await requireRole('admin')
  const admin = createAdminClient()
  let authUsers: { id: string; email?: string; created_at: string }[] = []
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(error.message)
    authUsers = authUsers.concat(data.users)
    if (data.users.length < 1000) break
  }
  const { data: roleRows } = await admin.from('user_roles').select('user_id, role')
  const byUser = new Map<string, AppRole[]>()
  for (const r of (roleRows ?? []) as { user_id: string; role: AppRole }[]) {
    byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role])
  }
  return authUsers
    .filter((u) => u.email)
    .map((u) => ({
      id: u.id,
      email: u.email as string,
      roles: byUser.get(u.id) ?? [],
      createdAt: u.created_at,
    }))
    .sort((a, b) => a.email.localeCompare(b.email))
}

export type AddUserState = { ok: boolean; message: string; tempPassword?: string; email?: string }

export async function addUser(_prev: AddUserState, formData: FormData): Promise<AddUserState> {
  await requireRole('admin')
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const roles = sanitizeRoles(formData.getAll('roles').map(String))
  const allowed = (process.env.ALLOWED_EMAIL_DOMAIN ?? 'airniugini.com.pg').toLowerCase()
  if (!email.endsWith('@' + allowed)) return { ok: false, message: `Email must be @${allowed}.` }
  if (roles.length === 0) return { ok: false, message: 'Pick at least one role.' }

  const admin = createAdminClient()
  const tempPassword = genPassword()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })
  if (error || !data?.user) {
    const msg = error?.message ?? 'unknown error'
    return {
      ok: false,
      message: /already|registered|exists/i.test(msg)
        ? 'A user with that email already exists — use Reset password instead.'
        : 'Create failed: ' + msg,
    }
  }
  const { error: roleErr } = await admin
    .from('user_roles')
    .insert(roles.map((role) => ({ user_id: data.user.id, role })))
  if (roleErr)
    return { ok: false, message: 'User created, but role assignment failed: ' + roleErr.message }
  return { ok: true, message: `Created ${email}.`, tempPassword, email }
}

export type RolesState = { ok: boolean; message: string }

export async function setUserRoles(userId: string, requested: AppRole[]): Promise<RolesState> {
  await requireRole('admin')
  const desired = sanitizeRoles(requested)
  if (desired.length === 0) return { ok: false, message: 'A user must have at least one role.' }

  const admin = createAdminClient()
  // FIX #7: fail CLOSED on a query error. Previously the error was unchecked, so a failed
  // count query left adminIds=[], wouldRemoveLastAdmin() returned false, and the sole admin
  // could be demoted during a DB outage. Treat an unreadable admin count as "cannot verify".
  const { data: adminRows, error: adminErr } = await admin
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin')
  if (adminErr) return { ok: false, message: 'Update failed: could not verify admin count.' }
  const adminIds = ((adminRows ?? []) as { user_id: string }[]).map((r) => r.user_id)
  if (wouldRemoveLastAdmin(adminIds, userId, desired)) {
    return { ok: false, message: 'Cannot remove the last admin.' }
  }

  const { data: curRows, error: curErr } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
  if (curErr) return { ok: false, message: 'Update failed: could not read current roles.' }
  const current = ((curRows ?? []) as { role: AppRole }[]).map((r) => r.role)
  const { toAdd, toRemove } = diffRoles(current, desired)
  // FIX #12: ADD before REMOVE so a partial failure fails SAFE. With remove-first, a failed
  // insert after a successful delete would leave the user with fewer roles than intended — on a
  // full swap, ZERO roles (locked out). Add-first means a failed insert aborts before any delete,
  // so the user keeps their original roles (over-privileged, recoverable) rather than under-
  // privileged. The last-admin guard already ran above, so this cannot strip the final admin.
  if (toAdd.length) {
    const { error } = await admin
      .from('user_roles')
      .insert(toAdd.map((role) => ({ user_id: userId, role })))
    if (error) return { ok: false, message: 'Update failed: ' + error.message }
  }
  if (toRemove.length) {
    const { error } = await admin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .in('role', toRemove)
    if (error) return { ok: false, message: 'Update failed: ' + error.message }
  }
  return { ok: true, message: 'Roles updated.' }
}

export type ResetState = { ok: boolean; message: string; tempPassword?: string }

export async function resetUserPassword(userId: string): Promise<ResetState> {
  await requireRole('admin')
  const admin = createAdminClient()
  const tempPassword = genPassword()
  const { error } = await admin.auth.admin.updateUserById(userId, { password: tempPassword })
  if (error) return { ok: false, message: 'Reset failed: ' + error.message }
  return { ok: true, message: 'Password reset.', tempPassword }
}
