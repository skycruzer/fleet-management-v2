import type { CompetencyFirstResit } from '@/lib/ebt/analytics/queries'

/** Only competencies with resit EVALs are comparable; sort by largest recovery (delta desc). */
export function comparableResitRows(rows: CompetencyFirstResit[]): CompetencyFirstResit[] {
  return rows
    .filter((r) => r.resitN > 0 && r.delta != null)
    .sort((a, b) => (b.delta as number) - (a.delta as number))
}

/** Analytics D: first-attempt vs resit average grade per competency. A positive change (green ▲)
 *  means resits recovered performance. */
export function FirstVsResitView({
  rows,
  labels,
}: {
  rows: CompetencyFirstResit[]
  labels: Record<string, string>
}) {
  const comparable = comparableResitRows(rows)
  if (comparable.length === 0) {
    return <div className="ax-empty">No resit EVALs recorded for this slice yet.</div>
  }
  return (
    <table className="ax-table">
      <thead>
        <tr>
          <th scope="col">Competency</th>
          <th scope="col">First attempt</th>
          <th scope="col">Resit</th>
          <th scope="col">Change</th>
        </tr>
      </thead>
      <tbody>
        {comparable.map((r) => {
          const up = (r.delta as number) >= 0
          return (
            <tr key={r.competencyCode}>
              <td className="pname">{labels[r.competencyCode] ?? r.competencyCode}</td>
              <td>
                {(r.firstAvg as number).toFixed(2)}{' '}
                <span style={{ color: 'var(--ax-muted)' }}>({r.firstN})</span>
              </td>
              <td>
                {(r.resitAvg as number).toFixed(2)}{' '}
                <span style={{ color: 'var(--ax-muted)' }}>({r.resitN})</span>
              </td>
              <td style={{ color: up ? 'var(--ax-green)' : 'var(--ax-red)', fontWeight: 700 }}>
                {up ? '▲' : '▼'} {Math.abs(r.delta as number).toFixed(2)}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
