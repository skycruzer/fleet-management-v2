/**
 * Approvals Hub decision panel (right pane) — server component.
 *
 * Shows the selected request with the crew-impact preview computed from the
 * same eligibility engine that gates approval (leave-eligibility-service),
 * so the preview can never disagree with the enforcement.
 */

import type { PilotRequest } from '@/lib/services/unified-request-service'
import { DecisionActions } from '@/components/approvals/decision-actions'
import { cn } from '@/lib/utils'

export interface CrewImpactSummary {
  /** Rank being evaluated for this request */
  rank: 'Captain' | 'First Officer'
  /** Worst-day availability across the request's dates, excluding this request */
  availableBefore: number
  availableAfter: number
  minimumRequired: number
  otherRankAvailable: number
  otherRankLabel: string
  /** Engine verdict */
  tone: 'green' | 'amber' | 'red'
  headline: string
  detail: string
  /** Set when the engine could not be consulted */
  error?: string
}

const TONE_STYLES: Record<'green' | 'amber' | 'red', { border: string; bg: string; text: string }> =
  {
    green: {
      border: 'border-l-[var(--color-status-low)]',
      bg: 'bg-[var(--color-status-low-bg)]',
      text: 'text-[var(--color-status-low)]',
    },
    amber: {
      border: 'border-l-[var(--color-status-medium)]',
      bg: 'bg-[var(--color-status-medium-bg)]',
      text: 'text-[var(--color-status-medium)]',
    },
    red: {
      border: 'border-l-[var(--color-status-high)]',
      bg: 'bg-[var(--color-status-high-bg)]',
      text: 'text-[var(--color-status-high)]',
    },
  }

function CrewImpactCard({ impact }: { impact: CrewImpactSummary }) {
  if (impact.error) {
    return (
      <div className="border-border bg-muted/40 mx-5 mt-4 rounded-md border p-3 text-sm">
        <p className="font-semibold">Crew impact unavailable</p>
        <p className="text-muted-foreground mt-0.5 text-xs">{impact.error}</p>
      </div>
    )
  }

  const styles = TONE_STYLES[impact.tone]
  return (
    <div
      className={cn(
        'border-border mx-5 mt-4 rounded-md border border-l-4 p-3.5',
        styles.border,
        styles.bg
      )}
    >
      <p className={cn('text-sm font-bold', styles.text)}>{impact.headline}</p>
      <div className="text-foreground mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
        <span>
          {impact.rank}s:{' '}
          <b className="tabular-nums">
            {impact.availableBefore} → {impact.availableAfter}
          </b>{' '}
          (min {impact.minimumRequired})
        </span>
        <span>
          {impact.otherRankLabel}: <b className="tabular-nums">{impact.otherRankAvailable}</b> (no
          change)
        </span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">{impact.detail}</p>
    </div>
  )
}

interface DecisionPanelProps {
  request: PilotRequest
  impact: CrewImpactSummary
  orderedIds: string[]
  tab: string
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-border/60 flex border-b py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground w-36 flex-shrink-0">{label}</span>
      <span className="text-foreground">{children}</span>
    </div>
  )
}

function formatDateRange(request: PilotRequest): string {
  const start = request.flight_date ?? request.start_date
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  if (!request.end_date || request.end_date === start) return fmt(start)
  return `${fmt(start)} – ${fmt(request.end_date)}${
    request.days_count ? ` (${request.days_count} days)` : ''
  }`
}

export function DecisionPanel({ request, impact, orderedIds, tab }: DecisionPanelProps) {
  const pilotName = request.name || `${request.pilot?.first_name} ${request.pilot?.last_name}`
  const seniority = request.pilot?.seniority_number

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-baseline gap-3 border-b-2 px-5 py-3.5">
        <h2 className="text-foreground text-sm font-bold">
          {pilotName} — {request.request_type.replaceAll('_', ' ')}
        </h2>
        <span className="text-muted-foreground ml-auto text-xs">
          {request.rank}
          {seniority != null && <> · Seniority {seniority}</>}
        </span>
      </div>

      <CrewImpactCard impact={impact} />

      <div className="flex-1 px-5 py-3">
        <Field label="Dates">{formatDateRange(request)}</Field>
        <Field label="Roster period">{request.roster_period}</Field>
        <Field label="Submitted">
          {new Date(request.submission_date).toLocaleDateString('en-AU')} ·{' '}
          {request.submission_channel.toLowerCase().replaceAll('_', ' ')}
          {request.is_late_request && (
            <span className="text-[var(--color-status-medium)]"> · late request</span>
          )}
          {request.is_past_deadline && (
            <span className="text-[var(--color-status-high)]"> · past deadline</span>
          )}
        </Field>
        {request.reason && <Field label="Reason">{request.reason}</Field>}
        {request.review_comments && <Field label="Review notes">{request.review_comments}</Field>}
        {request.conflict_flags.length > 0 && (
          <Field label="Conflict flags">{request.conflict_flags.join(', ')}</Field>
        )}
      </div>

      <DecisionActions
        requestId={request.id}
        orderedIds={orderedIds}
        tab={tab}
        blocked={impact.tone === 'red' && !impact.error}
      />
    </div>
  )
}
