/**
 * Pending Approvals Widget
 * Developer: Maurice Rondeau
 *
 * Shows the top 5 pending pilot requests with approve/deny action buttons.
 * Server Component wrapper fetches data; Client Component handles actions.
 * Part of the Video Buddy-inspired dashboard redesign (Phase 2).
 */

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { ClipboardList } from 'lucide-react'
import { getAllPilotRequests } from '@/lib/services/unified-request-service'
import { PendingApprovalsClient } from './pending-approvals-client'

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
    }
  } catch {
    // Fail silently — widget is non-critical
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Pending Approvals
        </h3>
        <ClipboardList className="text-muted-foreground/50 h-4 w-4" aria-hidden="true" />
      </div>

      {requests.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">No pending approvals</p>
      ) : (
        <PendingApprovalsClient requests={requests} />
      )}

      <div className="border-border mt-3 border-t pt-3">
        <Link href="/dashboard/requests" className="text-primary text-xs hover:underline">
          View all requests →
        </Link>
      </div>
    </Card>
  )
}
