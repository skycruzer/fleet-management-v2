'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/ebt/auth/roles'
import { createClient } from '@/lib/ebt/supabase/server'

export type PilotFormState = { ok: boolean; message: string }

// Allowlist mirrored by the DB CHECK (20260610090100). Every fleet aggregate filters on
// employment_status = 'active', so an arbitrary string would silently remove the pilot from
// all analytics — reject it loudly here instead.
const EMPLOYMENT_STATUSES = new Set(['active', 'inactive'])
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parsePilot(formData: FormData) {
  const staff_no = String(formData.get('staff_no') ?? '').trim()
  const full_name = String(formData.get('full_name') ?? '').trim()
  const rank = String(formData.get('rank') ?? '').trim() || null
  const aircraft_type_id = String(formData.get('aircraft_type_id') ?? '').trim() || null
  const employment_status = String(formData.get('employment_status') ?? 'active').trim() || 'active'
  return { staff_no, full_name, rank, aircraft_type_id, employment_status }
}

export async function createPilot(
  _prev: PilotFormState,
  formData: FormData
): Promise<PilotFormState> {
  await requireRole('admin')
  const p = parsePilot(formData)
  if (!p.staff_no) return { ok: false, message: 'Staff number is required.' }
  if (!p.full_name) return { ok: false, message: 'Full name is required.' }
  if (!EMPLOYMENT_STATUSES.has(p.employment_status))
    return { ok: false, message: 'Invalid employment status.' }

  const supabase = await createClient() // RLS enforces admin-only write
  const { error } = await supabase.from('pilots').insert(p)
  if (error) {
    if (error.code === '23505') return { ok: false, message: 'That staff number already exists.' }
    if (error.code === '42501')
      return { ok: false, message: "You don't have permission to add pilots." }
    return { ok: false, message: 'Could not save: ' + error.message }
  }
  revalidatePath('/dashboard/ebt/pilots')
  return { ok: true, message: 'Pilot added.' }
}

export async function updatePilot(
  id: string,
  _prev: PilotFormState,
  formData: FormData
): Promise<PilotFormState> {
  await requireRole('fleet_manager') // admin ⊇ fleet_manager; archiving stays admin-only (softDeletePilot)
  if (!UUID_RE.test(id)) return { ok: false, message: 'Invalid pilot id.' }
  const p = parsePilot(formData)
  if (!p.staff_no) return { ok: false, message: 'Staff number is required.' }
  if (!p.full_name) return { ok: false, message: 'Full name is required.' }
  if (!EMPLOYMENT_STATUSES.has(p.employment_status))
    return { ok: false, message: 'Invalid employment status.' }

  const supabase = await createClient()
  const { error } = await supabase.from('pilots').update(p).eq('id', id)
  if (error) {
    if (error.code === '23505') return { ok: false, message: 'That staff number already exists.' }
    if (error.code === '42501')
      return { ok: false, message: "You don't have permission to edit pilots." }
    // Log the technical detail server-side; raw Postgres messages leak schema details to the client.
    console.error('[pilot-actions] updatePilot', { code: error.code, message: error.message })
    return { ok: false, message: 'Could not save the pilot. Please try again.' }
  }
  revalidatePath('/dashboard/ebt/pilots')
  revalidatePath(`/dashboard/ebt/pilots/${id}`)
  return { ok: true, message: 'Pilot updated.' }
}

export async function softDeletePilot(id: string): Promise<void> {
  await requireRole('admin')
  if (!UUID_RE.test(id)) throw new Error('softDeletePilot: invalid pilot id')
  const supabase = await createClient()
  const { error } = await supabase
    .from('pilots')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) {
    console.error('[pilot-actions] softDeletePilot', { code: error.code, message: error.message })
    throw new Error('softDeletePilot: could not archive the pilot')
  }
  revalidatePath('/dashboard/ebt/pilots')
  redirect('/dashboard/ebt/pilots')
}
