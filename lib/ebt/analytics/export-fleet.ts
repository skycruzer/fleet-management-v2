import { toCsv, type CsvValue } from './csv'
// Canonical fleet row shapes are owned by queries.ts: HeatmapRow + TrendRow + ModuleOutcomeRow +
// PilotStanding are SOLE-authored by the Phase-4 fleet layer (camelCase). The serializer consumes
// them directly — the outcomes scope feeds getModuleOutcomes()'s ModuleOutcomeRow (moduleNo: number | null),
// the below-standard scope feeds getBelowStandardPilots()'s PilotStanding (per-pilot counts on the row).
import type { HeatmapRow, ModuleOutcomeRow, TrendRow, PilotStanding } from './queries'

export const FLEET_SCOPES = ['heatmap', 'outcomes', 'trend', 'below_standard'] as const
export type FleetScope = (typeof FLEET_SCOPES)[number]

/** Minimal shape the builder needs from PilotStanding — subset so route handlers can pass
 *  the full PilotStanding[] without extra mapping. */
export type BelowStandardRow = Pick<
  PilotStanding,
  'pilotId' | 'fullName' | 'staffNo' | 'tier' | 'notCompetentCount' | 'belowEffectiveCount'
>

export interface FleetExportInput {
  heatmap: HeatmapRow[] // { competencyCode, aircraftTypeId, rank, avgGrade, pctBelow3, pctNotCompetent, nGraded }
  outcomes: ModuleOutcomeRow[] // { moduleNo: number | null, aircraftTypeId, rank, pass, fail, incomplete, resit, total }
  trend: TrendRow[] // { competencyCode, month, aircraftTypeId, rank, avgGrade, pctBelow3, nGraded }
  belowStandard: BelowStandardRow[] // { pilotId, fullName, staffNo, tier, notCompetentCount, belowEffectiveCount }
}

// Spec §5.2: rank IS NULL buckets as "Unspecified".
const rank = (r: string | null): string => r ?? 'Unspecified'

/** Format a 0–1 fraction as a whole-number percentage string (e.g. 0.45 → "45"). */
const pctStr = (v: number): string => String(Math.round(v * 100))

/** One CSV for the requested fleet scope, over the already-filtered (RLS + query WHERE) rows. */
export function buildFleetCsv(scope: FleetScope, d: FleetExportInput): string {
  switch (scope) {
    case 'heatmap':
      return toCsv(
        [
          'competency',
          'aircraft_type_id',
          'rank',
          'avg_grade',
          'pct_below_3',
          'pct_not_competent',
          'n_graded',
        ],
        d.heatmap.map((r): CsvValue[] => [
          r.competencyCode,
          r.aircraftTypeId,
          rank(r.rank),
          r.avgGrade,
          pctStr(r.pctBelow3),
          pctStr(r.pctNotCompetent),
          r.nGraded,
        ])
      )
    case 'outcomes':
      // moduleNo is number | null — csvCell renders null as an empty cell (blank module_no column).
      return toCsv(
        ['module_no', 'aircraft_type_id', 'rank', 'pass', 'fail', 'incomplete', 'resit', 'total'],
        d.outcomes.map((r): CsvValue[] => [
          r.moduleNo,
          r.aircraftTypeId,
          rank(r.rank),
          r.pass,
          r.fail,
          r.incomplete,
          r.resit,
          r.total,
        ])
      )
    case 'trend':
      return toCsv(
        ['competency', 'month', 'aircraft_type_id', 'rank', 'avg_grade', 'pct_below_3', 'n_graded'],
        d.trend.map((r): CsvValue[] => [
          r.competencyCode,
          r.month,
          r.aircraftTypeId,
          rank(r.rank),
          r.avgGrade,
          pctStr(r.pctBelow3),
          r.nGraded,
        ])
      )
    case 'below_standard':
      return toCsv(
        [
          'pilot_id',
          'pilot_name',
          'staff_no',
          'tier',
          'not_competent_count',
          'below_effective_count',
        ],
        d.belowStandard.map((r): CsvValue[] => [
          r.pilotId,
          r.fullName,
          r.staffNo,
          r.tier,
          r.notCompetentCount,
          r.belowEffectiveCount,
        ])
      )
  }
}
