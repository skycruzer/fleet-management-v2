// Standing classification — the one piece of domain policy (spec §6).
// Pure function imported identically by the screen, CSV, and PDF generators,
// so the derived tier can never disagree across surfaces. Types co-located
// here (no types.ts), matching lib/dashboard / lib/reports / lib/roster.

export type Grade = 1 | 2 | 3 | 4 | 5

export type StandingTier =
  | 'effective'
  | 'competent_monitor'
  | 'additional_training'
  | 'not_competent'

export interface StandingSignals {
  /** any latest-EVAL competency graded 1 → TCM "Not Competent" */
  anyGradeOne: boolean
  /** competencies graded 2 in BOTH of the two most-recent assessed modules */
  recurringTwos: string[]
  /** any latest-EVAL competency graded 2 (below the "effective" standard) */
  anyGradeTwo: boolean
}

/**
 * Classify a pilot's standing from raw grade signals (spec §6).
 * Precedence, most severe first:
 *   any grade 1            → not_competent
 *   recurring 2 (≥1)       → additional_training (3-month)
 *   any grade 2            → competent_monitor
 *   otherwise (all ≥ 3)    → effective
 */
export function classifyStanding(s: StandingSignals): StandingTier {
  if (s.anyGradeOne) return 'not_competent'
  if (s.recurringTwos.length > 0) return 'additional_training'
  if (s.anyGradeTwo) return 'competent_monitor'
  return 'effective'
}
