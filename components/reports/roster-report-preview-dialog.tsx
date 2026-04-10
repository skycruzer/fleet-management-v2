/**
 * Roster Report Preview Dialog Component
 *
 * Displays a preview of the roster period report data
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, Users } from 'lucide-react'
import type { RosterPeriodReport } from '@/lib/services/roster-report-service'
import { formatAustralianDateTime } from '@/lib/utils/date-format'

interface RosterReportPreviewDialogProps {
  report: RosterPeriodReport
  isOpen: boolean
  onClose: () => void
}

export function RosterReportPreviewDialog({
  report,
  isOpen,
  onClose,
}: RosterReportPreviewDialogProps) {
  const hasCrewWarning =
    report.crewAvailability.captains.belowMinimum ||
    report.crewAvailability.firstOfficers.belowMinimum

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Roster Period Report - {report.rosterPeriod.code}</DialogTitle>
          <DialogDescription>
            {report.rosterPeriod.startDate} to {report.rosterPeriod.endDate}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[600px] pr-4">
          <div className="space-y-6">
            {/* Report Metadata */}
            <div className="bg-muted flex items-center justify-between rounded-lg p-4">
              <div>
                <p className="text-muted-foreground text-sm">Report Type</p>
                <p className="font-medium">{report.metadata.reportType}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Generated</p>
                <p className="font-medium">
                  {formatAustralianDateTime(report.metadata.generatedAt)}
                </p>
              </div>
            </div>

            {/* Statistics Summary */}
            <div>
              <h3 className="mb-3 font-semibold">Request Summary</h3>
              <div className="grid grid-cols-3 gap-4 md:grid-cols-5">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="text-2xl font-bold">{report.statistics.totalRequests}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">Approved</p>
                  <p className="text-2xl font-bold text-[var(--color-status-low)]">
                    {report.statistics.approvedCount}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">Denied</p>
                  <p className="text-2xl font-bold text-[var(--color-status-high)]">
                    {report.statistics.deniedCount}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">Pending</p>
                  <p className="text-2xl font-bold text-[var(--color-status-medium)]">
                    {report.statistics.pendingCount}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">Withdrawn</p>
                  <p className="text-muted-foreground text-2xl font-bold">
                    {report.statistics.withdrawnCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Crew Availability */}
            <div>
              <h3 className="mb-3 font-semibold">Crew Availability Analysis</h3>

              {hasCrewWarning && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] p-4">
                  <AlertTriangle className="h-5 w-5 text-[var(--color-status-high)]" />
                  <div className="flex-1">
                    <p className="text-foreground font-medium">Minimum Crew Warning</p>
                    <p className="mt-1 text-sm text-[var(--color-status-high)]">
                      Crew availability falls below the minimum requirement of 10 during this roster
                      period.
                    </p>
                    {report.crewAvailability.minimumCrewDate && (
                      <p className="mt-2 text-sm text-[var(--color-status-high)]">
                        Minimum occurs on:{' '}
                        <strong>{report.crewAvailability.minimumCrewDate}</strong>
                        <br />
                        Captains: {report.crewAvailability.minimumCrewCaptains} | First Officers:{' '}
                        {report.crewAvailability.minimumCrewFirstOfficers}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {/* Captains */}
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-[var(--color-info)]" />
                    <h4 className="font-medium">Captains</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Crew</span>
                      <span className="font-medium">
                        {report.crewAvailability.captains.totalCrew}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">On Leave</span>
                      <span className="font-medium">
                        {report.crewAvailability.captains.onLeave}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Available</span>
                      <span
                        className={`font-medium ${
                          report.crewAvailability.captains.belowMinimum
                            ? 'text-[var(--color-status-high)]'
                            : 'text-[var(--color-status-low)]'
                        }`}
                      >
                        {report.crewAvailability.captains.available}
                      </span>
                    </div>
                    <div className="bg-muted mt-3 h-2 w-full rounded-full">
                      <div
                        className={`h-2 rounded-full ${
                          report.crewAvailability.captains.belowMinimum
                            ? 'bg-[var(--color-status-high)]'
                            : 'bg-[var(--color-status-low)]'
                        }`}
                        style={{
                          width: `${report.crewAvailability.captains.percentageAvailable}%`,
                        }}
                      />
                    </div>
                    <p className="text-muted-foreground text-center text-xs">
                      {report.crewAvailability.captains.percentageAvailable.toFixed(1)}% Available
                    </p>
                  </div>
                </div>

                {/* First Officers */}
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-[var(--color-category-simulator)]" />
                    <h4 className="font-medium">First Officers</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Crew</span>
                      <span className="font-medium">
                        {report.crewAvailability.firstOfficers.totalCrew}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">On Leave</span>
                      <span className="font-medium">
                        {report.crewAvailability.firstOfficers.onLeave}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Available</span>
                      <span
                        className={`font-medium ${
                          report.crewAvailability.firstOfficers.belowMinimum
                            ? 'text-[var(--color-status-high)]'
                            : 'text-[var(--color-status-low)]'
                        }`}
                      >
                        {report.crewAvailability.firstOfficers.available}
                      </span>
                    </div>
                    <div className="bg-muted mt-3 h-2 w-full rounded-full">
                      <div
                        className={`h-2 rounded-full ${
                          report.crewAvailability.firstOfficers.belowMinimum
                            ? 'bg-[var(--color-status-high)]'
                            : 'bg-[var(--color-status-low)]'
                        }`}
                        style={{
                          width: `${report.crewAvailability.firstOfficers.percentageAvailable}%`,
                        }}
                      />
                    </div>
                    <p className="text-muted-foreground text-center text-xs">
                      {report.crewAvailability.firstOfficers.percentageAvailable.toFixed(1)}%
                      Available
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Approved Requests Breakdown */}
            <div>
              <h3 className="mb-3 font-semibold">Approved Requests Breakdown</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <CheckCircle2 className="h-8 w-8 text-[var(--color-status-low)]" />
                  <div>
                    <p className="text-muted-foreground text-xs">Leave Requests</p>
                    <p className="text-xl font-bold">
                      {report.approvedRequests.leaveRequests.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <CheckCircle2 className="h-8 w-8 text-[var(--color-category-simulator)]" />
                  <div>
                    <p className="text-muted-foreground text-xs">Flight Requests</p>
                    <p className="text-xl font-bold">
                      {report.approvedRequests.flightRequests.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <CheckCircle2 className="h-8 w-8 text-[var(--color-info)]" />
                  <div>
                    <p className="text-muted-foreground text-xs">Leave Bids</p>
                    <p className="text-xl font-bold">{report.approvedRequests.leaveBids.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
