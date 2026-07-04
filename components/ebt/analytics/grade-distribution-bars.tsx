import type { CompetencyGradeDist } from '@/lib/ebt/analytics/queries'

// Grade 1..5 colour scale: 1 not-competent (red) → 5 exemplary (deep green).
const GRADE_COLORS = {
  g1: '#c0392b',
  g2: '#b3862f',
  g3: '#3a5fb0',
  g4: '#2f7d4f',
  g5: '#1e5f3a',
} as const
const GRADE_LABELS = {
  g1: '1 · Not competent',
  g2: '2 · Below effective',
  g3: '3 · Effective',
  g4: '4 · Above',
  g5: '5 · Exemplary',
} as const
const KEYS = ['g1', 'g2', 'g3', 'g4', 'g5'] as const

/** Analytics B: per-competency stacked distribution of EVAL grades 1..5. Shows the spread, not
 *  just the mean — a 3.0 from 3,3,3 reads very differently from 1,3,5. */
export function GradeDistributionBars({
  rows,
  labels,
}: {
  rows: CompetencyGradeDist[]
  labels: Record<string, string>
}) {
  const withData = rows.filter((r) => r.total > 0)
  if (withData.length === 0) {
    return <div className="ax-empty">No assessed EVAL grades for this slice.</div>
  }
  return (
    <div>
      <div className="ax-legend">
        {KEYS.map((g) => (
          <span className="k" key={g}>
            <span className="sw" style={{ background: GRADE_COLORS[g] }} /> {GRADE_LABELS[g]}
          </span>
        ))}
      </div>
      <div className="ax-bars">
        {withData.map((r) => {
          const name = labels[r.competencyCode] ?? r.competencyCode
          return (
            <div className="row" key={r.competencyCode}>
              <span className="cc" style={{ minWidth: 150 }}>
                {name}
              </span>
              <span
                className="bar"
                style={{ display: 'flex' }}
                role="img"
                aria-label={`${name}: ${r.g1} grade 1, ${r.g2} grade 2, ${r.g3} grade 3, ${r.g4} grade 4, ${r.g5} grade 5`}
              >
                {KEYS.map((g) =>
                  r.shares[g] > 0 ? (
                    <i
                      key={g}
                      style={{
                        width: `${r.shares[g] * 100}%`,
                        background: GRADE_COLORS[g],
                        borderRadius: 0,
                      }}
                    />
                  ) : null
                )}
              </span>
              <span className="val">{r.total}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
