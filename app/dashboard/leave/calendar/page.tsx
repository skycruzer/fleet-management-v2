/**
 * Leave Calendar Page
 * Interactive calendar view for visualizing and managing leave requests
 *
 * @version 1.0.0
 * @since 2025-10-26
 */

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getAllLeaveRequests } from '@/lib/services/leave-service'
import { LeaveCalendarClient } from './leave-calendar-client'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const dynamic = 'force-dynamic'

export default async function LeaveCalendarPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-8">
        <Card className="p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Authentication Required</h2>
          <p className="text-gray-600">Please log in to view the leave calendar.</p>
        </Card>
      </div>
    )
  }

  // Fetch all leave requests
  const leaveRequests = await getAllLeaveRequests()

  // Get total pilot counts by rank
  const { count: totalCaptains } = await supabase
    .from('pilots')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'Captain')

  const { count: totalFirstOfficers } = await supabase
    .from('pilots')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'First Officer')

  return (
    <div className="p-8">
      <Suspense fallback={<LeaveCalendarSkeleton />}>
        <LeaveCalendarClient
          leaveRequests={leaveRequests}
          totalCaptains={totalCaptains || 14}
          totalFirstOfficers={totalFirstOfficers || 13}
        />
      </Suspense>
    </div>
  )
}

function LeaveCalendarSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </Card>
    </div>
  )
}
