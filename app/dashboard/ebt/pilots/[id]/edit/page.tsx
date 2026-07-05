import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/ebt/auth/roles'

// Pilot identity is owned by the fleet roster now — editing pilot core fields happens there.
// (Editing EBT-only attributes in ebt.pilot_ext is a future follow-up.)
export default async function EditPilotPage() {
  await requireRole('fleet_manager')
  redirect('/dashboard/pilots')
}
