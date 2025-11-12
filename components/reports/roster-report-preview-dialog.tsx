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

interface RosterReportPreviewDialogProps {
  report: RosterPeriodReport
  isOpen: boolean
  onClose: () => void
}

export function RosterReportPreviewDialog({ report, isOpen, onClose }: RosterReportPreviewDialogProps) {
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
            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
              <div>
                <p className="text-sm text-muted-foreground">Report Type</p>
                <p className="font-medium">{report.metadata.reportType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Generated</p>
                <p className="font-medium">
                  {new Date(report.metadata.generatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Statistics Summary */}
            <div>
              <h3 className="mb-3 font-semibold">Request Summary</h3>
              <div className="grid grid-cols-3 gap-4 md:grid-cols-5">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{report.statistics.totalRequests}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {report.statistics.approvedCount}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Denied</p>
                  <p className="text-2xl font-bold text-red-600">
                    {report.statistics.deniedCount}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {report.statistics.pendingCount}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Withdrawn</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {report.statistics.withdrawnCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Crew Availability */}
            <div>
              <h3 className="mb-3 font-semibold">Crew Availability Analysis</h3>

              {hasCrewWarning && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">Minimum Crew Warning</p>
                    <p className="mt-1 text-sm text-red-700">
                      Crew availability falls below the minimum requirement of 10 during this
                      roster period.
                    </p>
                    {report.crewAvailability.minimumCrewDate && (
                      <p className="mt-2 text-sm text-red-700">
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
                    <Users className="h-5 w-5 text-blue-600" />
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
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {report.crewAvailability.captains.available}
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full ${
                          report.crewAvailability.captains.belowMinimum
                            ? 'bg-red-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${report.crewAvailability.captains.percentageAvailable}%`,
                        }}
                      />
                    </div>
                    <p className="text-center text-xs text-muted-foreground">
                      {report.crewAvailability.captains.percentageAvailable.toFixed(1)}% Available
                    </p>
                  </div>
                </div>

                {/* First Officers */}
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
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
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {report.crewAvailability.firstOfficers.available}
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full ${
                          report.crewAvailability.firstOfficers.belowMinimum
                            ? 'bg-red-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${report.crewAvailability.firstOfficers.percentageAvailable}%`,
                        }}
                      />
                    </div>
                    <p className="text-center text-xs text-muted-foreground">
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
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Leave Requests</p>
                    <p className="text-xl font-bold">
                      {report.approvedRequests.leaveRequests.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <CheckCircle2 className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Flight Requests</p>
                    <p className="text-xl font-bold">
                      {report.approvedRequests.flightRequests.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <CheckCircle2 className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Leave Bids</p>
                    <p className="text-xl font-bold">
                      {report.approvedRequests.leaveBids.length}
                    </p>
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
