'use client'

/**
 * Approvals Hub tab navigation.
 *
 * URL-driven (?tab=) so the server page refetches the right queue; counts are
 * pending-only. Selection (?sel=) resets when switching tabs.
 */

import Link from 'next/link'
import { cn } from '@/lib/utils'

export type ApprovalsTab = 'leave' | 'rdo-sdo' | 'bids' | 'registrations'

const TABS: { key: ApprovalsTab; label: string }[] = [
  { key: 'leave', label: 'Leave' },
  { key: 'rdo-sdo', label: 'RDO / SDO' },
  { key: 'bids', label: 'Leave Bids' },
  { key: 'registrations', label: 'Registrations' },
]

interface ApprovalsTabsProps {
  activeTab: ApprovalsTab
  counts: Record<ApprovalsTab, number>
}

export function ApprovalsTabs({ activeTab, counts }: ApprovalsTabsProps) {
  return (
    <nav className="border-border flex gap-1 border-b" aria-label="Approval queues">
      {TABS.map((tab) => {
        const active = tab.key === activeTab
        return (
          <Link
            key={tab.key}
            href={`/dashboard/approvals?tab=${tab.key}`}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
              active
                ? 'border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            )}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] leading-none font-bold tabular-nums',
                  active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {counts[tab.key]}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
