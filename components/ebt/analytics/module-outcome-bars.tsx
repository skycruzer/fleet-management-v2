import type { ModuleOutcomeRow } from '@/lib/ebt/analytics/queries'

export function ModuleOutcomeBars({ rows }: { rows: ModuleOutcomeRow[] }) {
  if (rows.length === 0) return <div className="ax-empty">No module outcomes yet.</div>
  // Aggregate across (aircraft, rank) slices to one bar per moduleNo.
  const byModule = new Map<number, { pass: number; fail: number; incomplete: number }>()
  for (const r of rows) {
    const key = r.moduleNo ?? -1
    const m = byModule.get(key) ?? { pass: 0, fail: 0, incomplete: 0 }
    m.pass += r.pass
    m.fail += r.fail
    m.incomplete += r.incomplete
    byModule.set(key, m)
  }
  const modules = [...byModule.entries()].sort((a, b) => a[0] - b[0])
  return (
    <div className="ax-bars">
      {modules.map(([mod, agg]) => {
        // Pass rate over DECIDED outcomes (pass+fail+incomplete); result-less phases excluded.
        const decided = agg.pass + agg.fail + agg.incomplete
        const pct = decided > 0 ? (agg.pass / decided) * 100 : 0
        const label = mod === -1 ? 'M—' : `M${mod}`
        const extra = [
          agg.fail ? `${agg.fail} fail` : null,
          agg.incomplete ? `${agg.incomplete} incomplete` : null,
        ]
          .filter(Boolean)
          .join(' · ')
        return (
          <div className="row" key={mod}>
            <span className="cc">{label}</span>
            {/* role=img + aria-label: title= alone is hover-only and invisible to screen readers. */}
            <span
              className="bar"
              role="img"
              aria-label={`${label}: ${agg.pass} of ${decided} pass${extra ? `, ${extra}` : ''}; target 80%`}
              title={`${agg.pass}/${decided} pass${extra ? ` · ${extra}` : ''}`}
            >
              <i
                style={{
                  width: `${pct}%`,
                  background:
                    pct >= 80 ? 'var(--ax-green)' : pct >= 50 ? 'var(--ax-amber)' : 'var(--ax-red)',
                }}
              />
              <span
                className="mark"
                style={{ left: '80%' }}
                aria-hidden="true"
                title="80% target"
              />
            </span>
            <span className="val">
              {pct.toFixed(0)}% ({agg.pass}/{decided})
            </span>
          </div>
        )
      })}
    </div>
  )
}
