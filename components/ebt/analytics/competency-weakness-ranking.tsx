import type { WeaknessRow } from '@/lib/ebt/analytics/queries'

/** Severity class for an average grade on the 1–5 EVAL scale (3 = effective line). */
export function avgGradeClass(avg: number): 'ok' | 'warn' | 'bad' {
  if (avg < 2.5) return 'bad'
  if (avg < 3) return 'warn'
  return 'ok'
}

/** Analytics A: competencies ranked weakest-first (lowest fleet avg grade), with % below
 *  effective and the assessed-grade count. Names, not codes. */
export function CompetencyWeaknessRanking({
  rows,
  labels,
}: {
  rows: WeaknessRow[]
  labels: Record<string, string>
}) {
  if (rows.length === 0) {
    return <div className="ax-empty">No assessed EVAL grades for this slice.</div>
  }
  return (
    <table className="ax-table">
      <thead>
        <tr>
          <th scope="col">Competency</th>
          <th scope="col">Avg grade</th>
          <th scope="col">Below effective</th>
          <th scope="col">Graded</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.competencyCode}>
            <td className="pname">{labels[r.competencyCode] ?? r.competencyCode}</td>
            <td>
              <span className={`ax-chip ${avgGradeClass(r.avgGrade)}`}>
                <span className="cd" />
                {r.avgGrade.toFixed(2)}
              </span>
            </td>
            <td>{Math.round(r.pctBelowEffective * 100)}%</td>
            <td className="staff">{r.nGraded}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
