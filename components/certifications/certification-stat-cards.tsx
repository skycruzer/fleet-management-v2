/**
 * Certification Stat Cards Component
 * Displays summary statistics for certifications with FAA-compliant color coding
 *
 * @author Maurice Rondeau
 * @version 1.0.0
 * @created 2025-12-19
 */

'use client'

import { Card } from '@/components/ui/card'
import { CheckCircle, Clock, AlertCircle, FileCheck } from 'lucide-react'

export interface CertificationStats {
  total: number
  current: number
  expiring: number
  expired: number
}

interface CertificationStatCardsProps {
  stats: CertificationStats
  onStatClick?: (status: 'all' | 'current' | 'expiring' | 'expired') => void
  activeStatus?: 'all' | 'current' | 'expiring' | 'expired'
}

export function CertificationStatCards({
  stats,
  onStatClick,
  activeStatus,
}: CertificationStatCardsProps) {
  const cards = [
    {
      key: 'all' as const,
      label: 'Total',
      value: stats.total,
      icon: FileCheck,
      iconClass: 'text-primary',
      bgClass: 'bg-primary/10',
    },
    {
      key: 'current' as const,
      label: 'Current',
      value: stats.current,
      icon: CheckCircle,
      iconClass: 'text-[var(--color-status-low)]',
      bgClass: 'bg-[var(--color-status-low-bg)]',
    },
    {
      key: 'expiring' as const,
      label: 'Expiring Soon',
      value: stats.expiring,
      icon: Clock,
      iconClass: 'text-[var(--color-status-medium)]',
      bgClass: 'bg-[var(--color-status-medium-bg)]',
    },
    {
      key: 'expired' as const,
      label: 'Expired',
      value: stats.expired,
      icon: AlertCircle,
      iconClass: 'text-[var(--color-status-high)]',
      bgClass: 'bg-[var(--color-status-high-bg)]',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        const isActive = activeStatus === card.key
        const isClickable = !!onStatClick

        return (
          <Card
            key={card.key}
            className={`p-3 transition-all ${
              isClickable ? 'cursor-pointer hover:shadow-md' : ''
            } ${isActive ? 'ring-primary ring-2 ring-offset-2' : ''}`}
            onClick={() => onStatClick?.(card.key)}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={(e) => {
              if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                onStatClick?.(card.key)
              }
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${card.bgClass}`}
              >
                <Icon className={`h-4 w-4 ${card.iconClass}`} aria-hidden="true" />
              </div>
              <div>
                <p className="text-foreground text-xl font-bold">{card.value}</p>
                <p className="text-muted-foreground text-xs">{card.label}</p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
