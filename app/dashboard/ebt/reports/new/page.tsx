import Link from 'next/link'
import { requireRole } from '@/lib/ebt/auth/roles'
import { listPilots, listPilotCurrencyDetail } from '@/lib/ebt/roster/queries'
import { getFormRefs } from '@/lib/ebt/reports/queries'
import { NewReportForm } from './new-report-form'

export default async function NewReportPage() {
  await requireRole('examiner')
  const [pilots, currency, refs] = await Promise.all([
    listPilots(),
    listPilotCurrencyDetail(),
    getFormRefs(),
  ])
  return (
    <main className="ax-main">
      <div className="ax-wrap">
        <div className="ax-pagehead">
          <div>
            <p className="ax-eyebrow">Reports</p>
            <h1>New training &amp; evaluation report</h1>
          </div>
          <div className="right">
            <Link href="/dashboard/ebt/reports" className="ax-btn">
              Cancel
            </Link>
          </div>
        </div>
        <NewReportForm
          pilots={pilots
            .filter((p) => p.employment_status === 'active')
            .map((p) => ({
              id: p.id,
              name: p.full_name,
              staffNo: p.staff_no,
              rank: p.rank,
              aircraft: p.aircraft,
              currency: currency.get(p.id) ?? null,
            }))}
          checkTypes={refs.checkTypes}
        />
      </div>
    </main>
  )
}
