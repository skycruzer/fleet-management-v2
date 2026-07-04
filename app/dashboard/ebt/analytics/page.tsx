import { Suspense } from 'react'
import { parseFilters, toSearchParams } from '@/lib/ebt/analytics/filters'
import {
  getHeatmap,
  getModuleOutcomes,
  getFleetTrend,
  getAllStandingSignals,
  deriveFleetKpis,
  getFleetTopBehaviours,
  getCompetencyLabels,
  getGradeDistribution,
  getFirstVsResit,
  deriveCompetencyWeakness,
  deriveGradeDistribution,
  deriveMovers,
  deriveFirstVsResit,
} from '@/lib/ebt/analytics/queries'
import { getFilterOptions } from '@/lib/ebt/analytics/options'
import { createClient } from '@/lib/ebt/supabase/server'
import { AnalyticsFilters } from '@/components/ebt/analytics/analytics-filters'
import { FleetKpiCards } from '@/components/ebt/analytics/fleet-kpi-cards'
import { CompetencyHeatmap } from '@/components/ebt/analytics/competency-heatmap'
import { ModuleOutcomeBars } from '@/components/ebt/analytics/module-outcome-bars'
import { FleetTrendChart } from '@/components/ebt/analytics/fleet-trend-chart'
import { BelowStandardPilotsTable } from '@/components/ebt/analytics/below-standard-pilots-table'
import { TopBehavioursView } from '@/components/ebt/analytics/top-behaviours-view'
import { CompetencyWeaknessRanking } from '@/components/ebt/analytics/competency-weakness-ranking'
import { GradeDistributionBars } from '@/components/ebt/analytics/grade-distribution-bars'
import { CompetencyMovers } from '@/components/ebt/analytics/competency-movers'
import { FirstVsResitView } from '@/components/ebt/analytics/first-vs-resit-view'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) if (typeof v === 'string') usp.set(k, v)
  const filters = parseFilters(usp)

  const supabase = await createClient()
  // OB label catalog rides in the same Promise.all as everything else (it has no dependencies),
  // and its error is surfaced: a silent failure used to relabel every Top-behaviours row "OB"
  // with no trace anywhere.
  const fetchObLabels = async (): Promise<Record<string, string>> => {
    const { data: obRows, error: obErr } = await supabase
      .from('observable_behaviours')
      .select('id, code, description')
    if (obErr) {
      console.error(
        '[analytics] observable_behaviours read failed — behaviour labels degrade to ids:',
        obErr.message
      )
      return {}
    }
    const labels: Record<string, string> = {}
    for (const ob of obRows ?? []) {
      labels[ob.id as string] = `${ob.code as string} ${ob.description as string}`
    }
    return labels
  }

  const [
    options,
    heatmap,
    outcomes,
    trend,
    standings,
    topBehaviours,
    competencyLabels,
    gradeDistRows,
    firstResitRows,
    obLabels,
  ] = await Promise.all([
    getFilterOptions(),
    getHeatmap(filters),
    getModuleOutcomes(filters),
    getFleetTrend(filters),
    getAllStandingSignals(filters, true), // analytics = active pilots only
    getFleetTopBehaviours(filters),
    getCompetencyLabels(),
    getGradeDistribution(filters),
    getFirstVsResit(filters),
    fetchObLabels(),
  ])

  const belowStandard = standings.filter((p) => p.tier !== 'effective')

  const kpis = deriveFleetKpis(standings, outcomes)
  const aircraftLabels = Object.fromEntries(options.aircraft.map((a) => [a.id, a.code]))
  // Competency code → display name ("KNO" → "Knowledge") for every competency surface below.
  const compLabels = Object.fromEntries(competencyLabels.map((c) => [c.code, c.displayName]))
  // A + C reuse already-fetched grouped data (heatmap, monthly trend); B + D use the new views.
  const weakness = deriveCompetencyWeakness(heatmap)
  const movers = deriveMovers(trend)
  const gradeDist = deriveGradeDistribution(gradeDistRows)
  const firstResit = deriveFirstVsResit(firstResitRows)
  const filterQs = toSearchParams(filters).toString()

  return (
    <main className="ax-main">
      <div className="ax-wrap">
        <div className="ax-pagehead">
          <div>
            <div className="ax-eyebrow">Fleet</div>
            <h1>Analytics</h1>
          </div>
          <div className="right">
            <a
              href={`/dashboard/ebt/analytics/export.csv?scope=heatmap${filterQs ? `&${filterQs}` : ''}`}
              download
              className="ax-btn"
            >
              Export heatmap CSV
            </a>
            <a
              href={`/dashboard/ebt/analytics/export.pdf${filterQs ? `?${filterQs}` : ''}`}
              download
              className="ax-btn"
            >
              Export PDF
            </a>
          </div>
        </div>

        <Suspense>
          <AnalyticsFilters aircraftOptions={options.aircraft} rankOptions={options.ranks} />
        </Suspense>

        <FleetKpiCards kpis={kpis} />

        <div className="ax-card" style={{ marginBottom: '20px' }}>
          <div className="ax-hd">
            <h3>Competency weakness ranking</h3>
            <span className="ax-scope">All history</span>
          </div>
          <div className="ax-bd">
            <CompetencyWeaknessRanking rows={weakness} labels={compLabels} />
          </div>
        </div>

        <div className="ax-card" style={{ marginBottom: '20px' }}>
          <div className="ax-hd">
            <h3>Competency heatmap</h3>
            <span className="ax-scope">All history</span>
          </div>
          <div className="ax-bd">
            <CompetencyHeatmap rows={heatmap} aircraftLabels={aircraftLabels} />
          </div>
        </div>

        <div className="ax-card" style={{ marginBottom: '20px' }}>
          <div className="ax-hd">
            <h3>Grade distribution by competency</h3>
            <span className="ax-scope">All history</span>
          </div>
          <div className="ax-bd">
            <GradeDistributionBars rows={gradeDist} labels={compLabels} />
          </div>
        </div>

        <div className="ax-card" style={{ marginBottom: '20px' }}>
          <div className="ax-hd">
            <h3>Top observed behaviours (below effective)</h3>
            <span className="ax-scope">All history</span>
          </div>
          <div className="ax-bd">
            <TopBehavioursView rows={topBehaviours} obLabels={obLabels} />
          </div>
        </div>

        <div className="ax-grid2">
          <div className="ax-card">
            <div className="ax-hd">
              <h3>Module pass rate</h3>
              <span className="ax-scope">All history</span>
            </div>
            <div className="ax-bd">
              <ModuleOutcomeBars rows={outcomes} />
            </div>
          </div>
          <div className="ax-card">
            <div className="ax-hd">
              <h3>Trend over time</h3>
              <span className="ax-scope">Selected window</span>
            </div>
            <div className="ax-bd">
              <FleetTrendChart rows={trend} />
            </div>
          </div>
        </div>

        <div className="ax-grid2" style={{ marginTop: '20px' }}>
          <div className="ax-card">
            <div className="ax-hd">
              <h3>Biggest movers</h3>
              <span className="ax-scope">Selected window</span>
            </div>
            <div className="ax-bd">
              <CompetencyMovers rows={movers} labels={compLabels} />
            </div>
          </div>
          <div className="ax-card">
            <div className="ax-hd">
              <h3>First attempt vs resit</h3>
              <span className="ax-scope">All history</span>
            </div>
            <div className="ax-bd">
              <FirstVsResitView rows={firstResit} labels={compLabels} />
            </div>
          </div>
        </div>

        <div className="ax-card" style={{ marginTop: '20px' }}>
          <div className="ax-hd">
            <h3>Pilots below standard</h3>
            <span className="ax-scope">All history</span>
          </div>
          <div className="ax-bd">
            <BelowStandardPilotsTable pilots={belowStandard} />
          </div>
        </div>
      </div>
    </main>
  )
}
