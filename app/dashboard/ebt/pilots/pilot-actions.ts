'use server'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/ebt/auth/roles'

export type PilotFormState = { ok: boolean; message: string }

// Pilots are owned by the fleet roster (public.pilots) since the EBT↔fleet unification.
// EBT reads the unified roster and only adds EBT-specific attributes (ebt.pilot_ext); it no
// longer creates or edits pilot identity. These actions remain as thin guards that direct
// users to the fleet pilot management. (Editing ebt.pilot_ext is a future follow-up.)
const FLEET_ROSTER = '/dashboard/pilots'
const MANAGED_IN_FLEET = 'Pilots are managed in the fleet roster (Dashboard → Pilots).'

export async function createPilot(
  _prev: PilotFormState,
  _formData: FormData
): Promise<PilotFormState> {
  await requireRole('admin')
  return { ok: false, message: MANAGED_IN_FLEET }
}

export async function updatePilot(
  _id: string,
  _prev: PilotFormState,
  _formData: FormData
): Promise<PilotFormState> {
  await requireRole('fleet_manager')
  return { ok: false, message: MANAGED_IN_FLEET }
}

export async function softDeletePilot(_id: string): Promise<void> {
  await requireRole('admin')
  redirect(FLEET_ROSTER)
}
