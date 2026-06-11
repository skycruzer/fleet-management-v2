/**
 * Crew Eligibility Banner — the Morning Brief headline.
 *
 * Surfaces the #1 business rule (10 Captains + 10 First Officers available)
 * as a permanent dashboard fixture instead of a reactive approval error.
 * Worst-day availability over the REMAINDER of the current roster period,
 * from the same engine that gates approvals (leave-eligibility-service).
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { calculateCrewAvailability } from '@/lib/services/leave-eligibility-service'
import { getCurrentRosterPeriodObject } from '@/lib/utils/roster-utils'
import { Button } from '@/components/ui/button'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import { cn } from '@/lib/utils'

const MINIMUM_PER_RANK = 10

function pill(available: number): { tone: string; label: string } {
  if (available < MINIMUM_PER_RANK) {
    return {
      tone: 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]',
      label: 'below minimum',
    }
  }
  if (available === MINIMUM_PER_RANK) {
    return {
      tone: 'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)]',
      label: 'at floor',
    }
  }
  return { tone: 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]', label: 'ok' }
}

export async function CrewEligibilityBanner() {
  const rp = getCurrentRosterPeriodObject()

  let worstCaptains: number | null = null
  let worstFOs: number | null = null
  let worstDate = ''

  try {
    const todayIso = new Date().toISOString().slice(0, 10)
    const endIso = rp.endDate.toISOString().slice(0, 10)
    const days = await calculateCrewAvailability(todayIso, endIso)
    if (days.length > 0) {
      const worstCpt = days.reduce((m, d) => (d.availableCaptains < m.availableCaptains ? d : m))
      const worstFo = days.reduce((m, d) =>
        d.availableFirstOfficers < m.availableFirstOfficers ? d : m
      )
      worstCaptains = worstCpt.availableCaptains
      worstFOs = worstFo.availableFirstOfficers
      worstDate =
        worstCpt.availableCaptains - MINIMUM_PER_RANK <=
        worstFo.availableFirstOfficers - MINIMUM_PER_RANK
          ? worstCpt.date
          : worstFo.date
    }
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      source: 'CrewEligibilityBanner',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'calculateCrewAvailability' },
    })
  }

  if (worstCaptains === null || worstFOs === null) {
    return (
      <div className="border-border bg-card rounded-lg border border-l-4 border-l-[var(--color-status-medium)] px-4 py-3">
        <p className="text-foreground text-sm font-semibold">Crew eligibility — {rp.code}</p>
        <p className="text-muted-foreground text-xs">
          Availability check unavailable right now; approvals still enforce the minimums.
        </p>
      </div>
    )
  }

  const breached = worstCaptains < MINIMUM_PER_RANK || worstFOs < MINIMUM_PER_RANK
  const atFloor = worstCaptains === MINIMUM_PER_RANK || worstFOs === MINIMUM_PER_RANK
  const cptPill = pill(worstCaptains)
  const foPill = pill(worstFOs)

  return (
    <div
      className={cn(
        'border-border bg-card flex flex-col gap-3 rounded-lg border border-l-4 px-4 py-3 sm:flex-row sm:items-center',
        breached
          ? 'border-l-[var(--color-status-high)]'
          : atFloor
            ? 'border-l-[var(--color-status-medium)]'
            : 'border-l-[var(--color-status-low)]'
      )}
    >
      <div className="min-w-0">
        <p className="text-foreground text-sm font-bold">
          Crew eligibility — {rp.code} (day {28 - Math.max(0, rp.daysRemaining)} of 28)
        </p>
        <p className="text-muted-foreground text-xs">
          {breached
            ? `Worst day ${worstDate}: minimum crew breached — review approved leave now`
            : atFloor
              ? `Worst day ${worstDate}: at minimum with zero buffer — any further absence breaches eligibility`
              : `Lowest availability through ${rp.endDate.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })} stays above the minimum`}
        </p>
      </div>
      <div className="flex items-center gap-2 sm:ml-auto">
        <span className={cn('rounded-sm px-2.5 py-1 text-xs font-bold tabular-nums', cptPill.tone)}>
          CPT {worstCaptains} / {MINIMUM_PER_RANK} min
        </span>
        <span className={cn('rounded-sm px-2.5 py-1 text-xs font-bold tabular-nums', foPill.tone)}>
          FO {worstFOs} / {MINIMUM_PER_RANK} min
        </span>
        <Button variant={breached || atFloor ? 'primary' : 'outline'} size="sm" asChild>
          <Link href="/dashboard/approvals">
            Review queue
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
