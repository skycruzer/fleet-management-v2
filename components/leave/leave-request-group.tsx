/**
 * Leave Request Group Component
 * Displays leave requests grouped by type and role with expandable sections sorted by start date
 *
 * @version 1.0.0
 * @since 2025-10-20
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { getAffectedRosterPeriods } from '@/lib/utils/roster-utils'
import type { LeaveRequest } from '@/lib/services/unified-request-service'

interface LeaveRequestGroupProps {
  type: string
  roleGroups: Record<string, LeaveRequest[]>
  defaultExpanded?: boolean
  onReview?: (request: LeaveRequest) => void
}

export function LeaveRequestGroup({
  type,
  roleGroups,
  defaultExpanded = true,
  onReview,
}: LeaveRequestGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Calculate type statistics
  const allRequests = Object.values(roleGroups).flat()
  const stats = {
    total: allRequests.length,
    pending: allRequests.filter((r) => r.workflow_status === 'SUBMITTED').length,
    approved: allRequests.filter((r) => r.workflow_status === 'APPROVED').length,
    denied: allRequests.filter((r) => r.workflow_status === 'DENIED').length,
    totalDays: allRequests.reduce((sum, r) => sum + (r.days_count ?? 0), 0),
  }

  // Get type icon
  const getTypeIcon = (type: string) => {
    if (type.includes('Annual')) return '🏖️'
    if (type.includes('Sick')) return '🤒'
    if (type.includes('Personal')) return '👤'
    if (type.includes('Emergency')) return '🚨'
    return '📋'
  }

  // Get role icon
  const getRoleIcon = (role: string) => {
    if (role === 'Captain') return '⭐'
    if (role === 'First Officer') return '👤'
    return '👨‍✈️'
  }

  // Check if leave spans multiple roster periods
  const getMultiPeriodInfo = (req: LeaveRequest) => {
    const startDate = new Date(req.start_date)
    // end_date can be null for single-day requests, default to start_date
    const endDate = req.end_date ? new Date(req.end_date) : startDate
    const affectedPeriods = getAffectedRosterPeriods(startDate, endDate)

    if (affectedPeriods.length > 1) {
      const periodCodes = affectedPeriods.map((p) => p.code).join(' → ')
      return {
        isMultiPeriod: true,
        count: affectedPeriods.length,
        periodCodes,
      }
    }

    return {
      isMultiPeriod: false,
      count: 1,
      periodCodes: affectedPeriods[0]?.code || req.roster_period,
    }
  }

  return (
    <Card className="overflow-hidden">
      {/* Type Header */}
      <div
        className="hover:bg-muted/50 flex cursor-pointer items-center justify-between p-4 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-1 items-center gap-4">
          <span className="text-2xl">{getTypeIcon(type)}</span>
          <h3 className="text-foreground text-lg font-semibold">{type}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {stats.total} Total
            </Badge>
            <Badge variant="outline" className="border-blue-500 bg-blue-50 text-xs text-blue-800">
              {stats.pending} Pending
            </Badge>
            <Badge
              variant="outline"
              className="border-green-500 bg-green-50 text-xs text-green-800"
            >
              {stats.approved} Approved
            </Badge>
            {stats.denied > 0 && (
              <Badge variant="outline" className="border-red-500 bg-red-50 text-xs text-red-800">
                {stats.denied} Denied
              </Badge>
            )}
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary-foreground border-purple-500 text-xs"
            >
              {stats.totalDays} Days
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Requests Table - Grouped by Role */}
      {isExpanded && (
        <div className="border-t">
          {Object.keys(roleGroups)
            .filter((role) => roleGroups[role].length > 0)
            .sort((a, b) => {
              // Sort: Captain first, then First Officer, then others
              if (a === 'Captain') return -1
              if (b === 'Captain') return 1
              if (a === 'First Officer') return -1
              if (b === 'First Officer') return 1
              return a.localeCompare(b)
            })
            .map((role) => (
              <div key={role} className="border-t first:border-t-0">
                {/* Role Header */}
                <div className="bg-muted/30 flex items-center gap-2 px-4 py-2">
                  <span className="text-xl">{getRoleIcon(role)}</span>
                  <h4 className="text-foreground text-sm font-semibold">{role}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {roleGroups[role].length}
                  </Badge>
                </div>

                {/* Requests Table */}
                <div className="overflow-x-auto">
                  <table className="divide-border min-w-full divide-y">
                    <thead className="bg-muted/20">
                      <tr>
                        <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Pilot
                        </th>
                        <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Employee ID
                        </th>
                        <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Start Date
                        </th>
                        <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          End Date
                        </th>
                        <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Days
                        </th>
                        <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Roster Period
                        </th>
                        <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Status
                        </th>
                        {onReview && (
                          <th className="text-muted-foreground px-4 py-3 text-right text-xs font-medium tracking-wider uppercase">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-border bg-background divide-y">
                      {roleGroups[role].map((req) => {
                        const multiPeriodInfo = getMultiPeriodInfo(req)
                        return (
                          <tr key={req.id} className="hover:bg-muted/50 transition-colors">
                            <td className="text-foreground px-4 py-4 text-sm font-medium whitespace-nowrap">
                              {req.name || 'N/A'}
                            </td>
                            <td className="text-foreground px-4 py-4 text-sm whitespace-nowrap">
                              {req.employee_number || 'N/A'}
                            </td>
                            <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                              {format(new Date(req.start_date), 'MMM dd, yyyy')}
                            </td>
                            <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                              {req.end_date
                                ? format(new Date(req.end_date), 'MMM dd, yyyy')
                                : format(new Date(req.start_date), 'MMM dd, yyyy')}
                            </td>
                            <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                              {req.days_count ?? 1}
                            </td>
                            <td className="px-4 py-4 text-sm whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">
                                  {multiPeriodInfo.periodCodes}
                                </span>
                                {multiPeriodInfo.isMultiPeriod && (
                                  <Badge
                                    variant="outline"
                                    className="w-fit border-orange-500 bg-orange-50 text-xs text-orange-800"
                                  >
                                    🔄 Spans {multiPeriodInfo.count} periods
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  req.workflow_status === 'SUBMITTED'
                                    ? 'bg-blue-100 text-blue-800'
                                    : req.workflow_status === 'APPROVED'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {req.workflow_status}
                              </span>
                            </td>
                            {onReview && (
                              <td className="px-4 py-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  {/* View Details Button - Always visible */}
                                  <Link href={`/dashboard/leave/${req.id}`}>
                                    <Button size="sm" variant="ghost" className="text-xs">
                                      <Eye className="mr-1 h-3 w-3" />
                                      View
                                    </Button>
                                  </Link>

                                  {/* Review Button - Only for pending requests */}
                                  {req.workflow_status === 'SUBMITTED' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => onReview(req)}
                                      className="text-xs"
                                    >
                                      Review
                                    </Button>
                                  )}

                                  {/* Reviewed Status - For non-pending requests */}
                                  {req.workflow_status !== 'SUBMITTED' && req.reviewed_by && (
                                    <div className="text-muted-foreground text-xs">
                                      Reviewed
                                      {req.reviewed_at && (
                                        <div className="text-xs">
                                          {format(new Date(req.reviewed_at), 'MMM dd, yyyy')}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>
      )}
    </Card>
  )
}
