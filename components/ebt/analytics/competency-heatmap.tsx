import { rankLabel, type HeatmapRow } from '@/lib/ebt/analytics/queries'

const COMPETENCIES = ['KNO', 'FPM', 'FPA', 'PRO', 'WLM', 'SAW', 'PSD', 'COM', 'LTW'] as const

/** Color by pct_below_3; add `nc` accent when any grade-1 share present. Pure → unit-tested. */
export function heatClass(pctBelow3: number, pctNotCompetent: number): string {
  let band: string
  if (pctBelow3 <= 0) band = 'ok'
  else if (pctBelow3 < 0.25) band = 'warn'
  else band = 'bad'
  const accent = pctNotCompetent > 0 ? ' nc' : ''
  return `ax-heat ${band}${accent}`
}

type RowKey = string // `${aircraft_type_id ?? "none"}|${rank ?? "none"}`

export function CompetencyHeatmap({
  rows,
  aircraftLabels,
}: {
  rows: HeatmapRow[]
  aircraftLabels: Record<string, string>
}) {
  if (rows.length === 0) {
    return <div className="ax-empty">No graded EVALs in this slice.</div>
  }
  // Group rows by (aircraft, rank); cols = competencies.
  const byRow = new Map<RowKey, { label: string; cells: Map<string, HeatmapRow> }>()
  for (const r of rows) {
    const key: RowKey = `${r.aircraftTypeId ?? 'none'}|${r.rank ?? 'none'}`
    const acLabel = r.aircraftTypeId
      ? (aircraftLabels[r.aircraftTypeId] ?? r.aircraftTypeId)
      : 'All types'
    const label = `${acLabel} · ${rankLabel(r.rank)}`
    const entry = byRow.get(key) ?? { label, cells: new Map() }
    entry.cells.set(r.competencyCode, r)
    byRow.set(key, entry)
  }
  return (
    <>
      <div className="ax-heatmap" role="table" aria-label="Competency heatmap">
        <div className="ax-heatrow head" role="row">
          <span className="ax-heatlabel" role="columnheader">
            Slice
          </span>
          {COMPETENCIES.map((c) => (
            <span key={c} className="ax-heatcell head" role="columnheader">
              {c}
            </span>
          ))}
        </div>
        {[...byRow.values()].map((row) => (
          <div className="ax-heatrow" role="row" key={row.label}>
            <span className="ax-heatlabel" role="rowheader">
              {row.label}
            </span>
            {COMPETENCIES.map((c) => {
              const cell = row.cells.get(c)
              if (!cell) {
                return (
                  <span
                    key={c}
                    className="ax-heat empty"
                    role="cell"
                    aria-label={`${c}: no data`}
                  />
                )
              }
              return (
                <span
                  key={c}
                  className={heatClass(cell.pctBelow3, cell.pctNotCompetent)}
                  role="cell"
                  title={`${c}: ${(cell.pctBelow3 * 100).toFixed(0)}% below effective · avg ${cell.avgGrade.toFixed(1)} · n=${cell.nGraded}`}
                >
                  {(cell.pctBelow3 * 100).toFixed(0)}%
                </span>
              )
            })}
          </div>
        ))}
      </div>
      <div className="ax-legend">
        <span className="k">
          <span className="sw" style={{ background: 'var(--ax-green)' }} />
          0% below
        </span>
        <span className="k">
          <span className="sw" style={{ background: 'var(--ax-amber)' }} />
          &lt;25% below
        </span>
        <span className="k">
          <span className="sw" style={{ background: 'var(--ax-red)' }} />
          &ge;25% below
        </span>
        <span className="k">
          <span
            className="sw"
            style={{
              background: 'transparent',
              outline: '2px solid #7f1d1d',
              outlineOffset: '-2px',
            }}
          />
          outline = grade 1 (not competent) present
        </span>
        <span className="k">
          cells = % of EVALs below effective (grade &lt; 3); lower is better
        </span>
      </div>
    </>
  )
}
