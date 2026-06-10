'use client'

/**
 * Approvals Hub queue list (left pane).
 *
 * Items are links that set ?sel= so the server page renders the matching
 * decision panel. Oldest submissions first — the queue is a work list,
 * not a feed.
 */

import Link from 'next/link'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'

export interface QueueItem {
  id: string
  title: string
  subtitle: string
  /** e.g. SUBMITTED / IN_REVIEW / PENDING — rendered via StatusBadge */
  status: string
  /** Short urgency hint, e.g. "at FO floor" or "past deadline" */
  hint?: { label: string; tone: 'red' | 'amber' | 'green' } | null
  submittedAgo: string
}

interface ApprovalQueueListProps {
  tab: string
  items: QueueItem[]
  selectedId: string | null
  emptyMessage: string
}

const HINT_TONE: Record<'red' | 'amber' | 'green', string> = {
  red: 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]',
  amber: 'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)]',
  green: 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]',
}

export function ApprovalQueueList({ tab, items, selectedId, emptyMessage }: ApprovalQueueListProps) {
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-1 px-6 py-12 text-center">
        <p className="text-foreground text-sm font-semibold">Queue clear</p>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ul className="divide-border divide-y" role="listbox" aria-label="Pending items">
      {items.map((item) => {
        const selected = item.id === selectedId
        return (
          <li key={item.id} role="option" aria-selected={selected}>
            <Link
              href={`/dashboard/approvals?tab=${tab}&sel=${item.id}`}
              scroll={false}
              className={cn(
                'block px-4 py-3 transition-colors',
                selected
                  ? 'bg-[var(--color-info-bg)] border-l-[3px] border-l-primary'
                  : 'hover:bg-muted/50 border-l-[3px] border-l-transparent'
              )}
            >
              <p className="text-foreground truncate text-sm font-semibold">{item.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-xs">{item.subtitle}</span>
                {item.hint && (
                  <span
                    className={cn(
                      'rounded-sm px-1.5 py-0.5 text-[10.5px] font-bold tracking-wide uppercase',
                      HINT_TONE[item.hint.tone]
                    )}
                  >
                    {item.hint.label}
                  </span>
                )}
                <span className="text-muted-foreground/70 ml-auto text-xs">
                  {item.submittedAgo}
                </span>
              </div>
              <div className="mt-1.5">
                <StatusBadge status={item.status} size="sm" hideIcon />
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
