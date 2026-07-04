import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/ebt/auth/roles'
import { getPilot, listAircraftTypes } from '@/lib/ebt/roster/queries'
import { PilotForm } from '../../pilot-form'
import { updatePilot, type PilotFormState } from '../../pilot-actions'
import type { Database } from '@/lib/ebt/database.types'

type PilotRow = Database['ebt']['Tables']['pilots']['Row']

export default async function EditPilotPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('fleet_manager')
  const { id } = await params
  const [pilotRaw, aircraftTypes] = await Promise.all([getPilot(id), listAircraftTypes()])
  if (!pilotRaw) notFound()
  // Cast away Supabase's GenericStringError union — getPilot throws on real DB errors
  const pilot = pilotRaw as unknown as PilotRow

  const action = updatePilot.bind(null, id) as (
    p: PilotFormState,
    fd: FormData
  ) => Promise<PilotFormState>

  return (
    <main className="ax-main">
      <div className="ax-wrap">
        <div className="ax-pagehead">
          <div>
            <div className="ax-eyebrow">Roster</div>
            <h1>Edit pilot</h1>
          </div>
          <div className="right">
            <Link className="ax-btn" href={`/dashboard/ebt/pilots/${id}`}>
              Cancel
            </Link>
          </div>
        </div>
        <PilotForm
          action={action}
          aircraftTypes={aircraftTypes}
          defaults={{
            staff_no: pilot.staff_no,
            full_name: pilot.full_name,
            rank: pilot.rank ?? '',
            aircraft_type_id: pilot.aircraft_type_id,
            employment_status: pilot.employment_status,
          }}
          submitLabel="Save changes"
        />
      </div>
    </main>
  )
}
