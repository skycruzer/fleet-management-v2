/**
 * Retirement Forecast Card
 * Displays pilot retirement forecasts for 2 and 5 years.
 * Server component with system settings integration.
 */

import { Badge } from '@/components/ui/badge'
import { Clock, TrendingUp, Users, PartyPopper, AlertTriangle } from 'lucide-react'
import { getRetirementForecastByRank } from '@/lib/services/retirement-forecast-service'
import { getPilotRequirements } from '@/lib/services/admin-service'
import { cn } from '@/lib/utils'
import { DashboardCard } from './dashboard-card'
import { EmptyState } from './empty-state'

interface RetirementPilot {
  id: string
  name: string
  monthsUntilRetirement: number
}

interface ForecastPeriod {
  captains: number
  firstOfficers: number
  total: number
  captainsList: RetirementPilot[]
  firstOfficersList: RetirementPilot[]
}

interface ForecastData {
  twoYears: ForecastPeriod
  fiveYears: ForecastPeriod
}

/** Format time until retirement — "Xy Ymo" if >1 year, otherwise "Xmo". */
function formatTimeUntilRetirement(months: number): string {
  if (months >= 12) {
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    return remainingMonths > 0 ? `${years}y ${remainingMonths}mo` : `${years}y`
  }
  return `${months}mo`
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
}

const TONE_CLASSES = {
  warning: { box: 'border-warning/30 bg-[var(--color-warning-muted)]', text: 'text-warning' },
  info: {
    box: 'border-[var(--color-info-border)] bg-[var(--color-info-bg)]',
    text: 'text-[var(--color-info)]',
  },
} as const

interface ForecastListProps {
  tone: keyof typeof TONE_CLASSES
  label: string
  count: number
  pilots: RetirementPilot[]
}

function ForecastList({ tone, label, count, pilots }: ForecastListProps) {
  if (pilots.length === 0) return null
  const c = TONE_CLASSES[tone]

  return (
    <div className={cn('rounded-lg border p-2', c.box)}>
      <div className="mb-1 flex items-center gap-1">
        <Users className={cn('h-3 w-3', c.text)} aria-hidden="true" />
        <p className={cn('text-xs font-medium', c.text)}>
          {label} ({count})
        </p>
      </div>
      <div className="space-y-0.5">
        {pilots.map((pilot) => (
          <div key={pilot.id} className="text-foreground text-xs">
            <span className="font-medium">{initials(pilot.name)}</span>
            <span className={cn('ml-1', c.text)}>
              ({formatTimeUntilRetirement(pilot.monthsUntilRetirement)})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export async function RetirementForecastCard() {
  let retirementAge = 65
  let forecastData: ForecastData = {
    twoYears: { captains: 0, firstOfficers: 0, total: 0, captainsList: [], firstOfficersList: [] },
    fiveYears: { captains: 0, firstOfficers: 0, total: 0, captainsList: [], firstOfficersList: [] },
  }
  let fetchError = false

  try {
    const requirements = await getPilotRequirements()
    retirementAge = requirements.pilot_retirement_age
    forecastData = await getRetirementForecastByRank(retirementAge)
  } catch (error) {
    console.error('Error in RetirementForecastCard:', error)
    fetchError = true
  }

  // Error state
  if (fetchError) {
    return (
      <DashboardCard title="Retirement Forecast" icon={Clock}>
        <div className="flex items-center gap-2 py-4" role="alert">
          <AlertTriangle className="text-warning h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <p className="text-muted-foreground text-sm">
            Unable to load retirement forecast — try refreshing.
          </p>
        </div>
      </DashboardCard>
    )
  }

  const ageBadge = (
    <Badge variant="outline" className="text-xs">
      Age {retirementAge}
    </Badge>
  )

  // Empty state when no retirements forecasted in 5 years
  if (forecastData.fiveYears.total === 0) {
    return (
      <DashboardCard title="Retirement Forecast" icon={Clock} headerRight={ageBadge}>
        <EmptyState
          icon={PartyPopper}
          title="No retirements forecasted"
          description={`No pilots are expected to reach age ${retirementAge} within the next 5 years.`}
          className="py-6"
        />
      </DashboardCard>
    )
  }

  const yearsThreeToFive = forecastData.fiveYears.total - forecastData.twoYears.total
  const captains35 = forecastData.fiveYears.captainsList.filter((p) => p.monthsUntilRetirement > 24)
  const firstOfficers35 = forecastData.fiveYears.firstOfficersList.filter(
    (p) => p.monthsUntilRetirement > 24
  )

  return (
    <DashboardCard title="Retirement Forecast" icon={Clock} headerRight={ageBadge}>
      <div className="space-y-3">
        {/* Next 2 Years */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-warning h-3.5 w-3.5" aria-hidden="true" />
              <h4 className="text-foreground text-xs font-medium">Next 2 Years</h4>
            </div>
            <span className="text-warning text-lg font-bold tabular-nums">
              {forecastData.twoYears.total}
            </span>
          </div>
          <ForecastList
            tone="warning"
            label="Captains"
            count={forecastData.twoYears.captains}
            pilots={forecastData.twoYears.captainsList}
          />
          <ForecastList
            tone="warning"
            label="First Officers"
            count={forecastData.twoYears.firstOfficers}
            pilots={forecastData.twoYears.firstOfficersList}
          />
        </div>

        {/* Years 3-5 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--color-info)]" aria-hidden="true" />
              <h4 className="text-foreground text-xs font-medium">Years 3-5</h4>
            </div>
            <span className="text-lg font-bold text-[var(--color-info)] tabular-nums">
              {yearsThreeToFive}
            </span>
          </div>
          <ForecastList
            tone="info"
            label="Captains"
            count={forecastData.fiveYears.captains - forecastData.twoYears.captains}
            pilots={captains35}
          />
          <ForecastList
            tone="info"
            label="First Officers"
            count={forecastData.fiveYears.firstOfficers - forecastData.twoYears.firstOfficers}
            pilots={firstOfficers35}
          />
        </div>
      </div>
    </DashboardCard>
  )
}
