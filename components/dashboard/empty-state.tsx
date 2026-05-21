/**
 * Empty State
 * Developer: Maurice Rondeau
 *
 * Shared empty-state block for dashboard widgets, so "nothing here"
 * looks the same everywhere instead of each widget improvising.
 */

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: { href: string; label: string }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
      <div className="bg-muted mb-3 flex h-12 w-12 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground h-6 w-6" aria-hidden="true" />
      </div>
      <p className="text-foreground text-sm font-semibold">{title}</p>
      {description ? (
        <p className="text-muted-foreground mt-1 max-w-xs text-xs">{description}</p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}
