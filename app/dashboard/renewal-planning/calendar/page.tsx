/**
 * Calendar View Page for Renewal Planning
 * Displays yearly overview of all roster periods
 */

import { getRosterPeriodCapacity } from '@/lib/services/certification-renewal-planning-service'
import { createClient } from '@/lib/supabase/server'
import { RenewalCalendarYearly } from '@/components/renewal-planning/renewal-calendar-yearly'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Mail } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getRosterPeriodSummariesForYear(year: number) {
  const supabase = await createClient()

  // Get roster periods that cover the selected year (February - November only)
  // This excludes December and January from renewal scheduling
  const { data: periods } = await supabase
    .from('roster_period_capacity')
    .select('roster_period, period_start_date, period_end_date')
    .gte('period_start_date', `${year}-02-01`) // Start from February
    .lte('period_start_date', `${year}-11-30`) // End in November
    .order('period_start_date')

  if (!periods) return []

  // Get capacity summaries for each period
  const summaries = await Promise.all(
    periods.map(async (p) => {
      const summary = await getRosterPeriodCapacity(p.roster_period)
      return summary
    })
  )

  return summaries.filter((s) => s !== null)
}

export default async function RenewalPlanningCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const params = await searchParams
  const selectedYear = params.year ? parseInt(params.year) : new Date().getFullYear()
  const summaries = await getRosterPeriodSummariesForYear(selectedYear)

  return (
    <div className="space-y-6 p-8">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/dashboard/renewal-planning?year=${selectedYear}`}>
            <Button variant="outline" size="sm" className="mb-3">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Planning Dashboard
            </Button>
          </Link>
          <h1 className="text-foreground text-3xl font-bold">
            Renewal Planning Calendar ({selectedYear})
          </h1>
          <p className="text-muted-foreground mt-1">
            Visual overview of certification renewals (February - November {selectedYear})
          </p>
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2">
          <Link href={`/api/renewal-planning/export-pdf?year=${selectedYear}`} target="_blank">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </Link>
          <form action="/api/renewal-planning/email" method="POST">
            <input type="hidden" name="year" value={selectedYear} />
            <Button size="sm" type="submit">
              <Mail className="mr-2 h-4 w-4" />
              Email to Rostering Team
            </Button>
          </form>
        </div>
      </div>

      {/* Yearly Calendar */}
      <RenewalCalendarYearly summaries={summaries} year={selectedYear} />
    </div>
  )
}
