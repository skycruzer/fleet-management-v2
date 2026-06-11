/**
 * Approvals Hub — every admin decision in one queue.
 *
 * Tabs: Leave | RDO/SDO | Leave Bids | Registrations. Master-detail layout:
 * left queue (pending only, oldest first), right decision panel with a
 * crew-impact preview computed by the same eligibility engine that gates
 * approval. Browse/history stays at /dashboard/requests.
 *
 * Plan: tasks/todo.md (Option 2, content/UX review 2026-06-11).
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import {
  getAllPilotRequests,
  type PilotRequest,
  type WorkflowStatus,
} from '@/lib/services/unified-request-service'
import { calculateCrewAvailability } from '@/lib/services/leave-eligibility-service'
import { getLeaveBidsForAdmin } from '@/lib/services/leave-bid-service'
import { getPendingRegistrations } from '@/lib/services/pilot-portal-service'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ApprovalsTabs, type ApprovalsTab } from '@/components/approvals/approvals-tabs'
import { ApprovalQueueList, type QueueItem } from '@/components/approvals/approval-queue-list'
import { DecisionPanel, type CrewImpactSummary } from '@/components/approvals/decision-panel'

export const metadata = {
  title: 'Approvals',
  description: 'Review and decide every pending request in one queue',
}

const PENDING_STATUSES = ['SUBMITTED', 'IN_REVIEW'] as WorkflowStatus[]

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function requestToQueueItem(request: PilotRequest): QueueItem {
  const start = request.flight_date ?? request.start_date
  const dates =
    request.end_date && request.end_date !== start ? `${start} → ${request.end_date}` : start
  let hint: QueueItem['hint'] = null
  if (request.is_past_deadline) hint = { label: 'past deadline', tone: 'red' }
  else if (request.is_late_request) hint = { label: 'late request', tone: 'amber' }

  return {
    id: request.id,
    title: `${request.name} — ${request.request_type.replaceAll('_', ' ')} · ${dates}`,
    subtitle: `${request.rank} · Sen ${request.pilot?.seniority_number ?? '—'} · ${request.roster_period}`,
    status: request.workflow_status,
    hint,
    submittedAgo: timeAgo(request.submission_date),
  }
}

/**
 * Crew-impact preview for the selected request. Display-purpose calculation
 * (calculateCrewAvailability); the approve action still runs the atomic
 * engine check, so this preview can warn but never bypass.
 */
async function computeImpact(request: PilotRequest): Promise<CrewImpactSummary> {
  const rank: 'Captain' | 'First Officer' = request.rank === 'Captain' ? 'Captain' : 'First Officer'
  const otherRankLabel = rank === 'Captain' ? 'First Officers' : 'Captains'
  const start = request.flight_date ?? request.start_date
  const end = request.end_date ?? start

  try {
    const days = await calculateCrewAvailability(start, end, request.id)
    if (days.length === 0) throw new Error('No availability data for the requested dates')

    const worst = days.reduce((min, day) => {
      const avail = rank === 'Captain' ? day.availableCaptains : day.availableFirstOfficers
      const minAvail = rank === 'Captain' ? min.availableCaptains : min.availableFirstOfficers
      return avail < minAvail ? day : min
    })

    const availableBefore =
      rank === 'Captain' ? worst.availableCaptains : worst.availableFirstOfficers
    const availableAfter = availableBefore - 1
    const minimumRequired = 10
    const otherRankAvailable =
      rank === 'Captain' ? worst.availableFirstOfficers : worst.availableCaptains

    let tone: CrewImpactSummary['tone'] = 'green'
    let headline = `Crew impact — ${request.roster_period}: no eligibility risk`
    let detail = `Worst day ${worst.date}: ${rank}s ${availableBefore} → ${availableAfter}, comfortably above the minimum of ${minimumRequired}.`
    if (availableAfter < minimumRequired) {
      tone = 'red'
      headline = `Approving drops ${rank}s below minimum (${availableAfter} < ${minimumRequired})`
      detail = `Worst day ${worst.date}. The approval gate will block this unless overridden.`
    } else if (availableAfter === minimumRequired) {
      tone = 'amber'
      headline = `Approving puts ${rank}s at the minimum (${minimumRequired}) — no buffer`
      detail = `Worst day ${worst.date}. Any further ${rank} absence on these dates would breach eligibility.`
    }

    return {
      rank,
      availableBefore,
      availableAfter,
      minimumRequired,
      otherRankAvailable,
      otherRankLabel,
      tone,
      headline,
      detail,
    }
  } catch (error) {
    return {
      rank,
      availableBefore: 0,
      availableAfter: 0,
      minimumRequired: 10,
      otherRankAvailable: 0,
      otherRankLabel,
      tone: 'amber',
      headline: 'Crew impact unavailable',
      detail: '',
      error:
        error instanceof Error
          ? error.message
          : 'Eligibility engine could not be reached — the approve action still enforces the check.',
    }
  }
}

