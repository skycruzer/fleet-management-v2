/**
 * Pilot Info Card Component
 *
 * Reusable card section for labeled key-value display with icon header.
 * Replaces the repeated Card + header + InfoRow pattern in pilot-overview-tab.tsx.
 *
 * Developer: Maurice Rondeau
 * @date February 2026
 */

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface InfoItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
}

interface PilotInfoCardProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  items?: InfoItem[]
  children?: React.ReactNode
  columns?: 1 | 2
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-muted mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
        <Icon className="text-muted-foreground h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <p className="text-foreground mt-0.5 truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}

export function PilotInfoCard({
  title,
  icon: Icon,
  iconBg,
  iconColor,
  items,
  children,
  columns = 1,
}: PilotInfoCardProps) {
  return (
    <Card className="h-full p-6 transition-all hover:shadow-md">
      <div className="mb-4 flex items-center gap-3 border-b pb-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        <h3 className="text-foreground text-lg font-semibold">{title}</h3>
      </div>

      {items && items.length > 0 && (
        <div className={cn(columns === 2 ? 'grid grid-cols-1 gap-4 md:grid-cols-2' : 'space-y-4')}>
          {items.map((item) => (
            <InfoRow key={item.label} icon={item.icon} label={item.label} value={item.value} />
          ))}
        </div>
      )}

      {children && <div className={cn(items && items.length > 0 && 'mt-4')}>{children}</div>}
    </Card>
  )
}
