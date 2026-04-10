// Maurice Rondeau — Activity Code Legend
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityCode {
  code: string
  name: string
  category: string
  color: string
}

interface ActivityCodeLegendProps {
  codes: ActivityCode[]
  className?: string
}

const CATEGORY_ORDER = [
  'FLIGHT',
  'DAY_OFF',
  'TRAINING',
  'LEAVE',
  'RESERVE',
  'TRANSPORT',
  'ACCOMMODATION',
  'OFFICE',
  'MEDICAL',
  'OTHER',
]

const CATEGORY_LABELS: Record<string, string> = {
  FLIGHT: 'Flights',
  DAY_OFF: 'Day Off',
  TRAINING: 'Training',
  LEAVE: 'Leave',
  RESERVE: 'Reserve',
  TRANSPORT: 'Transport',
  ACCOMMODATION: 'Accommodation',
  OFFICE: 'Office',
  MEDICAL: 'Medical',
  OTHER: 'Other',
}

// Map Tailwind class names to inline-safe colors for the legend swatches
const COLOR_MAP: Record<string, string> = {
  'bg-blue-100': '#dbeafe',
  'bg-gray-100': '#f3f4f6',
  'bg-green-100': '#dcfce7',
  'bg-amber-100': '#fef3c7',
  'bg-purple-100': '#f3e8ff',
  'bg-slate-200': '#e2e8f0',
  'bg-teal-100': '#ccfbf1',
  'bg-indigo-100': '#e0e7ff',
  'bg-red-100': '#fee2e2',
  'bg-yellow-100': '#fef9c3',
}

export function ActivityCodeLegend({ codes, className }: ActivityCodeLegendProps) {
  const [isOpen, setIsOpen] = useState(false)

  const grouped = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      const items = codes.filter((c) => c.category === cat)
      if (items.length > 0) acc[cat] = items
      return acc
    },
    {} as Record<string, ActivityCode[]>
  )

  return (
    <div className={cn('bg-card rounded-lg border', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2 px-4 py-3 text-sm font-medium"
      >
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        Activity Code Legend
        <span className="text-muted-foreground text-xs">({codes.length} codes)</span>
      </button>

      {isOpen && (
        <div className="grid grid-cols-2 gap-4 border-t px-4 py-3 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wider uppercase">
                {CATEGORY_LABELS[category] || category}
              </h4>
              <div className="space-y-1">
                {items.map((code) => (
                  <div key={code.code} className="flex items-center gap-1.5 text-xs">
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-sm border"
                      style={{ backgroundColor: COLOR_MAP[code.color] || '#fef9c3' }}
                    />
                    <span className="font-mono font-medium">{code.code}</span>
                    <span className="text-muted-foreground truncate">{code.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
