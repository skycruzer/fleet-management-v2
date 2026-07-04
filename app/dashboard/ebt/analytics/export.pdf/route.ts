import { type NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/ebt/auth/roles'
import {
  getHeatmap,
  getModuleOutcomes,
  getAllStandingSignals,
  deriveFleetKpis,
} from '@/lib/ebt/analytics/queries'
// AnalyticsFilters + parseFilters are SOLE-owned by Phase-4 filters.ts — reuse it, do not re-declare.
import { parseFilters } from '@/lib/ebt/analytics/filters'
import { renderFleetAnalyticsPdf } from '@/lib/ebt/analytics/pdf/render'

export async function GET(req: NextRequest) {
  // DECISION: examiner-level access to the fleet PDF (incl. below-standard pilots) is
  // intentional — same rationale as the CSV route (spec §5.1 / decision #7).
  await requireRole('examiner')
  const f = parseFilters(req.nextUrl.searchParams)

  // Phase-4 KPI derivation: deriveFleetKpis(standings, moduleOutcomes) -> FleetKpis.
  // Same inputs the on-screen FleetKpiCards use, so screen/PDF can't disagree.
  const [standings, moduleOutcomes, heatmap] = await Promise.all([
    getAllStandingSignals(f, true), // analytics = active pilots only (matches screen)
    getModuleOutcomes(f),
    getHeatmap(f),
  ])
  const kpis = deriveFleetKpis(standings, moduleOutcomes) // FleetKpis

  const buf = await renderFleetAnalyticsPdf({
    // Map FROM FleetKpis (Phase 4) -> the PDF's FleetPdfKpis field names.
    kpis: {
      notCompetentPilots: kpis.notCompetent,
      additionalTrainingPilots: kpis.additionalTraining,
      pctBelowEffective: kpis.pctBelowEffective,
      modulePassRate: kpis.modulePassRate,
    },
    heatmap: heatmap.map((r) => ({
      competency_code: r.competencyCode,
      aircraft_type_id: r.aircraftTypeId,
      rank: r.rank,
      pct_below_3: r.pctBelow3,
      n_graded: r.nGraded,
    })),
  })

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="fleet-analytics.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
