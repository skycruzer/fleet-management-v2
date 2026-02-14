/**
 * Calendar Page Client Component
 *
 * Client-side wrapper for the renewal planning calendar page.
 * Handles state for preview modal, filters, and export actions.
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RenewalCalendarYearly } from './renewal-calendar-yearly'
import { GanttTimeline } from './gantt-timeline'
import { RenewalPlanPreviewModal } from './renewal-plan-preview-modal'
import {
  CalendarFilterPanel,
  CalendarFilters,
  DEFAULT_CALENDAR_FILTERS,
} from './calendar-filter-panel'
import { EmailRenewalPlanButton } from './email-renewal-plan-button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  ArrowLeft,
  Download,
  Eye,
  AlertCircle,
  Filter,
  LayoutGrid,
  Grid3x3,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { PairedCrew, UnpairedPilot, PairingStatistics } from '@/lib/types/pairing'

interface RosterPeriodSummary {
  rosterPeriod: string
  periodStartDate: Date
  periodEndDate: Date
  totalPlannedRenewals: number
  totalCapacity: number
  utilizationPercentage: number
  categoryBreakdown: Record<
    string,
    {
      plannedCount: number
      capacity: number
      pilots: Array<{ id: string; name: string; checkType: string }>
    }
  >
}

interface RenewalDetail {
  id: string
  pilot_name: string
  employee_id: string
  check_code: string
  category: string
  planned_renewal_date: string
  original_expiry_date: string
  renewal_window_start: string
  renewal_window_end: string
  roster_period: string
  pairing_status?: string
  paired_pilot_name?: string
}

type ViewMode = 'calendar' | 'timeline'

interface CalendarPageClientProps {
  year: number
  summaries: RosterPeriodSummary[]
  hasRenewals: boolean
  totalPlannedRenewals: number
  pairingData?: {
    pairs: PairedCrew[]
    unpaired: UnpairedPilot[]
    statistics: PairingStatistics
  }
  renewalDetails?: RenewalDetail[]
}

export function CalendarPageClient({
  year,
  summaries,
  hasRenewals,
  totalPlannedRenewals,
  pairingData,
  renewalDetails = [],
}: CalendarPageClientProps) {
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_CALENDAR_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [isCompactView, setIsCompactView] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')

  // Calculate category statistics for filter panel
  const categoryStats = summaries.reduce(
    (acc, summary) => {
      Object.entries(summary.categoryBreakdown).forEach(([category, data]) => {
        acc[category] = (acc[category] || 0) + data.plannedCount
      })
      return acc
    },
    {} as Record<string, number>
  )

  // Build export URL with checkCodes filter if active
  const buildExportUrl = (baseUrl: string) => {
    const params = new URLSearchParams({ year: year.toString() })
    if (filters.checkCodes.length > 0) {
      params.set('checkCodes', filters.checkCodes.join(','))
    }
    return `${baseUrl}?${params.toString()}`
  }

  const handleExportPDF = () => {
    // Open PDF in new tab with filters
    window.open(buildExportUrl('/api/renewal-planning/export-pdf'), '_blank')
    toast.success('PDF Export Started', {
      description: 'Your PDF will download shortly.',
    })
    setShowPreviewModal(false)
  }

  const handleExportCSV = () => {
    // Trigger CSV download with filters
    window.open(buildExportUrl('/api/renewal-planning/export-csv'), '_blank')
    toast.success('CSV Export Started', {
      description: 'Your CSV will download shortly.',
    })
    setShowPreviewModal(false)
  }

  const handleSendEmail = async () => {
    try {
      const formData = new FormData()
      formData.append('year', year.toString())

      const response = await fetch('/api/renewal-planning/email', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('No Renewal Plans Generated', {
            description:
              data.details || `No renewal plans found for ${year}. Please generate plans first.`,
          })
        } else {
          toast.error('Email Failed', {
            description: data.details || 'Failed to send email',
          })
        }
        throw new Error(data.error)
      }

      toast.success('Email Sent Successfully', {
        description: `Renewal plan for ${year} has been sent to the rostering team`,
      })
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header with Actions */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/dashboard/renewal-planning?year=${year}`}>
            <Button variant="outline" size="sm" className="mb-3">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Planning Dashboard
            </Button>
          </Link>
          <h1 className="text-foreground text-3xl font-bold">Renewal Planning Calendar ({year})</h1>
          <p className="text-muted-foreground mt-1">
            Visual overview of certification renewals across all 13 roster periods ({year})
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* View Toggle: Calendar / Timeline */}
          <div
            role="tablist"
            aria-label="Calendar view mode"
            className="border-input bg-background flex items-center rounded-lg border p-0.5"
          >
            <Button
              role="tab"
              aria-selected={viewMode === 'calendar'}
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="h-8"
            >
              <LayoutGrid className="mr-1.5 h-4 w-4" />
              Calendar
            </Button>
            <Button
              role="tab"
              aria-selected={viewMode === 'timeline'}
              variant={viewMode === 'timeline' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('timeline')}
              className="h-8"
            >
              <BarChart3 className="mr-1.5 h-4 w-4" />
              Timeline
            </Button>
          </div>

          {/* Compact Toggle (Calendar view only) */}
          {viewMode === 'calendar' && (
            <div className="flex overflow-hidden rounded-lg border">
              <Button
                variant={isCompactView ? 'ghost' : 'secondary'}
                size="sm"
                onClick={() => setIsCompactView(false)}
                className="rounded-none border-r"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={isCompactView ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setIsCompactView(true)}
                className="rounded-none"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Filter Button (Mobile) */}
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <CalendarFilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                categoryStats={categoryStats}
              />
            </SheetContent>
          </Sheet>

          {/* Preview Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreviewModal(true)}
            disabled={!hasRenewals}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>

          {/* PDF Export Button */}
          <Link
            href={hasRenewals ? buildExportUrl('/api/renewal-planning/export-pdf') : '#'}
            target={hasRenewals ? '_blank' : undefined}
            className={!hasRenewals ? 'pointer-events-none' : ''}
          >
            <Button variant="outline" size="sm" disabled={!hasRenewals}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </Link>

          {/* Email Button */}
          <EmailRenewalPlanButton year={year} hasData={hasRenewals} />
        </div>
      </div>

      {/* Empty State Alert */}
      {!hasRenewals && summaries.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Renewal Plans Found</AlertTitle>
          <AlertDescription>
            Roster periods exist for {year}, but no renewal plans have been generated yet. Please
            generate a renewal plan first before exporting or emailing.
          </AlertDescription>
        </Alert>
      )}

      {/* No Roster Periods Alert */}
      {summaries.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Roster Periods Available</AlertTitle>
          <AlertDescription>
            No roster periods found for {year}. Roster periods must be created before renewal
            planning can begin.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Area */}
      {viewMode === 'timeline' ? (
        <GanttTimeline
          renewals={renewalDetails}
          rosterPeriods={summaries.map((s) => ({
            code: s.rosterPeriod,
            startDate:
              s.periodStartDate instanceof Date
                ? s.periodStartDate.toISOString().split('T')[0]
                : String(s.periodStartDate).split('T')[0],
            endDate:
              s.periodEndDate instanceof Date
                ? s.periodEndDate.toISOString().split('T')[0]
                : String(s.periodEndDate).split('T')[0],
          }))}
          year={year}
        />
      ) : (
        <div className="flex gap-6">
          {/* Filter Panel (Desktop) */}
          <div className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-4">
              <CalendarFilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                categoryStats={categoryStats}
              />
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="min-w-0 flex-1">
            <RenewalCalendarYearly
              summaries={summaries}
              year={year}
              filters={filters}
              compact={isCompactView}
            />
          </div>
        </div>
      )}

      {/* Info Box */}
      {hasRenewals && (
        <Alert className="border-[var(--color-info-border)] bg-[var(--color-info-bg)]">
          <AlertCircle className="h-4 w-4 text-[var(--color-info)]" />
          <AlertTitle className="text-[var(--color-info-foreground)]">
            Export & Email Options
          </AlertTitle>
          <AlertDescription className="text-[var(--color-info)]">
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <strong>Preview</strong>: View a comprehensive summary before exporting or emailing
              </li>
              <li>
                <strong>Export PDF</strong>: Generate a detailed PDF report with all renewal
                information
              </li>
              <li>
                <strong>Email to Rostering Team</strong>: Send a professional summary email with
                statistics
              </li>
              <li>
                Includes all <strong>{totalPlannedRenewals} planned renewals</strong> for {year}
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Modal */}
      <RenewalPlanPreviewModal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        year={year}
        summaries={summaries}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
        onSendEmail={handleSendEmail}
        pairingData={pairingData}
      />
    </div>
  )
}
