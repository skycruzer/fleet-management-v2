// Pure, surface-agnostic mirror of the consecutive-fail rule (spec §8). Drives instant UI
// feedback in the grade matrix. The DATABASE is authoritative (evaluate_eval_result trigger);
// this mirror only powers optimistic display + the client lock, and is re-validated
// server-side on every grade save and on submit.

export interface CarryoverFocus {
  competency_code: string
  previous_grade: number // 1..5; the snapshot only stores ≤2, but we guard anyway
}

export type GradeMap = Record<string, number | null> // competency_code -> 1..5 or null (not assessed)

/** Codes in a SECOND consecutive ≤2: carryover previous_grade ≤2 AND this EVAL grade ≤2.
 *  These auto-FAIL the check and raise mandatory remedial training. */
export function consecutiveFailCompetencies(
  carryover: CarryoverFocus[],
  grades: GradeMap
): string[] {
  const failed: string[] = []
  for (const c of carryover) {
    if (c.previous_grade > 2) continue
    const g = grades[c.competency_code]
    if (g != null && g <= 2) failed.push(c.competency_code)
  }
  return failed
}

/** Whether the rule forces (and locks) a FAIL result. */
export function isLockedToFail(carryover: CarryoverFocus[], grades: GradeMap): boolean {
  return consecutiveFailCompetencies(carryover, grades).length > 0
}
