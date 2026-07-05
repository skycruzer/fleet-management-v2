import type { CarryoverRow } from '@/lib/ebt/analytics/queries'

export function RemedialCarryoverPanel({ rows }: { rows: CarryoverRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="ax-empty" data-testid="carryover-empty">
        No open carryover deficiencies.
      </div>
    )
  }
  return (
    <div data-testid="remedial-carryover-panel">
      {rows.map((r) => (
        <div
          key={`${r.competencyCode}-${r.sourceModuleNo}`}
          className="border-border flex items-center justify-between border-b py-2 text-sm last:border-0"
        >
          <span className="font-medium">{r.competencyCode}</span>
          <span className="text-muted-foreground">
            grade {r.previousGrade}
            {r.sourceModuleNo != null ? ` · from M${r.sourceModuleNo}` : ''}
          </span>
        </div>
      ))}
    </div>
  )
}
