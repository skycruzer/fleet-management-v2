/**
 * Collapsible Widget Component - Cockpit Precision Design
 * Dense, expandable card wrapper with FAA-compliant priority indicators
 *
 * @author Maurice Rondeau
 */

'use client'

import * as React from 'react'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface CollapsibleWidgetProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  badge?: React.ReactNode
  defaultExpanded?: boolean
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  children: React.ReactNode
  headerAction?: React.ReactNode
  priority?: 'critical' | 'warning' | 'info' | 'success'
  className?: string
}

// FAA-compliant priority colors
const priorityStyles = {
  critical: 'border-l-2 border-l-destructive',
  warning: 'border-l-2 border-l-warning',
  info: 'border-l-2 border-l-primary',
  success: 'border-l-2 border-l-success',
}

export function CollapsibleWidget({
  title,
  subtitle,
  icon: Icon,
  badge,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onExpandedChange,
  children,
  headerAction,
  priority,
  className,
}: CollapsibleWidgetProps) {
  const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded)

  const isExpanded = controlledExpanded ?? internalExpanded
  const setExpanded = onExpandedChange ?? setInternalExpanded

  const handleToggle = () => {
    setExpanded(!isExpanded)
  }

  return (
    <Card className={cn(priority && priorityStyles[priority], className)}>
      <CardHeader className="px-3 py-2.5">
        <button
          onClick={handleToggle}
          className="focus-visible:ring-ring -m-1 flex w-full items-center justify-between gap-1.5 rounded-sm p-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          aria-expanded={isExpanded}
          aria-controls={`widget-content-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            {Icon && (
              <div className="border-border bg-surface text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-sm border">
                <Icon className="size-3.5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-foreground truncate text-sm font-medium">{title}</h3>
                {badge && (
                  <span className="bg-primary/10 text-primary inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-xs font-medium">
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && <p className="text-muted-foreground truncate text-xs">{subtitle}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerAction && <div onClick={(e) => e.stopPropagation()}>{headerAction}</div>}
            <ChevronDown
              className={cn(
                'text-muted-foreground size-4 transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
          </div>
        </button>
      </CardHeader>
      {isExpanded && (
        <div id={`widget-content-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          <CardContent className="px-3 pt-0 pb-3">{children}</CardContent>
        </div>
      )}
    </Card>
  )
}

/**
 * Widget Group - Container for organizing multiple widgets
 */
export function WidgetGroup({
  title,
  children,
  className,
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {title && (
        <h2 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {title}
        </h2>
      )}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  )
}

export { type CollapsibleWidgetProps }
