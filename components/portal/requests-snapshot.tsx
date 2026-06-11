/**
 * Requests Snapshot — "what changed" for the pilot dashboard (Option 5).
 *
 * Latest requests with status AND when the status last moved, so pilots stop
 * guessing whether anything happened since they submitted. Data, not links.
 */

import Link from 'next/link'
import { getAllPilotRequests } from '@/lib/services/unified-request-service'
import { StatusBadge } from '@/components/ui/status-badge'
import { Card } from '@/components/ui/card'

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

export async function RequestsSnapshot({ pilotId }: { pilotId: string }) {
  const response = await getAllPilotRequests({ pilot_id: pilotId, limit: 10 })
  const requests = (response.success ? (response.data ?? []) : [])
    .sort((a, b) => new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime())
    .slice(0, 3)

  return (
    <Card className="overflow-hidden">
      <div className="border-border flex items-center border-b px-4 py-2.5">
        <h2 className="text-foreground text-xs font-bold tracking-wider uppercase">My requests</h2>
        <Link href="/portal/requests" className="text-primary ml-auto text-sm font-medium">
          View all →
        </Link>
      </div>
      {requests.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-muted-foreground text-sm">No requests yet.</p>
          <Link href="/portal/leave-requests/new" className="text-primary text-sm font-medium">
            Submit your first request →
          </Link>
        </div>
      ) : (
        <ul className="divide-border/60 divide-y">
          {requests.map((request) => {
            const start = request.flight_date ?? request.start_date
            const lastChange = request.reviewed_at ?? request.submission_date
            const changeLabel = request.reviewed_at ? 'status changed' : 'submitted'
            return (
              <li key={request.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-semibold">
                    {request.request_type.replaceAll('_', ' ')} ·{' '}
                    {new Date(start + 'T00:00:00').toLocaleDateString('en-AU', {
                      day: '2-digit',
                      month: 'short',
                    })}
                    {request.end_date && request.end_date !== start && (
                      <>
                        {' '}
                        –{' '}
                        {new Date(request.end_date + 'T00:00:00').toLocaleDateString('en-AU', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </>
                    )}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {changeLabel} {timeAgo(lastChange)}
                    {request.review_comments && ' · reviewer comment available'}
                  </p>
                </div>
                <StatusBadge status={request.workflow_status} size="sm" hideIcon />
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
