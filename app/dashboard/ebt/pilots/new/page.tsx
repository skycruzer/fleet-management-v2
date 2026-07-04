import Link from 'next/link'
import { requireRole } from '@/lib/ebt/auth/roles'
import { listAircraftTypes } from '@/lib/ebt/roster/queries'
import { PilotForm } from '../pilot-form'
import { createPilot } from '../pilot-actions'

export default async function NewPilotPage() {
  await requireRole('admin')
  const aircraftTypes = await listAircraftTypes()
  return (
    <main className="ax-main">
      <div className="ax-wrap">
        <div className="ax-pagehead">
          <div>
            <div className="ax-eyebrow">Roster</div>
            <h1>Add pilot</h1>
          </div>
          <div className="right">
            <Link className="ax-btn" href="/dashboard/ebt/pilots">
              Cancel
            </Link>
          </div>
        </div>
        <PilotForm action={createPilot} aircraftTypes={aircraftTypes} submitLabel="Add pilot" />
      </div>
    </main>
  )
}
