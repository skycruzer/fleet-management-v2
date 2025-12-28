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
      const periodCodes = affectedPeriods.map(p => p.code).join(' → ')
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
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1">
          <span className="text-2xl">{getTypeIcon(type)}</span>
          <h3 className="text-lg font-semibold text-foreground">{type}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {stats.total} Total
            </Badge>
            <Badge variant="outline" className="text-xs border-blue-500 bg-blue-50 text-blue-800">
              {stats.pending} Pending
            </Badge>
            <Badge variant="outline" className="text-xs border-green-500 bg-green-50 text-green-800">
              {stats.approved} Approved
            </Badge>
            {stats.denied > 0 && (
              <Badge variant="outline" className="text-xs border-red-500 bg-red-50 text-red-800">
                {stats.denied} Denied
              </Badge>
            )}
            <Badge variant="outline" className="text-xs border-purple-500 bg-primary/5 text-primary-foreground">
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
                <div className="bg-muted/30 px-4 py-2 flex items-center gap-2">
                  <span className="text-xl">{getRoleIcon(role)}</span>
                  <h4 className="text-sm font-semibold text-foreground">{role}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {roleGroups[role].length}
                  </Badge>
                </div>

                {/* Requests Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/20">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Pilot
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Employee ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Start Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          End Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Days
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Roster Period
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        {onReview && (
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      {roleGroups[role].map((req) => {
                        const multiPeriodInfo = getMultiPeriodInfo(req)
                        return (
                          <tr key={req.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-4 text-sm font-medium text-foreground whitespace-nowrap">
                              {req.pilot_name || 'N/A'}
                            </td>
                            <td className="px-4 py-4 text-sm text-foreground whitespace-nowrap">
                              {req.employee_id || 'N/A'}
                            </td>
                            <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                              {format(new Date(req.start_date), 'MMM dd, yyyy')}
                            </td>
                            <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                              {format(new Date(req.end_date), 'MMM dd, yyyy')}
                            </td>
                            <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                              {req.days_count}
                            </td>
                            <td className="px-4 py-4 text-sm whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">{multiPeriodInfo.periodCodes}</span>
                                {multiPeriodInfo.isMultiPeriod && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-orange-500 bg-orange-50 text-orange-800 w-fit"
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
                            <td className="px-4 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* View Details Button - Always visible */}
                                <Link href={`/dashboard/leave/${req.id}`}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
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
                                  <div className="text-xs text-muted-foreground">
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
                      )})}
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
