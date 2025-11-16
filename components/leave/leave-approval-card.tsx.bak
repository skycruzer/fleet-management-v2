/**
 * Leave Approval Card Component
 * Individual card for approving/denying leave requests with eligibility alerts
 *
 * Author: Maurice Rondeau
 * Date: November 12, 2025
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  User,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface LeaveRequest {
  id: string
  pilot_id: string
  employee_number: string
  rank: string
  name: string
  request_type: string
  start_date: string
  end_date: string | null
  reason: string | null
  notes: string | null
  roster_period_code: string | null
  is_late_request: boolean
  is_past_deadline: boolean
  conflict_flags?: string[]
  availability_impact?: {
    captains_before?: number
    captains_after?: number
    fos_before?: number
    fos_after?: number
  } | null
  created_at: string
  pilots?: {
    seniority_number: number
  }
}

interface LeaveApprovalCardProps {
  request: LeaveRequest
  onApprove: (id: string) => Promise<void>
  onDeny: (id: string) => Promise<void>
}

export function LeaveApprovalCard({ request, onApprove, onDeny }: LeaveApprovalCardProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isDenying, setIsDenying] = useState(false)

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      await onApprove(request.id)
      toast.success('Request Approved', {
        description: `Approved ${request.request_type} for ${request.name}`,
      })
    } catch (error) {
      toast.error('Failed to approve request', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleDeny = async () => {
    setIsDenying(true)
    try {
      await onDeny(request.id)
      toast.success('Request Denied', {
        description: `Denied ${request.request_type} for ${request.name}`,
      })
    } catch (error) {
      toast.error('Failed to deny request', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsDenying(false)
    }
  }

  // Determine alert level based on conflicts and availability
  const getAlertLevel = (): 'critical' | 'warning' | 'info' | null => {
    if (request.conflict_flags && request.conflict_flags.length > 0) {
      return 'critical'
    }

    if (request.availability_impact) {
      const { captains_after, fos_after } = request.availability_impact
      const rankImpact = request.rank === 'Captain' ? captains_after : fos_after

      if (rankImpact !== undefined && rankImpact < 10) {
        return 'critical'
      }
      if (rankImpact !== undefined && rankImpact === 10) {
        return 'warning'
      }
    }

    if (request.is_past_deadline) {
      return 'warning'
    }

    return null
  }

  const alertLevel = getAlertLevel()

  // Format dates
  const startDate = new Date(request.start_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const endDate = request.end_date
    ? new Date(request.end_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : startDate

  return (
    <Card
      className={cn(
        'p-6 transition-all hover:shadow-md',
        alertLevel === 'critical' && 'border-red-300 bg-red-50',
        alertLevel === 'warning' && 'border-yellow-300 bg-yellow-50',
        alertLevel === 'info' && 'border-blue-300 bg-blue-50'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{request.name}</h3>
            <Badge variant="outline" className="text-xs">
              {request.rank}
            </Badge>
            {request.pilots?.seniority_number && (
              <Badge variant="outline" className="text-xs">
                Seniority #{request.pilots.seniority_number}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Employee #{request.employee_number}
          </p>
        </div>

        {/* Request Type Badge */}
        <Badge className="bg-primary-600 text-white">
          {request.request_type}
        </Badge>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {startDate} - {endDate}
          </span>
        </div>
        {request.roster_period_code && (
          <Badge variant="outline" className="text-xs">
            {request.roster_period_code}
          </Badge>
        )}
      </div>

      {/* Reason */}
      {request.reason && (
        <div className="mb-4">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Reason:</p>
              <p className="text-sm text-muted-foreground">{request.reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {request.notes && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground">{request.notes}</p>
        </div>
      )}

      {/* Alerts and Warnings */}
      {alertLevel && (
        <div
          className={cn(
            'mb-4 p-3 rounded-lg border',
            alertLevel === 'critical' && 'bg-red-100 border-red-300',
            alertLevel === 'warning' && 'bg-yellow-100 border-yellow-300',
            alertLevel === 'info' && 'bg-blue-100 border-blue-300'
          )}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle
              className={cn(
                'h-5 w-5 mt-0.5',
                alertLevel === 'critical' && 'text-red-600',
                alertLevel === 'warning' && 'text-yellow-600',
                alertLevel === 'info' && 'text-blue-600'
              )}
            />
            <div className="flex-1">
              <p
                className={cn(
                  'text-sm font-semibold mb-1',
                  alertLevel === 'critical' && 'text-red-900',
                  alertLevel === 'warning' && 'text-yellow-900',
                  alertLevel === 'info' && 'text-blue-900'
                )}
              >
                {alertLevel === 'critical' && 'Critical Alert'}
                {alertLevel === 'warning' && 'Warning'}
                {alertLevel === 'info' && 'Information'}
              </p>

              {/* Conflict Flags */}
              {request.conflict_flags && request.conflict_flags.length > 0 && (
                <p className="text-sm text-red-800 mb-2">
                  Conflicts detected: {request.conflict_flags.join(', ')}
                </p>
              )}

              {/* Availability Impact */}
              {request.availability_impact && (
                <div className="text-sm">
                  {request.rank === 'Captain' && (
                    <p
                      className={cn(
                        request.availability_impact.captains_after !== undefined &&
                          request.availability_impact.captains_after < 10
                          ? 'text-red-800'
                          : 'text-yellow-800'
                      )}
                    >
                      Captains: {request.availability_impact.captains_before || 0} →{' '}
                      {request.availability_impact.captains_after || 0}
                      {request.availability_impact.captains_after !== undefined &&
                        request.availability_impact.captains_after < 10 && (
                          <span className="font-semibold"> (Below minimum of 10)</span>
                        )}
                    </p>
                  )}
                  {request.rank === 'First Officer' && (
                    <p
                      className={cn(
                        request.availability_impact.fos_after !== undefined &&
                          request.availability_impact.fos_after < 10
                          ? 'text-red-800'
                          : 'text-yellow-800'
                      )}
                    >
                      First Officers: {request.availability_impact.fos_before || 0} →{' '}
                      {request.availability_impact.fos_after || 0}
                      {request.availability_impact.fos_after !== undefined &&
                        request.availability_impact.fos_after < 10 && (
                          <span className="font-semibold"> (Below minimum of 10)</span>
                        )}
                    </p>
                  )}
                </div>
              )}

              {/* Late/Past Deadline */}
              {request.is_past_deadline && (
                <p className="text-sm text-yellow-800">
                  Submitted past roster deadline
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Flags */}
      <div className="flex gap-2 mb-4">
        {request.is_late_request && (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Late Request
          </Badge>
        )}
        {request.is_past_deadline && (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Past Deadline
          </Badge>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleApprove}
          disabled={isApproving || isDenying}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {isApproving ? 'Approving...' : 'Approve'}
        </Button>
        <Button
          onClick={handleDeny}
          disabled={isApproving || isDenying}
          variant="destructive"
          className="flex-1"
        >
          <XCircle className="h-4 w-4 mr-2" />
          {isDenying ? 'Denying...' : 'Deny'}
        </Button>
      </div>

      {/* Submission Info */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Submitted{' '}
          {new Date(request.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>
    </Card>
  )
}
