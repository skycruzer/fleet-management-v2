import type { ObFrequencyRow } from '@/lib/ebt/analytics/queries'

export function RecurringBehavioursPanel({ rows }: { rows: ObFrequencyRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="ax-empty" data-testid="ob-empty">
        No recorded observable behaviours yet.
      </div>
    )
  }
  const development = rows.filter((r) => r.direction === 'development')
  const exemplary = rows.filter((r) => r.direction === 'exemplary')
  return (
    <div data-testid="recurring-behaviours-panel" className="space-y-4">
      <ObGroup title="Development areas (graded 1–2)" rows={development} tone="amber" />
      <ObGroup title="Exemplary strengths (graded 5)" rows={exemplary} tone="green" />
    </div>
  )
}

function ObGroup({
  title,
  rows,
  tone,
}: {
  title: string
  rows: ObFrequencyRow[]
  tone: 'amber' | 'green'
}) {
  if (rows.length === 0) return null
  const dot = tone === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div>
      <div className="text-muted-foreground mb-1 text-xs uppercase">{title}</div>
      {rows.map((r) => (
        <div
          key={`${r.competencyCode}-${r.observableBehaviourId}`}
          className="border-border flex items-center gap-2 border-b py-1.5 text-sm last:border-0"
        >
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          <span className="font-medium">{r.competencyCode}</span>
          <span className="text-muted-foreground ml-auto font-mono text-xs">×{r.n}</span>
        </div>
      ))}
    </div>
  )
}
