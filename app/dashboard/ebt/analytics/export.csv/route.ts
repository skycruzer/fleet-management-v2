import { type NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/ebt/auth/roles'
import {
  getHeatmap,
  getModuleOutcomes,
  getFleetTrend,
  getBelowStandardPilots,
} from '@/lib/ebt/analytics/queries'
// AnalyticsFilters + parseFilters are SOLE-owned by Phase-4 filters.ts (the ONE filters contract:
// { aircraftTypeId; rank; window: AnalyticsWindow }). Do NOT re-declare a local parseFilters here.
import { parseFilters } from '@/lib/ebt/analytics/filters'
import {
  FLEET_SCOPES,
  buildFleetCsv,
  type FleetScope,
  type FleetExportInput,
} from '@/lib/ebt/analytics/export-fleet'

export async function GET(req: NextRequest) {
  // DECISION (deep review §security): examiner-level access to fleet-wide exports — including
  // scope=below_standard (pilot names, staff numbers, standing) — is INTENTIONAL, mirroring
  // spec §5.1 / decision #7: any authenticated staff member may read any trainee's history, and
  // the same data is visible on the /analytics screen examiners can already open. Tighten to
  // requireRole("fleet_manager") here if that policy ever changes.
  await requireRole('examiner')
  const sp = req.nextUrl.searchParams
  const scope = (sp.get('scope') ?? 'heatmap') as FleetScope
  if (!FLEET_SCOPES.includes(scope)) {
    return new NextResponse(`unknown scope: ${scope}`, { status: 400 })
  }
  // Same AnalyticsFilters the /analytics screen uses, parsed from the identical ?aircraft&rank&window params.
  const f = parseFilters(sp)

  // Fetch only the dataset the scope needs; leave the rest empty.
  const input: FleetExportInput = { heatmap: [], outcomes: [], trend: [], belowStandard: [] }
  if (scope === 'heatmap') input.heatmap = await getHeatmap(f)
  else if (scope === 'outcomes') input.outcomes = await getModuleOutcomes(f)
  else if (scope === 'trend') input.trend = await getFleetTrend(f)
  else if (scope === 'below_standard') input.belowStandard = await getBelowStandardPilots(f, true) // active only

  const csv = buildFleetCsv(scope, input)
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="fleet-${scope}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
