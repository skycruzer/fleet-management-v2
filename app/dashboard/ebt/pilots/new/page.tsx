import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/ebt/auth/roles'

// Pilot identity is owned by the fleet roster now — creating pilots happens there.
export default async function NewPilotPage() {
  await requireRole('admin')
  redirect('/dashboard/pilots')
}
