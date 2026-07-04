import { toCsv, type CsvValue } from './csv'
import type { StandingTier } from './standing'
// Canonical row shapes are owned by queries.ts (Phase 2). The serializer consumes the
// FLAT getPilotCompetencyTrend (TrendPoint[]), the LatestEvalCell, and the CarryoverRow.
import type { LatestEvalCell, TrendPoint, CarryoverRow } from './queries'

export interface PilotExportInput {
  pilotName: string | null
  staffNo: string | null
  standing: { tier: StandingTier; notCompetentCount: number; belowEffectiveCount: number }
  latest: LatestEvalCell[] // { competencyCode, grade, moduleNo, trainingDate }
  trend: TrendPoint[] // FLAT: { competencyCode, reportId, grade, moduleNo, trainingDate }
  carryover: CarryoverRow[] // { competencyCode, previousGrade, sourceModuleNo }
}

/** One multi-section CSV for a pilot's Standards profile. Section column tags each block so
 *  the four datasets coexist in a single download (mirrors the on-screen Standards tab). */
export function buildPilotStandardsCsv(d: PilotExportInput): string {
  const standing = toCsv(
    ['section', 'pilot', 'staff_no', 'standing', 'not_competent_count', 'below_effective_count'],
    [
      [
        'standing',
        d.pilotName,
        d.staffNo,
        d.standing.tier,
        d.standing.notCompetentCount,
        d.standing.belowEffectiveCount,
      ],
    ]
  )
  const latest = toCsv(
    ['section', 'competency', 'grade', 'module_no', 'training_date'],
    d.latest.map((r): CsvValue[] => [
      'latest',
      r.competencyCode,
      r.grade,
      r.moduleNo,
      r.trainingDate,
    ])
  )
  // FLAT trend: one row per (competency, module) straight from getPilotCompetencyTrend — no pivot.
  const trend = toCsv(
    ['section', 'competency', 'grade', 'module_no', 'training_date'],
    d.trend.map((r): CsvValue[] => ['trend', r.competencyCode, r.grade, r.moduleNo, r.trainingDate])
  )
  const carryover = toCsv(
    ['section', 'competency', 'previous_grade', 'source_module_no'],
    d.carryover.map((r): CsvValue[] => [
      'carryover',
      r.competencyCode,
      r.previousGrade,
      r.sourceModuleNo,
    ])
  )
  // Blank line between blocks keeps the single file readable when opened in a spreadsheet.
  return [standing, latest, trend, carryover].join('\r\n')
}
