import { type NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/ebt/auth/roles'
import { createClient } from '@/lib/ebt/supabase/server'
import {
  getPilotLatestEval,
  getPilotCompetencyTrend,
  getPilotStandingSignals,
  getPilotCarryover,
} from '@/lib/ebt/analytics/queries'
import { classifyStanding } from '@/lib/ebt/analytics/standing'
import { buildPilotStandardsCsv } from '@/lib/ebt/analytics/export-pilot'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Any authenticated staff may read any trainee's history (spec §5.1 / decision #7).
  await requireRole('examiner')
  const { id } = await params
  // Path segment is interpolated into queries: reject non-UUIDs before any I/O so a crafted
  // path can't probe the schema via raw Postgres type errors.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return new NextResponse('not found', { status: 404 })
  }
  const supabase = await createClient()

  // Pilot identity for the filename + standing row.
  const { data: pilot, error: pilotErr } = await supabase
    .from('pilots')
    .select('full_name, staff_no')
    .eq('id', id)
    .maybeSingle()
  // FIX #12: distinguish a genuine read failure (RLS denial / connection error) from a missing
  // row. Previously both returned 404, masking infrastructure failures as ordinary not-founds so
  // they never surfaced in 5xx monitoring. Only a clean null with no error is a true 404.
  if (pilotErr) return new NextResponse('error reading pilot', { status: 500 })
  if (!pilot) return new NextResponse('not found', { status: 404 })

  const [latest, trend, standing, carryover] = await Promise.all([
    getPilotLatestEval(id),
    getPilotCompetencyTrend(id), // FLAT TrendPoint[]
    getPilotStandingSignals(id),
    getPilotCarryover(id),
  ])

  // FIX #1: tier AND counts both derive from v_pilot_standing_signals (module-ranked) — the
  // same source as the on-screen Standards tab and the fleet table — so the export matches
  // the UI exactly and never disagrees on the headline numbers.
  const tier = classifyStanding(standing.signals)

  const csv = buildPilotStandardsCsv({
    pilotName: pilot.full_name,
    staffNo: pilot.staff_no,
    standing: {
      tier,
      notCompetentCount: standing.notCompetentCount,
      belowEffectiveCount: standing.belowEffectiveCount,
    },
    latest,
    trend,
    carryover,
  })

  const safeStaff = (pilot.staff_no ?? id).replace(/[^A-Za-z0-9_-]/g, '')
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="standards-${safeStaff}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
