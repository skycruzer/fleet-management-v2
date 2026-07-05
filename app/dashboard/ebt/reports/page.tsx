import Link from 'next/link'
import { listReports } from '@/lib/ebt/reports/queries'
import { ReportsTable } from '@/components/ebt/reports/reports-table'

export default async function ReportsPage() {
  const reports = await listReports()
  return (
    <main className="ax-main">
      <div className="ax-wrap">
        <div className="ax-pagehead">
          <div>
            <div className="ax-eyebrow">Records</div>
            <h1>Reports</h1>
            <div className="sub">{reports.length} reports</div>
          </div>
          <div className="right">
            <Link className="ax-btn primary" href="/dashboard/ebt/reports/new">
              ＋ New report
            </Link>
          </div>
        </div>
        <ReportsTable reports={reports} />
      </div>
    </main>
  )
}
