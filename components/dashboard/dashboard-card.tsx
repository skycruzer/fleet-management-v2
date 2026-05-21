/**
 * Dashboard Card
 * Developer: Maurice Rondeau
 *
 * Single card primitive for the dashboard — enforces one consistent
 * header, footer, and padding across every widget.
 *
 * Two-tier system:
 * - tone="default" — quiet card (header is a plain bottom-bordered row).
 *   Used by routine widgets.
 * - tone="alert" — loud card (header is a destructive-colored band).
 *   Reserved for genuine alert/critical states only, so real alerts
 *   stand out instead of every card competing for attention.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DashboardCardProps {
  title: string
  icon?: LucideIcon
  tone?: 'default' | 'alert'
  /** Optional element rendered at the far right of the header (e.g. a badge). */
  headerRight?: React.ReactNode
  /** Optional footer link rendered as a full-width action row. */
  action?: { href: string; label: string }
  className?: string
  contentClassName?: string
  children: React.ReactNode
}

export function DashboardCard({
  title,
  icon: Icon,
  tone = 'default',
  headerRight,
  action,
  className,
  contentClassName,
  children,
}: DashboardCardProps) {
  const isAlert = tone === 'alert'

  return (
    <Card className={cn('flex h-full flex-col overflow-hidden', className)}>
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-3',
          isAlert ? 'bg-destructive text-destructive-foreground' : 'border-border border-b'
        )}
      >
        {Icon ? (
          <Icon
            className={cn(
              'h-4 w-4 flex-shrink-0',
              isAlert ? 'text-destructive-foreground' : 'text-muted-foreground'
            )}
            aria-hidden="true"
          />
        ) : null}
        <h3 className="flex-1 truncate text-sm font-semibold">{title}</h3>
        {headerRight}
      </div>

      <div className={cn('flex-1 p-4', contentClassName)}>{children}</div>

      {action ? (
        <Link
          href={action.href}
          className="border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-between border-t px-4 py-2.5 text-xs font-medium transition-colors"
        >
          {action.label}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      ) : null}
    </Card>
  )
}
