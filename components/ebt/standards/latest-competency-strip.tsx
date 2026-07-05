import { gradeCellTone, type Tone } from '@/lib/ebt/analytics/standing-display'
import type { LatestEvalCell } from '@/lib/ebt/analytics/queries'

const CELL_CLASS: Record<Tone, string> = {
  red: 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
  amber:
    'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  muted: 'border-border bg-muted text-muted-foreground',
  green: '',
  orange: '',
}

export function LatestCompetencyStrip({
  cells,
  recurringTwos,
  moduleNo,
}: {
  cells: LatestEvalCell[]
  recurringTwos: string[]
  moduleNo: number | null
}) {
  const recurring = new Set(recurringTwos)
  return (
    <div data-testid="latest-competency-strip">
      <div className="text-muted-foreground mb-2 text-xs uppercase">
        Latest competency standing
        {moduleNo != null ? ` · EVAL, Module ${moduleNo}` : ''}
      </div>
      <div className="flex flex-wrap gap-2">
        {cells.map((c) => {
          const tone = gradeCellTone(c.grade)
          const mark = c.grade === 1 ? '✖' : recurring.has(c.competencyCode) ? '⚠' : ''
          return (
            <div
              key={c.competencyCode}
              className={`flex h-12 w-16 flex-col items-center justify-center rounded-lg border text-sm font-bold ${CELL_CLASS[tone]}`}
              data-competency={c.competencyCode}
              data-grade={c.grade ?? ''}
            >
              <span className="text-[10px] font-medium opacity-70">{c.competencyCode}</span>
              <span>
                {c.grade ?? '—'}
                {mark && <span className="ml-0.5">{mark}</span>}
              </span>
            </div>
          )
        })}
      </div>
      <div className="text-muted-foreground mt-2 text-[11px]">
        1 = red (Not Competent) · 2 = amber (below effective) · ≥3 ok · ⚠ recurring 2 · ✖ grade 1
      </div>
    </div>
  )
}