interface PageProps {
  searchParams: Promise<{ tab?: string; sel?: string }>
}

export default async function ApprovalsPage({ searchParams: searchParamsPromise }: PageProps) {
  const searchParams = await searchParamsPromise
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) redirect('/auth/login')

  const tab: ApprovalsTab = (['leave', 'rdo-sdo', 'bids', 'registrations'] as const).includes(
    searchParams.tab as ApprovalsTab
  )
    ? (searchParams.tab as ApprovalsTab)
    : 'leave'

  const [requestsResponse, bidsResponse, registrationsResponse] = await Promise.all([
    getAllPilotRequests({ status: PENDING_STATUSES }),
    getLeaveBidsForAdmin(),
    getPendingRegistrations(),
  ])

  const pending = (requestsResponse.success ? (requestsResponse.data ?? []) : []).sort(
    (a, b) => new Date(a.submission_date).getTime() - new Date(b.submission_date).getTime()
  )
  const leaveRequests = pending.filter((r) => r.request_category === 'LEAVE')
  const rdoRequests = pending.filter((r) => r.request_category === 'FLIGHT')
  const pendingBids = (bidsResponse.success ? (bidsResponse.data ?? []) : []).filter(
    (bid) => bid.status === 'PENDING'
  )
  const registrations = registrationsResponse.success ? (registrationsResponse.data ?? []) : []

  const counts: Record<ApprovalsTab, number> = {
    leave: leaveRequests.length,
    'rdo-sdo': rdoRequests.length,
    bids: pendingBids.length,
    registrations: registrations.length,
  }

  // Request-tab selection + impact (leave and rdo-sdo share the same machinery)
  const activeRequests = tab === 'leave' ? leaveRequests : tab === 'rdo-sdo' ? rdoRequests : []
  const selectedRequest =
    activeRequests.find((r) => r.id === searchParams.sel) ?? activeRequests[0] ?? null
  const impact = selectedRequest ? await computeImpact(selectedRequest) : null

  return (
    <div className="w-full space-y-4 px-4 py-4 lg:px-6 lg:py-6">
      <PageHeader
        title="Approvals"
        description="Every pending decision in one queue, with crew impact before you commit"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/requests">History &amp; browse</Link>
          </Button>
        }
      />

      <ApprovalsTabs activeTab={tab} counts={counts} />

      {(tab === 'leave' || tab === 'rdo-sdo') && (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <Card className="self-start overflow-hidden">
            <ApprovalQueueList
              tab={tab}
              items={activeRequests.map(requestToQueueItem)}
              selectedId={selectedRequest?.id ?? null}
              emptyMessage={
                tab === 'leave'
                  ? 'No leave requests awaiting a decision.'
                  : 'No RDO/SDO requests awaiting a decision.'
              }
            />
          </Card>
          {selectedRequest && impact ? (
            <Card className="overflow-hidden">
              <DecisionPanel
                request={selectedRequest}
                impact={impact}
                orderedIds={activeRequests.map((r) => r.id)}
                tab={tab}
              />
            </Card>
          ) : (
            <Card className="text-muted-foreground flex items-center justify-center p-12 text-sm">
              Nothing selected — the queue is clear.
            </Card>
          )}
        </div>
      )}

      {tab === 'bids' && (
        <Card className="overflow-hidden">
          <ApprovalQueueList
            tab="bids"
            items={pendingBids.map((bid) => ({
              id: bid.id,
              title: `${bid.pilots?.first_name ?? ''} ${bid.pilots?.last_name ?? ''} — leave bid ${bid.bid_year}`,
              subtitle: `${bid.pilots?.role ?? ''} · Sen ${bid.pilots?.seniority_number ?? '—'} · ${bid.leave_bid_options.length} option${bid.leave_bid_options.length === 1 ? '' : 's'}`,
              status: 'PENDING',
              hint: null,
              submittedAgo: bid.created_at ? timeAgo(bid.created_at) : '',
            }))}
            selectedId={null}
            emptyMessage="No leave bids awaiting review."
          />
          {pendingBids.length > 0 && (
            <div className="border-border border-t px-4 py-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/admin/leave-bids">Open full bid review →</Link>
              </Button>
            </div>
          )}
        </Card>
      )}

      {tab === 'registrations' && (
        <Card className="overflow-hidden">
          <ApprovalQueueList
            tab="registrations"
            items={registrations.map((reg) => ({
              id: reg.id,
              title: `${reg.first_name} ${reg.last_name} — portal registration`,
              subtitle: `${reg.rank ?? ''} · ${reg.email ?? ''}`,
              status: 'PENDING',
              hint: null,
              submittedAgo: reg.created_at ? timeAgo(reg.created_at) : '',
            }))}
            selectedId={null}
            emptyMessage="No registrations awaiting approval."
          />
          {registrations.length > 0 && (
            <div className="border-border border-t px-4 py-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/admin/pilot-registrations">Open registration review →</Link>
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
