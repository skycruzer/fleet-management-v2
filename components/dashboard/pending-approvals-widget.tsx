/**
 * Pending Approvals Widget
 * Developer: Maurice Rondeau
 *
 * Shows the top 5 pending pilot requests with approve/deny action buttons.
 * Server Component wrapper fetches data; Client Component handles actions.
 *
 * A fetch failure renders an explicit error state — never a false
 * "no pending approvals", which would hide work that needs doing.
 */

import { ClipboardList, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getAllPilotRequests } from '@/lib/services/unified-request-service'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import { PendingApprovalsClient } from './pending-approvals-client'
import { DashboardCard } from './dashboard-card'
import { EmptyState } from './empty-state'

export async function PendingApprovalsWidget() {
  let requests: Array<{
    id: string
    pilotName: string
    rank: string
    requestType: string
    requestCategory: string
    startDate: string
    endDate: string | null
    daysCount: number | null
  }> = []
  let hasError = false

  try {
    const result = await getAllPilotRequests({
      status: ['SUBMITTED', 'IN_REVIEW'],
      limit: 5,
    })

    if (result.success && result.data) {
      requests = result.data.map((r) => ({
        id: r.id,
        pilotName: r.pilot ? `${r.pilot.first_name} ${r.pilot.last_name}` : r.name || 'Unknown',
        rank: r.rank || 'Pilot',
        requestType: r.request_type,
        requestCategory: r.request_category,
        startDate: r.start_date,
        endDate: r.end_date,
        daysCount: r.days_count,
      }))
    } else if (!result.success) {
      hasError = true
    }
  } catch (error) {
    hasError = true
    logError(error instanceof Error ? error : new Error(String(error)), {
      source: 'PendingApprovalsWidget',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getAllPilotRequests' },
    })
  }

  return (
    <DashboardCard
      title="Pending Approvals"
      icon={ClipboardList}
      action={{ href: '/dashboard/requests', label: 'View all requests' }}
    >
      {hasError ? (
        <div className="flex items-center gap-2 py-4" role="alert">
          <AlertTriangle className="text-warning h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <p className="text-muted-foreground text-sm">
            Unable to load approvals — try refreshing.
          </p>
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No pending approvals"
          description="All requests have been actioned."
          className="py-6"
        />
      ) : (
        <PendingApprovalsClient requests={requests} />
      )}
    </DashboardCard>
  )
}
