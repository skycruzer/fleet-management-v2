import { type NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/ebt/auth/roles'
import { createClient } from '@/lib/ebt/supabase/server'
import { getPilotLatestEval, getPilotStandingSignals } from '@/lib/ebt/analytics/queries'
import { classifyStanding } from '@/lib/ebt/analytics/standing'
import { renderPilotStandardsPdf } from '@/lib/ebt/analytics/pdf/render'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireRole('examiner')
  const { id } = await params
  // Same UUID guard as the CSV sibling: no raw type-error schema leakage from a crafted path.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return new NextResponse('not found', { status: 404 })
  }
  const supabase = await createClient()

  const { data: pilot, error: pilotErr } = await supabase
    .from('pilots')
    .select('full_name, staff_no')
    .eq('id', id)
    .maybeSingle()
  // FIX #12 (same as the CSV sibling): a genuine read failure (RLS denial / connection error)
  // must be a 500 visible to monitoring — not a 404 that masks infrastructure failures as
  // ordinary not-founds. Only a clean null with no error is a true 404.
  if (pilotErr) return new NextResponse('error reading pilot', { status: 500 })
  if (!pilot) return new NextResponse('not found', { status: 404 })

  const [latest, standing] = await Promise.all([
    getPilotLatestEval(id),
    getPilotStandingSignals(id),
  ])
  // FIX #1: tier AND counts both derive from v_pilot_standing_signals (module-ranked) — the
  // same source as the on-screen Standards tab, the CSV export, and the fleet table.
  const tier = classifyStanding(standing.signals)

  const buf = await renderPilotStandardsPdf({
    pilotName: pilot.full_name,
    staffNo: pilot.staff_no,
    tier,
    notCompetentCount: standing.notCompetentCount,
    belowEffectiveCount: standing.belowEffectiveCount,
    latest: latest.map((r) => ({
      competency_code: r.competencyCode,
      grade: r.grade,
      module_no: r.moduleNo,
    })),
  })

  const safeStaff = (pilot.staff_no ?? id).replace(/[^A-Za-z0-9_-]/g, '')
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="standards-${safeStaff}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
