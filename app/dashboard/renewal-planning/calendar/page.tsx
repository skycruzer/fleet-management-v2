/**
 * Calendar View Page for Renewal Planning
 * Displays yearly overview of all roster periods
 *
 * FIXES APPLIED:
 * - Added data existence check before showing export/email buttons
 * - Separated client component for email functionality
 * - Added loading states via client components
 * - Enhanced user feedback with empty states
 */

import { getRosterPeriodCapacity } from '@/lib/services/certification-renewal-planning-service'
import { createClient } from '@/lib/supabase/server'
import { RenewalCalendarYearly } from '@/components/renewal-planning/renewal-calendar-yearly'
import { EmailRenewalPlanButton } from '@/components/renewal-planning/email-renewal-plan-button'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, Download, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getRosterPeriodSummariesForYear(year: number) {
  const supabase = await createClient()

  // Get roster periods that cover the selected year (February - November only)
  // This excludes December and January from renewal scheduling
  const { data: periods, error } = await supabase
    .from('roster_period_capacity')
    .select('roster_period, period_start_date, period_end_date')
    .gte('period_start_date', `${year}-02-01`) // Start from February
    .lte('period_start_date', `${year}-11-30`) // End in November
    .order('period_start_date')

  if (error) {
    console.error('Error fetching roster periods:', error)
    return []
  }

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

// Removed unused hasRenewalData function - we check totalPlannedRenewals directly instead

export default async function RenewalPlanningCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const params = await searchParams
  const selectedYear = params.year ? parseInt(params.year) : new Date().getFullYear()

  // Fetch data
  const summaries = await getRosterPeriodSummariesForYear(selectedYear)

  // Calculate if we have any planned renewals
  const totalPlannedRenewals = summaries.reduce((sum, s) => sum + s.totalPlannedRenewals, 0)
  const hasRenewals = totalPlannedRenewals > 0

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
          {/* PDF Export Button */}
          <Link
            href={
              hasRenewals
                ? `/api/renewal-planning/export-pdf?year=${selectedYear}`
                : '#'
            }
            target={hasRenewals ? '_blank' : undefined}
            className={!hasRenewals ? 'pointer-events-none' : ''}
          >
            <Button variant="outline" size="sm" disabled={!hasRenewals}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </Link>

          {/* Email Button (Client Component) */}
          <EmailRenewalPlanButton year={selectedYear} hasData={hasRenewals} />
        </div>
      </div>

      {/* Empty State Alert */}
      {!hasRenewals && summaries.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Renewal Plans Found</AlertTitle>
          <AlertDescription>
            Roster periods exist for {selectedYear}, but no renewal plans have been generated yet.
            Please generate a renewal plan first before exporting or emailing.
          </AlertDescription>
        </Alert>
      )}

      {/* No Roster Periods Alert */}
      {summaries.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Roster Periods Available</AlertTitle>
          <AlertDescription>
            No roster periods found for {selectedYear}. Roster periods must be created before
            renewal planning can begin.
          </AlertDescription>
        </Alert>
      )}

      {/* Yearly Calendar */}
      <RenewalCalendarYearly summaries={summaries} year={selectedYear} />

      {/* Info Box */}
      {hasRenewals && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Export & Email Options</AlertTitle>
          <AlertDescription className="text-blue-700">
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <strong>Export PDF</strong>: Generate a comprehensive PDF report with all renewal
                details
              </li>
              <li>
                <strong>Email to Rostering Team</strong>: Send a professional summary email with
                renewal statistics
              </li>
              <li>Both options include all {totalPlannedRenewals} planned renewals for {selectedYear}</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
