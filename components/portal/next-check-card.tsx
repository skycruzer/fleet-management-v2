/**
 * Next Check Card — the pilot dashboard hero (Option 5, Pilot-First Portal).
 *
 * Answers the pilot's forward-looking question — "when do I next act?" —
 * instead of the backwards-looking compliance rate. Picks the soonest
 * expiry across every attention tier from PilotPortalStats details.
 */

import Link from 'next/link'
import { CalendarClock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { getRosterPeriodFromDate } from '@/lib/utils/roster-utils'
import { cn } from '@/lib/utils'

interface CheckDetail {
  id: string
  check_code: string
  check_description: string
  expiry_date: string
}

interface NextCheckCardProps {
  expired: CheckDetail[]
  critical: CheckDetail[]
  caution: CheckDetail[]
  upcoming: CheckDetail[]
}

export function NextCheckCard({ expired, critical, caution, upcoming }: NextCheckCardProps) {
  const all = [...expired, ...critical, ...caution, ...upcoming].filter((c) => c.expiry_date)
  const soonest = all.sort(
    (a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
  )[0]

  if (!soonest) {
    return (
      <Card className="border-t-[3px] border-t-[var(--color-status-low)] p-4">
        <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
          Next check due
        </p>
        <p className="text-foreground mt-1 text-base font-bold">
          All checks current — nothing due in the next 60 days
        </p>
        <Link href="/portal/certifications" className="text-primary mt-1 inline-block text-sm">
          View all certifications →
        </Link>
      </Card>
    )
  }

  const expiry = new Date(soonest.expiry_date + 'T00:00:00')
  const days = Math.ceil((expiry.getTime() - Date.now()) / 86_400_000)
  const overdue = days < 0
  const rp = getRosterPeriodFromDate(expiry)
  const tone = overdue
    ? 'border-t-[var(--color-status-high)]'
    : days <= 30
      ? 'border-t-[var(--color-status-medium)]'
      : 'border-t-[var(--color-status-low)]'
  const countColor = overdue
    ? 'text-[var(--color-status-high)]'
    : days <= 30
      ? 'text-[var(--color-status-medium)]'
      : 'text-[var(--color-status-low)]'

  return (
    <Link href="/portal/certifications" className="block">
      <Card className={cn('border-t-[3px] p-4 transition-colors hover:bg-muted/40', tone)}>
        <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
          {overdue ? 'Check overdue' : 'Next check due'}
        </p>
        <div className="mt-2 flex items-center gap-4">
          <div className="text-center">
            <p className={cn('text-4xl leading-none font-bold tabular-nums', countColor)}>
              {Math.abs(days)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[11px] font-semibold">
              {overdue ? 'days overdue' : days === 1 ? 'day' : 'days'}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-foreground truncate text-base font-bold">
              {soonest.check_description || soonest.check_code}
            </p>
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <CalendarClock className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              {overdue ? 'expired' : 'due'}{' '}
              {expiry.toLocaleDateString('en-AU', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}{' '}
              · falls in {rp.code}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
