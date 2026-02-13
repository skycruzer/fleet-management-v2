'use client'

/**
 * Renewal Planning Dashboard Client Component
 * Handles year selection and displays renewal planning data
 * Supports Grid and Timeline (Gantt) view modes
 */

import { useState } from 'react'
import {
  Calendar,
  RefreshCw,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  BarChart3,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatDate } from '@/lib/utils/date-utils'
import { EmailRenewalPlanButton } from './email-renewal-plan-button'
import { ExportPDFButton } from './export-pdf-button'
import { GanttTimeline } from './gantt-timeline'

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

interface RenewalPlanningDashboardProps {
  summaries: RosterPeriodSummary[]
  renewalDetails?: RenewalDetail[]
  selectedYear: number
}

type ViewMode = 'grid' | 'timeline'

export function RenewalPlanningDashboard({
  summaries,
  renewalDetails = [],
  selectedYear,
}: RenewalPlanningDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Generate year options: Always show selectedYear and extend range dynamically
  const currentYear = new Date().getFullYear()

  // Determine the range based on selected year
  const minYear = Math.min(currentYear - 1, selectedYear - 2) // Always include 2 years before selected
  const maxYear = Math.max(currentYear + 5, selectedYear + 3) // Always include 3 years after selected

  // Generate dynamic year range
  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', year)
    router.push(`?${params.toString()}`)
  }

  const highRiskPeriods = summaries.filter((s) => s.utilizationPercentage > 80)
  const totalCapacity = summaries.reduce((sum, s) => sum + s.totalCapacity, 0)
  const totalPlanned = summaries.reduce((sum, s) => sum + s.totalPlannedRenewals, 0)
  const overallUtilization = totalCapacity > 0 ? (totalPlanned / totalCapacity) * 100 : 0

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold">Certification Renewal Planning</h1>
          <p className="text-muted-foreground mt-1">
            Manage and distribute pilot certification renewals across all 13 roster periods
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <div
            role="tablist"
            aria-label="Dashboard view mode"
            className="border-input bg-background flex items-center rounded-lg border p-0.5"
          >
            <Button
              role="tab"
              aria-selected={viewMode === 'grid'}
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8"
            >
              <LayoutGrid className="mr-1.5 h-4 w-4" />
              Grid
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

          {/* Year Selector */}
          <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Link href={`/dashboard/renewal-planning/calendar?year=${selectedYear}`}>
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar View
            </Button>
          </Link>
          <Link href={`/api/renewal-planning/export?year=${selectedYear}`} target="_blank">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </Link>
          <ExportPDFButton year={selectedYear} hasData={totalPlanned > 0} />
          <EmailRenewalPlanButton year={selectedYear} hasData={totalPlanned > 0} />
          <Link href={`/dashboard/renewal-planning/generate?year=${selectedYear}`}>
            <Button size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Planning Year</p>
              <p className="text-foreground text-2xl font-bold">{selectedYear}</p>
            </div>
            <Calendar className="text-primary h-8 w-8" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Planned</p>
              <p className="text-foreground text-2xl font-bold">{totalPlanned}</p>
            </div>
            <Calendar className="text-primary h-8 w-8" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Overall Utilization</p>
              <p className="text-foreground text-2xl font-bold">
                {Math.round(overallUtilization)}%
              </p>
            </div>
            <Badge
              className={
                overallUtilization > 80
                  ? 'bg-[var(--color-status-high)] text-white'
                  : overallUtilization > 60
                    ? 'bg-[var(--color-status-medium)] text-white'
                    : 'bg-[var(--color-status-low)] text-white'
              }
            >
              {overallUtilization > 80 ? 'High' : overallUtilization > 60 ? 'Medium' : 'Good'}
            </Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">High Risk Periods</p>
              <p className="text-foreground text-2xl font-bold">{highRiskPeriods.length}</p>
            </div>
            {highRiskPeriods.length > 0 && (
              <AlertTriangle className="h-8 w-8 text-[var(--color-status-high)]" />
            )}
          </div>
        </Card>
      </div>

      {/* High Risk Alert */}
      {highRiskPeriods.length > 0 && (
        <Card className="border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="mt-1 h-6 w-6 text-[var(--color-status-high)]" />
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--color-status-high-foreground)]">
                High Capacity Utilization
              </h3>
              <p className="mt-1 text-sm text-[var(--color-status-high)]">
                {highRiskPeriods.length} roster period{highRiskPeriods.length > 1 ? 's' : ''} have
                utilization above 80%:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {highRiskPeriods.map((period) => (
                  <Link
                    key={period.rosterPeriod}
                    href={`/dashboard/renewal-planning/roster-period/${period.rosterPeriod}`}
                  >
                    <Badge className="bg-[var(--color-status-high)] text-white hover:opacity-90">
                      {period.rosterPeriod} - {Math.round(period.utilizationPercentage)}%
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Roster Period Content — Grid or Timeline */}
      {viewMode === 'timeline' ? (
        <GanttTimeline
          renewals={renewalDetails ?? []}
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
          year={selectedYear}
        />
      ) : (
        <Card className="p-6">
          <h2 className="text-foreground mb-6 text-xl font-semibold">
            Roster Period Distribution ({selectedYear})
          </h2>

          {summaries.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="text-foreground mb-2 text-lg font-semibold">
                No Roster Periods Found
              </h3>
              <p className="text-muted-foreground">
                No roster periods available for {selectedYear}.
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                Try selecting a different year or generate a plan first.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {summaries.map((summary) => {
                const utilizationColor =
                  summary.utilizationPercentage > 80
                    ? 'bg-[var(--color-status-high-bg)] border-[var(--color-status-high-border)]'
                    : summary.utilizationPercentage > 60
                      ? 'bg-[var(--color-status-medium-bg)] border-[var(--color-status-medium-border)]'
                      : 'bg-[var(--color-status-low-bg)] border-[var(--color-status-low-border)]'

                const badgeColor =
                  summary.utilizationPercentage > 80
                    ? 'bg-[var(--color-status-high)] text-white'
                    : summary.utilizationPercentage > 60
                      ? 'bg-[var(--color-status-medium)] text-white'
                      : 'bg-[var(--color-status-low)] text-white'

                return (
                  <Link
                    key={summary.rosterPeriod}
                    href={`/dashboard/renewal-planning/roster-period/${summary.rosterPeriod}`}
                  >
                    <Card
                      className={`border-2 p-4 transition-all hover:shadow-md ${utilizationColor}`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-foreground font-semibold">{summary.rosterPeriod}</h3>
                        <Badge className={badgeColor}>
                          {Math.round(summary.utilizationPercentage)}%
                        </Badge>
                      </div>

                      <p className="text-muted-foreground mb-3 text-xs">
                        {formatDate(summary.periodStartDate)} -{' '}
                        {formatDate(summary.periodEndDate)}
                      </p>

                      <div className="space-y-2">
                        {Object.entries(summary.categoryBreakdown)
                          .slice(0, 4)
                          .map(([category, data]) => (
                            <div
                              key={category}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-muted-foreground truncate">{category}</span>
                              <span className="text-foreground font-medium">
                                {data.plannedCount}/{data.capacity}
                              </span>
                            </div>
                          ))}
                      </div>

                      <div className="border-border mt-3 border-t pt-3">
                        <p className="text-foreground text-sm font-semibold">
                          Total: {summary.totalPlannedRenewals} / {summary.totalCapacity}
                        </p>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {/* Year Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleYearChange((selectedYear - 1).toString())}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-5 w-5" />
          Previous Year ({selectedYear - 1})
        </Button>

        <div className="bg-primary text-primary-foreground flex items-center gap-2 rounded-lg px-6 py-3">
          <Calendar className="h-5 w-5" />
          <span className="text-lg font-semibold">{selectedYear}</span>
        </div>

        <Button
          variant="outline"
          size="lg"
          onClick={() => handleYearChange((selectedYear + 1).toString())}
          className="flex items-center gap-2"
        >
          Next Year ({selectedYear + 1})
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Help Text */}
      <Card className="border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-6">
        <h3 className="font-semibold text-[var(--color-info-foreground)]">
          How to Use Renewal Planning
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-info)]">
          <li>
            • <strong>Select a year</strong> to view renewal planning for that year (all 13 roster
            periods)
          </li>
          <li>
            • <strong>Click a roster period</strong> to see detailed renewal schedule
          </li>
          <li>
            • <strong>Green</strong> = Good utilization (&lt;60%), <strong>Yellow</strong> = Medium
            (60-80%), <strong>Red</strong> = High (&gt;80%)
          </li>
          <li>
            • <strong>Generate Plan</strong> to create or update renewal schedule for all pilots
          </li>
          <li>
            • <strong>Use Previous/Next Year buttons</strong> to navigate through years - the year
            range will automatically extend as you navigate
          </li>
          <li>• Capacity limits: Flight (4), Simulator (6), Ground (8) per period</li>
        </ul>
      </Card>
    </div>
  )
}
