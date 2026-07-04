import { Card, CardContent, CardHeader, CardTitle } from '@/components/ebt/ui/card'
import { ModuleTimeline } from '@/components/ebt/roster/module-timeline'
import { StandingBadge } from './standing-badge'
import { LatestCompetencyStrip } from './latest-competency-strip'
import { CompetencyTrendChart } from './competency-trend-chart'
import { RemedialCarryoverPanel } from './remedial-carryover-panel'
import { RecurringBehavioursPanel } from './recurring-behaviours-panel'
import {
  getPilotLatestEval,
  getPilotStandingSignals,
  getPilotCompetencyTrend,
  getPilotCarryover,
  getPilotObFrequency,
  pivotTrend,
} from '@/lib/ebt/analytics/queries'

export async function StandardsTab({
  pilotId,
  moduleProgress,
}: {
  pilotId: string
  moduleProgress: {
    last_completed_module_no: number | null
    modules_completed: number | null
    next_module_suggested: number | null
  } | null
}) {
  const [latest, standing, trendRows, carryover, obs] = await Promise.all([
    getPilotLatestEval(pilotId),
    getPilotStandingSignals(pilotId),
    getPilotCompetencyTrend(pilotId), // canonical FLAT TrendPoint[]
    getPilotCarryover(pilotId),
    getPilotObFrequency(pilotId),
  ])
  // Pivot the FLAT trend rows into recharts points (Task 3 helper).
  const trend = pivotTrend(trendRows)

  // FIX #1: counts come from v_pilot_standing_signals (module-ranked) — the SAME source as
  // the fleet below-standard table — NOT recomputed from the date-ranked latest-EVAL cells,
  // so the badge tier and its counts agree and match the fleet view.
  const { signals, notCompetentCount, belowEffectiveCount } = standing
  const latestModuleNo = latest.find((c) => c.moduleNo != null)?.moduleNo ?? null

  return (
    <div className="space-y-5">
      <div className="flex justify-end gap-3">
        <a
          href={`/dashboard/ebt/pilots/${pilotId}/standards/export.csv`}
          download
          className="rf-btn"
        >
          Export CSV
        </a>
        <a
          href={`/dashboard/ebt/pilots/${pilotId}/standards/export.pdf`}
          download
          className="rf-btn"
        >
          Export PDF
        </a>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Standing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StandingBadge
            signals={signals}
            notCompetentCount={notCompetentCount}
            belowEffectiveCount={belowEffectiveCount}
          />
          <LatestCompetencyStrip
            cells={latest}
            recurringTwos={signals.recurringTwos}
            moduleNo={latestModuleNo}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trend over modules</CardTitle>
          </CardHeader>
          <CardContent>
            <CompetencyTrendChart points={trend.points} competencies={trend.competencies} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Remedials &amp; carryover</CardTitle>
          </CardHeader>
          <CardContent>
            <RemedialCarryoverPanel rows={carryover} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Module timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ModuleTimeline
              lastCompleted={moduleProgress?.last_completed_module_no ?? null}
              modulesCompleted={moduleProgress?.modules_completed ?? null}
              nextSuggested={moduleProgress?.next_module_suggested ?? null}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recurring behaviours</CardTitle>
          </CardHeader>
          <CardContent>
            <RecurringBehavioursPanel rows={obs} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
