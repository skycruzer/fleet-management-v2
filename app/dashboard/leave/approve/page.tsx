/**
 * Leave Request Approval Dashboard
 * Admin view for reviewing and approving/denying leave requests
 *
 * Author: Maurice Rondeau
 * Date: November 12, 2025
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LeaveApprovalCard } from '@/components/leave/leave-approval-card'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertTriangle, ListFilter } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Leave Request Approval | Fleet Management',
  description: 'Review and approve pilot leave requests',
}

export default async function LeaveApprovalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch ONLY pending leave requests with pilot details
  const { data: pendingRequests, error } = await supabase
    .from('pilot_requests')
    .select(
      `
      *,
      pilots (
        seniority_number
      )
    `
    )
    .eq('request_category', 'LEAVE')
    .in('workflow_status', ['SUBMITTED', 'IN_REVIEW'])
    .order('is_late_request', { ascending: false }) // Late requests first
    .order('is_past_deadline', { ascending: false }) // Past deadline second
    .order('created_at', { ascending: true }) // Oldest first

  if (error) {
    console.error('Error fetching pending requests:', error)
  }

  const requests = pendingRequests || []

  // Calculate statistics
  const criticalCount = requests.filter((r) => {
    // Check conflict flags
    if (r.conflict_flags && Array.isArray(r.conflict_flags) && r.conflict_flags.length > 0) {
      return true
    }

    // Check availability impact
    if (r.availability_impact && typeof r.availability_impact === 'object') {
      const impact = r.availability_impact as {
        captains_after?: number
        fos_after?: number
      }

      if (r.rank === 'Captain' && typeof impact.captains_after === 'number' && impact.captains_after < 10) {
        return true
      }

      if (r.rank === 'First Officer' && typeof impact.fos_after === 'number' && impact.fos_after < 10) {
        return true
      }
    }

    return false
  }).length

  const warningCount = requests.filter(
    (r) => r.is_past_deadline || r.is_late_request
  ).length

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Request Approval</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve pending pilot leave requests
          </p>
        </div>
        <Link href="/dashboard/requests?tab=leave">
          <Button variant="outline">
            <ListFilter className="h-4 w-4 mr-2" />
            View All Requests
          </Button>
        </Link>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold">{requests.length}</p>
            </div>
            <div className="text-blue-500">
              <svg
                className="h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="border-red-300 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-900">Critical</p>
              <p className="text-3xl font-bold text-red-700">{criticalCount}</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <p className="text-xs text-red-700 mt-2">
            Conflicts or below minimum crew
          </p>
        </Card>

        <Card className="border-yellow-300 bg-yellow-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-900">Warnings</p>
              <p className="text-3xl font-bold text-yellow-700">{warningCount}</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          </div>
          <p className="text-xs text-yellow-700 mt-2">
            Late or past deadline
          </p>
        </Card>

        <Card className="border-green-300 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">Clean</p>
              <p className="text-3xl font-bold text-green-700">
                {requests.length - criticalCount - warningCount}
              </p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <p className="text-xs text-green-700 mt-2">
            No issues detected
          </p>
        </Card>
      </div>

      {/* Empty State */}
      {requests.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <CheckCircle className="h-24 w-24 text-green-500" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                All Caught Up!
              </h3>
              <p className="mt-2 text-gray-600">
                No pending leave requests require your attention at this time.
              </p>
            </div>
            <Link href="/dashboard/requests">
              <Button variant="outline">
                View All Requests
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Pending Requests List */}
      {requests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Pending Requests ({requests.length})
            </h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-red-600 border-red-600">
                {criticalCount} Critical
              </Badge>
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                {warningCount} Warnings
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {requests.map((request) => (
              <LeaveApprovalCard
                key={request.id}
                request={{
                  ...request,
                  roster_period_code: request.roster_period || null,
                  conflict_flags: Array.isArray(request.conflict_flags) ? request.conflict_flags as string[] : undefined,
                  availability_impact: typeof request.availability_impact === 'object' && request.availability_impact !== null
                    ? (request.availability_impact as { captains_before?: number; captains_after?: number; fos_before?: number; fos_after?: number })
                    : undefined,
                }}

                onApprove={async (id) => {
                  'use server'
                  const supabase = await createClient()
                  await supabase
                    .from('pilot_requests')
                    .update({
                      workflow_status: 'APPROVED',
                      approval_status: 'APPROVED',
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', id)
                }}
                onDeny={async (id) => {
                  'use server'
                  const supabase = await createClient()
                  await supabase
                    .from('pilot_requests')
                    .update({
                      workflow_status: 'DENIED',
                      approval_status: 'DENIED',
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', id)
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <Card className="p-6 bg-blue-50 border-blue-300">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              Approval Guidelines
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • <strong>Critical Alerts</strong>: Conflicts or approving would drop crew below minimum (10 per rank)
              </li>
              <li>
                • <strong>Warnings</strong>: Late submissions or past roster deadline
              </li>
              <li>
                • <strong>Seniority Priority</strong>: Higher seniority pilots have approval priority
              </li>
              <li>
                • <strong>Crew Minimum</strong>: Must maintain at least 10 Captains and 10 First Officers available
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
