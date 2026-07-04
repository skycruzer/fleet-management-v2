'use client'
import { useState, useTransition, useEffect, useCallback } from 'react'
import {
  setGrade,
  saveEvalPhase,
  clearObservedBehaviours,
} from '@/app/dashboard/ebt/reports/report-actions'
import {
  consecutiveFailCompetencies,
  type CarryoverFocus,
  type GradeMap,
} from '@/lib/ebt/reports/rule'
import { useAutosave } from '@/lib/ebt/reports/use-autosave'
import { useFlowSave } from '@/components/ebt/reports/capture-flow'
import { cn } from '@/lib/ebt/cn'
import { ObSelector, type ObOption } from './ob-selector'

/** Accepts both `name` (from tests / new callers) and `display_name` (from DB via getFormRefs). */
interface Competency {
  code: string
  display_name?: string
  name?: string
}

type EvalFields = { technical: string; nonTechnical: string; comments: string; result: string }

const AUTOSAVE_INITIAL = { ok: false, message: '' }

export function GradeMatrix({
  reportId,
  phase: _phase,
  competencies,
  carryover = [],
  initialGrades,
  initialResult = null,
  events = { technical: null, nonTechnical: null, comments: null },
  locked,
  observableBehaviours = [],
  initialObs = {},
}: {
  reportId: string
  /** Phase context (currently always EVAL; accepted for forward-compat and test clarity). */
  phase?: string
  competencies: Competency[]
  carryover?: CarryoverFocus[]
  initialGrades: GradeMap
  initialResult?: 'pass' | 'fail' | 'incomplete' | null
  events?: { technical: string | null; nonTechnical: string | null; comments: string | null }
  locked: boolean
  /** OB catalog entries to show under each graded-1/2/5 competency. */
  observableBehaviours?: ObOption[]
  /** Pre-selected OB ids keyed by competency_code (from report_observed_behaviours). */
  initialObs?: Record<string, string[]>
}) {
  const [grades, setGrades] = useState<GradeMap>(initialGrades)
  // The examiner's chosen result, seeded from the persisted value and overridable by clicking a
  // radio; a DB-confirmed result from a grade save also syncs it (controlled, so it reflects the
  // server after each save rather than freezing at the initial render).
  const [resultChoice, setResultChoice] = useState<'pass' | 'fail' | 'incomplete' | null>(
    initialResult
  )
  const [gradeError, setGradeError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Local state for textarea values (controlled so autosave can read current values on change).
  const [technical, setTechnical] = useState(events.technical ?? '')
  const [nonTechnical, setNonTechnical] = useState(events.nonTechnical ?? '')
  const [comments, setComments] = useState(events.comments ?? '')

  const carryCodes = new Set(carryover.map((c) => c.competency_code))
  const failed = new Set(consecutiveFailCompetencies(carryover, grades))
  const ruleLockedToFail = failed.size > 0
  const effectiveResult = ruleLockedToFail ? 'fail' : resultChoice

  // Autosave: builds FormData from current field values and calls the server action.
  const saveFn = useCallback(
    (f: EvalFields) => {
      const fd = new FormData()
      fd.set('technical_events', f.technical)
      fd.set('non_technical_events', f.nonTechnical)
      fd.set('overall_comments', f.comments)
      fd.set('result', f.result)
      return saveEvalPhase(reportId, AUTOSAVE_INITIAL, fd).then((r) => ({
        ok: r.ok,
        message: r.message,
      }))
    },
    [reportId]
  )

  const autosave = useAutosave<EvalFields>(saveFn, { debounceMs: 800 })

  // Push autosave state + message to the flow footer.
  const flowSave = useFlowSave()
  useEffect(() => {
    flowSave(autosave.state, autosave.message)
  }, [autosave.state, autosave.message, flowSave])

  // Helper: build the current field snapshot (used by both textarea + radio handlers).
  function currentFields(overrides?: Partial<EvalFields>): EvalFields {
    return {
      technical,
      nonTechnical,
      comments,
      // When the rule has locked the result to fail, always persist "fail" regardless of
      // what the radio might show — mirrors the server-side coercion in saveEvalPhase.
      result: ruleLockedToFail ? 'fail' : (resultChoice ?? ''),
      ...overrides,
    }
  }

  function pick(code: string, g: number) {
    if (locked) return
    const prev = grades // capture for rollback if the save is rejected
    const next = { ...grades, [code]: grades[code] === g ? null : g }
    setGrades(next)
    setGradeError(null)
    const newGrade = next[code]
    startTransition(async () => {
      const res = await setGrade(reportId, code, next[code])
      if (!res.ok) {
        setGrades(prev) // the write was rejected (draft-lock / RLS / DB error): undo the optimism
        setGradeError(res.message ?? 'Could not save the grade.')
        return
      }
      // §15.3: clear OBs ONLY after the grade change has persisted (grade 3, 4, or null carries no OB
      // evidence). Await it (not fire-and-forget): the await lets Next apply the action's revalidation
      // and refresh the route, so the freshly-cleared initialObs reaches the client. Without it, a
      // regrade back to 1/2/5 re-mounts the OB selector from the stale (pre-clear) snapshot.
      if (newGrade === 3 || newGrade === 4 || newGrade == null) {
        await clearObservedBehaviours(reportId, code)
      }
      // Saved. Only trust the result when the DB re-read was confirmed; a confirmed FAIL syncs the
      // radio. resultConfirmed:false means the grade persisted but the result couldn't be refreshed.
      if (res.resultConfirmed) {
        if (res.evalResult) setResultChoice(res.evalResult)
      } else if (res.message) {
        setGradeError(res.message)
      }
    })
  }

  return (
    <div>
      {/* Events */}
      <div className="rf-grid2 rf-blockgap">
        <div className="rf-field">
          <label className="rf-lbl">TECHNICAL EVENTS</label>
          <textarea
            className="rf-ctl"
            value={technical}
            onChange={(e) => {
              setTechnical(e.target.value)
              autosave.schedule(currentFields({ technical: e.target.value }))
            }}
            disabled={locked}
          />
        </div>
        <div className="rf-field">
          <label className="rf-lbl">NON - TECHNICAL EVENTS</label>
          <textarea
            className="rf-ctl"
            value={nonTechnical}
            onChange={(e) => {
              setNonTechnical(e.target.value)
              autosave.schedule(currentFields({ nonTechnical: e.target.value }))
            }}
            disabled={locked}
          />
        </div>
      </div>

      {/* Competency grades */}
      <label className="rf-lbl">Competency</label>
      <div className="rf-compwrap rf-blockgap">
        {competencies.map((c) => {
          const isFailed = failed.has(c.code)
          const grade = grades[c.code]
          return (
            <div key={c.code} className="rf-comp">
              <span className="rf-code">{c.code}</span>
              <span className="rf-nm">{c.display_name ?? c.name}</span>
              <span className="rf-tiles">
                {[1, 2, 3, 4, 5].map((g) => {
                  const sel = grade === g
                  const tone = g <= 2 ? 'red' : g === 3 ? 'amber' : 'green'
                  return (
                    <button
                      key={g}
                      type="button"
                      data-testid={`grade-${c.code}-${g}`}
                      aria-pressed={sel}
                      onClick={() => pick(c.code, g)}
                      disabled={locked}
                      className={cn('rf-tile', sel && 'sel', sel && tone)}
                    >
                      {g}
                    </button>
                  )
                })}
              </span>
              <span className="rf-cstat">
                {isFailed ? (
                  <span className="below">⛔ 2nd consecutive ≤2</span>
                ) : grade != null && grade <= 2 ? (
                  <span className="below">below standard</span>
                ) : grade === 3 ? (
                  <span className="min">minimum standard</span>
                ) : grade != null && grade >= 4 ? (
                  <span className="ok">✓</span>
                ) : null}
              </span>
              {!locked && (grade === 1 || grade === 2 || grade === 5) && (
                <ObSelector
                  reportId={reportId}
                  code={c.code}
                  options={observableBehaviours.filter((o) => o.competency_code === c.code)}
                  initialSelected={initialObs[c.code] ?? []}
                  locked={locked}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Consecutive-fail rule banner */}
      {ruleLockedToFail && (
        <div
          style={{
            borderLeft: '4px solid #c0392b',
            background: '#fef2f2',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 13,
            color: '#7f1d1d',
          }}
        >
          <b>Consecutive below-standard detected: {[...failed].join(', ')}.</b> Per Air Niugini TCM,
          two consecutive grades of 1 or 2 in the same competency = <b>FAIL</b> +{' '}
          <b>mandatory remedial training</b>. Result is set to FAIL and locked; release for line
          operations is blocked.
        </div>
      )}

      {/* Result */}
      <div className="rf-field rf-blockgap">
        <label className="rf-lbl">Result</label>
        <div className="rf-radios inline" role="radiogroup" aria-label="Result">
          {(['pass', 'fail', 'incomplete'] as const).map((r) => (
            <label
              key={r}
              className={cn(
                'rf-radio',
                effectiveResult === r && 'sel',
                ruleLockedToFail && r !== 'fail' ? 'opacity-40' : ''
              )}
            >
              <input
                type="radio"
                className="sr-only"
                name={`result-${reportId}`}
                value={r}
                checked={effectiveResult === r}
                disabled={locked || (ruleLockedToFail && r !== 'fail')}
                onChange={() => {
                  setResultChoice(r)
                  // Immediate save on result change; when rule is locked, persist "fail" regardless.
                  void autosave.saveNow(currentFields({ result: ruleLockedToFail ? 'fail' : r }))
                }}
              />
              <span className="rf-rb" aria-hidden="true" />
              <span className="rf-rt">
                {r === 'pass' ? 'PASS' : r === 'fail' ? 'FAIL' : 'INCOMPLETE'}
              </span>
            </label>
          ))}
          {ruleLockedToFail && (
            <span
              style={{
                fontSize: 11,
                color: '#c0392b',
                fontWeight: 700,
                padding: '4px 10px',
                background: '#fef2f2',
                borderRadius: 8,
              }}
            >
              🔒 Locked by rule
            </span>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="rf-field">
        <label className="rf-lbl">Evaluation - General Comments from Examiner</label>
        <textarea
          className="rf-ctl"
          value={comments}
          onChange={(e) => {
            setComments(e.target.value)
            autosave.schedule(currentFields({ comments: e.target.value }))
          }}
          disabled={locked}
          style={{ minHeight: 104 }}
        />
      </div>

      {/* role=alert/status so screen-reader examiners hear save failures — a grade that
          silently fails to persist is a grading-integrity hazard. */}
      {gradeError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {gradeError}
        </p>
      )}
      {pending && (
        <p role="status" className="mt-1 text-xs text-slate-400">
          Saving grade…
        </p>
      )}
    </div>
  )
}
