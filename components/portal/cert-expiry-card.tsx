/**
 * CertExpiryCard
 * Reusable card for displaying certification expiry alerts in the Pilot Portal.
 * Supports three severity variants: expired, danger (0-14d), warning (15-60d).
 */

import { AlertTriangle, XCircle, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface CertCheckItem {
  id: string | number
  check_code: string
  check_description: string
  expiry_date: string
}

type CertExpiryVariant = 'expired' | 'danger' | 'warning'

interface CertExpiryCardProps {
  variant: CertExpiryVariant
  title: string
  description: string
  checks: CertCheckItem[]
  className?: string
}

function computeBadge(
  variant: CertExpiryVariant,
  item: CertCheckItem,
  now: number
): { label: string; sublabel: string } {
  const diffDays = Math.ceil((new Date(item.expiry_date).getTime() - now) / (1000 * 60 * 60 * 24))
  if (variant === 'expired') {
    return { label: `${Math.abs(diffDays)}d ago`, sublabel: 'expired' }
  }
  return { label: `${diffDays}d`, sublabel: 'remaining' }
}

const variantConfig: Record<
  CertExpiryVariant,
  {
    cardClass: string
    borderClass: string
    textClass: string
    textMutedClass: string
    rowBorderClass: string
    Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  }
> = {
  expired: {
    cardClass: 'border-destructive/20 bg-destructive/5',
    borderClass: 'border-destructive/20',
    textClass: 'text-destructive',
    textMutedClass: 'text-destructive/70',
    rowBorderClass: 'border-destructive/20',
    Icon: XCircle,
  },
  danger: {
    cardClass: 'border-destructive/20 bg-destructive/5',
    borderClass: 'border-destructive/20',
    textClass: 'text-destructive',
    textMutedClass: 'text-destructive/70',
    rowBorderClass: 'border-destructive/20',
    Icon: AlertTriangle,
  },
  warning: {
    cardClass: 'border-warning/20 bg-warning/5',
    borderClass: 'border-warning/20',
    textClass: 'text-warning-text',
    textMutedClass: 'text-warning-text/70',
    rowBorderClass: 'border-warning/20',
    Icon: Clock,
  },
}

export function CertExpiryCard({
  variant,
  title,
  description,
  checks,
  className,
}: CertExpiryCardProps) {
  if (!checks || checks.length === 0) return null

  const config = variantConfig[variant]
  const { Icon } = config
  // Stable timestamp for the entire render pass — avoids hydration mismatch
  const now = Date.now()

  return (
    <Card className={cn('p-5', config.cardClass, className)}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className={cn('h-5 w-5', config.textClass)} aria-hidden />
        <h3 className={cn('text-sm font-semibold', config.textClass)}>{title}</h3>
      </div>

      {description && <p className={cn('mb-3 text-sm', config.textMutedClass)}>{description}</p>}

      <div className="space-y-2">
        {checks.map((check) => {
          const { label, sublabel } = computeBadge(variant, check, now)
          return (
            <div
              key={check.id}
              className={cn(
                'bg-card flex items-center justify-between rounded border px-4 py-3',
                config.rowBorderClass
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm font-semibold">{check.check_code}</p>
                <p className="text-muted-foreground truncate text-xs">{check.check_description}</p>
              </div>
              <div className="ml-3 shrink-0 text-right">
                <p className={cn('text-lg leading-none font-bold', config.textClass)}>{label}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">{sublabel}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
