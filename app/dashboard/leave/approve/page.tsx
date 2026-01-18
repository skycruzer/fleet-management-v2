/**
 * Leave Request Approval Dashboard
 * Admin view for reviewing and approving/denying leave requests
 *
 * Author: Maurice Rondeau
 * Date: November 12, 2025
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
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
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  const supabase = await createClient()

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

      if (
        r.rank === 'Captain' &&
        typeof impact.captains_after === 'number' &&
        impact.captains_after < 10
      ) {
        return true
      }

      if (
        r.rank === 'First Officer' &&
        typeof impact.fos_after === 'number' &&
        impact.fos_after < 10
      ) {
        return true
      }
    }

    return false
  }).length

  const warningCount = requests.filter((r) => r.is_past_deadline || r.is_late_request).length

  return (
    <div className="container mx-auto space-y-6 py-6">
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
            <ListFilter className="mr-2 h-4 w-4" />
            View All Requests
          </Button>
        </Link>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold">{requests.length}</p>
            </div>
            <div className="text-blue-500">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <Card className="border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">Critical</p>
              <p className="text-3xl font-bold text-red-700 dark:text-red-300">{criticalCount}</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400" />
          </div>
          <p className="mt-2 text-xs text-red-700 dark:text-red-300">
            Conflicts or below minimum crew
          </p>
        </Card>

        <Card className="border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Warnings</p>
              <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
                {warningCount}
              </p>
            </div>
            <AlertTriangle className="h-12 w-12 text-yellow-500 dark:text-yellow-400" />
          </div>
          <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">Late or past deadline</p>
        </Card>

        <Card className="border-green-300 bg-green-50 p-4 dark:border-green-700 dark:bg-green-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">Clean</p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                {requests.length - criticalCount - warningCount}
              </p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400" />
          </div>
          <p className="mt-2 text-xs text-green-700 dark:text-green-300">No issues detected</p>
        </Card>
      </div>

      {/* Empty State */}
      {requests.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <CheckCircle className="h-24 w-24 text-green-500 dark:text-green-400" />
            <div>
              <h3 className="text-foreground text-xl font-semibold">All Caught Up!</h3>
              <p className="text-muted-foreground mt-2">
                No pending leave requests require your attention at this time.
              </p>
            </div>
            <Link href="/dashboard/requests">
              <Button variant="outline">View All Requests</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Pending Requests List */}
      {requests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Pending Requests ({requests.length})</h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="border-red-600 text-red-600">
                {criticalCount} Critical
              </Badge>
              <Badge variant="outline" className="border-yellow-600 text-yellow-600">
                {warningCount} Warnings
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {requests.map((request) => (
              <LeaveApprovalCard
                key={request.id}
                request={{
                  id: request.id,
                  pilot_id: request.pilot_id || '',
                  employee_number: request.employee_number || '',
                  rank: request.rank || 'First Officer',
                  name: request.name || 'Unknown',
                  request_type: request.request_type || 'LEAVE',
                  start_date: request.start_date || '',
                  end_date: request.end_date,
                  reason: request.reason,
                  notes: request.notes,
                  is_late_request: request.is_late_request || false,
                  is_past_deadline: request.is_past_deadline || false,
                  created_at: request.created_at || new Date().toISOString(),
                  roster_period_code: request.roster_period || null,
                  conflict_flags: Array.isArray(request.conflict_flags)
                    ? (request.conflict_flags as string[])
                    : undefined,
                  availability_impact:
                    typeof request.availability_impact === 'object' &&
                    request.availability_impact !== null
                      ? (request.availability_impact as {
                          captains_before?: number
                          captains_after?: number
                          fos_before?: number
                          fos_after?: number
                        })
                      : undefined,
                  pilots: request.pilots
                    ? { seniority_number: request.pilots.seniority_number || 0 }
                    : undefined,
                }}
                onApprove={async (id) => {
                  'use server'
                  const auth = await getAuthenticatedAdmin()
                  if (!auth.authenticated) {
                    throw new Error('Unauthorized')
                  }

                  const supabase = await createClient()
                  const { error } = await supabase
                    .from('pilot_requests')
                    .update({
                      workflow_status: 'APPROVED',
                      approval_status: 'APPROVED',
                      reviewed_by: auth.userId,
                      reviewed_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', id)

                  if (error) {
                    throw new Error(error.message)
                  }

                  revalidatePath('/dashboard/leave/approve')
                  revalidatePath('/dashboard/requests')
                }}
                onDeny={async (id) => {
                  'use server'
                  const auth = await getAuthenticatedAdmin()
                  if (!auth.authenticated) {
                    throw new Error('Unauthorized')
                  }

                  const supabase = await createClient()
                  const { error } = await supabase
                    .from('pilot_requests')
                    .update({
                      workflow_status: 'DENIED',
                      approval_status: 'DENIED',
                      reviewed_by: auth.userId,
                      reviewed_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', id)

                  if (error) {
                    throw new Error(error.message)
                  }

                  revalidatePath('/dashboard/leave/approve')
                  revalidatePath('/dashboard/requests')
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <Card className="border-blue-300 bg-blue-50 p-6 dark:border-blue-700 dark:bg-blue-950">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
              Approval Guidelines
            </h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>
                • <strong>Critical Alerts</strong>: Conflicts or approving would drop crew below
                minimum (10 per rank)
              </li>
              <li>
                • <strong>Warnings</strong>: Late submissions or past roster deadline
              </li>
              <li>
                • <strong>Seniority Priority</strong>: Higher seniority pilots have approval
                priority
              </li>
              <li>
                • <strong>Crew Minimum</strong>: Must maintain at least 10 Captains and 10 First
                Officers available
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
