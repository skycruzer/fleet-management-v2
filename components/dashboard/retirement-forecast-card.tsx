/**
 * Retirement Forecast Card
 * Displays pilot retirement forecasts for 2 and 5 years
 * Server component with system settings integration
 */

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, TrendingUp, Users, PartyPopper } from 'lucide-react'
import { getRetirementForecastByRank } from '@/lib/services/retirement-forecast-service'
import { getPilotRequirements } from '@/lib/services/admin-service'

/**
 * Pilot data structure for retirement forecast
 */
interface RetirementPilot {
  id: string
  name: string
  monthsUntilRetirement: number
}

/**
 * Forecast data structure
 */
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

/**
 * Format time until retirement
 * Shows "Xy Ymo" if >1 year, otherwise "Xmo"
 */
function formatTimeUntilRetirement(months: number): string {
  if (months >= 12) {
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    return remainingMonths > 0 ? `${years}y ${remainingMonths}mo` : `${years}y`
  }
  return `${months}mo`
}

export async function RetirementForecastCard() {
  // Data fetching with error handling
  let retirementAge = 65
  let forecastData: ForecastData = {
    twoYears: { captains: 0, firstOfficers: 0, total: 0, captainsList: [], firstOfficersList: [] },
    fiveYears: { captains: 0, firstOfficers: 0, total: 0, captainsList: [], firstOfficersList: [] },
  }
  let fetchError: string | null = null

  try {
    // Fetch system settings first
    const requirements = await getPilotRequirements()
    retirementAge = requirements.pilot_retirement_age

    // Get forecast data with the correct retirement age
    forecastData = await getRetirementForecastByRank(retirementAge)
  } catch (error) {
    console.error('Error in RetirementForecastCard:', error)
    fetchError = error instanceof Error ? error.message : 'Unknown error'
  }

  // Error state
  if (fetchError) {
    return (
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-[var(--color-status-medium)]" aria-hidden="true" />
            <h3 className="text-foreground text-lg font-semibold">Retirement Forecast</h3>
          </div>
        </div>
        <div
          className="rounded-lg border border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] p-4"
          role="alert"
        >
          <p className="text-sm text-[var(--color-status-medium)]">
            Unable to load retirement forecast data. Please try refreshing the page.
          </p>
        </div>
      </Card>
    )
  }

  // Empty state when no retirements forecasted in 5 years
  if (forecastData.fiveYears.total === 0) {
    return (
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-[var(--color-status-medium)]" aria-hidden="true" />
            <h3 className="text-foreground text-sm font-semibold">Retirement Forecast</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            Age {retirementAge}
          </Badge>
        </div>

        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-status-low-bg)]">
            <PartyPopper className="h-6 w-6 text-[var(--color-status-low)]" aria-hidden="true" />
          </div>
          <h4 className="text-foreground mb-1 text-sm font-semibold">No Retirements Forecasted</h4>
          <p className="text-muted-foreground max-w-[200px] text-xs">
            No pilots are expected to reach retirement age within the next 5 years.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-[var(--color-status-medium)]" />
          <h3 className="text-foreground text-sm font-semibold">Retirement Forecast</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          Age {retirementAge}
        </Badge>
      </div>

      <div className="space-y-3">
        {/* 2 Year Forecast */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--color-status-medium)]" />
              <h4 className="text-foreground text-xs font-medium">Next 2 Years</h4>
            </div>
            <span className="text-lg font-bold text-[var(--color-status-medium)]">
              {forecastData.twoYears.total}
            </span>
          </div>

          {/* Captain List */}
          {forecastData.twoYears.captainsList.length > 0 && (
            <div className="rounded-lg border border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] p-2">
              <div className="mb-1 flex items-center space-x-1">
                <Users className="h-3 w-3 text-[var(--color-status-medium)]" />
                <p className="text-xs font-medium text-[var(--color-status-medium)]">
                  Captains ({forecastData.twoYears.captains})
                </p>
              </div>
              <div className="space-y-0.5">
                {forecastData.twoYears.captainsList.map((pilot: RetirementPilot) => (
                  <div
                    key={pilot.id}
                    className="text-xs text-[var(--color-status-medium-foreground)]"
                  >
                    <span className="font-medium">
                      {pilot.name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')}
                    </span>
                    <span className="ml-1 text-[var(--color-status-medium)]">
                      ({formatTimeUntilRetirement(pilot.monthsUntilRetirement)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* First Officer List */}
          {forecastData.twoYears.firstOfficersList.length > 0 && (
            <div className="rounded-lg border border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] p-2">
              <div className="mb-1 flex items-center space-x-1">
                <Users className="h-3 w-3 text-[var(--color-status-medium)]" />
                <p className="text-xs font-medium text-[var(--color-status-medium)]">
                  First Officers ({forecastData.twoYears.firstOfficers})
                </p>
              </div>
              <div className="space-y-0.5">
                {forecastData.twoYears.firstOfficersList.map((pilot: RetirementPilot) => (
                  <div
                    key={pilot.id}
                    className="text-xs text-[var(--color-status-medium-foreground)]"
                  >
                    <span className="font-medium">
                      {pilot.name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')}
                    </span>
                    <span className="ml-1 text-[var(--color-status-medium)]">
                      ({formatTimeUntilRetirement(pilot.monthsUntilRetirement)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5 Year Forecast */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--color-info)]" />
              <h4 className="text-foreground text-xs font-medium">Years 3-5</h4>
            </div>
            <span className="text-lg font-bold text-[var(--color-info)]">
              {forecastData.fiveYears.total - forecastData.twoYears.total}
            </span>
          </div>

          {/* Captain List (Years 3-5 only) */}
          {forecastData.fiveYears.captainsList.filter(
            (p: RetirementPilot) => p.monthsUntilRetirement > 24
          ).length > 0 && (
            <div className="rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-2">
              <div className="mb-1 flex items-center space-x-1">
                <Users className="h-3 w-3 text-[var(--color-info)]" />
                <p className="text-xs font-medium text-[var(--color-info)]">
                  Captains ({forecastData.fiveYears.captains - forecastData.twoYears.captains})
                </p>
              </div>
              <div className="space-y-0.5">
                {forecastData.fiveYears.captainsList
                  .filter((p: RetirementPilot) => p.monthsUntilRetirement > 24)
                  .map((pilot: RetirementPilot) => (
                    <div key={pilot.id} className="text-xs text-[var(--color-info-foreground)]">
                      <span className="font-medium">
                        {pilot.name
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')}
                      </span>
                      <span className="ml-1 text-[var(--color-info)]">
                        ({formatTimeUntilRetirement(pilot.monthsUntilRetirement)})
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* First Officer List (Years 3-5 only) */}
          {forecastData.fiveYears.firstOfficersList.filter(
            (p: RetirementPilot) => p.monthsUntilRetirement > 24
          ).length > 0 && (
            <div className="rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-2">
              <div className="mb-1 flex items-center space-x-1">
                <Users className="h-3 w-3 text-[var(--color-info)]" />
                <p className="text-xs font-medium text-[var(--color-info)]">
                  First Officers (
                  {forecastData.fiveYears.firstOfficers - forecastData.twoYears.firstOfficers})
                </p>
              </div>
              <div className="space-y-0.5">
                {forecastData.fiveYears.firstOfficersList
                  .filter((p: RetirementPilot) => p.monthsUntilRetirement > 24)
                  .map((pilot: RetirementPilot) => (
                    <div key={pilot.id} className="text-xs text-[var(--color-info-foreground)]">
                      <span className="font-medium">
                        {pilot.name
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')}
                      </span>
                      <span className="ml-1 text-[var(--color-info)]">
                        ({formatTimeUntilRetirement(pilot.monthsUntilRetirement)})
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Info Footer - Removed to save space */}
      </div>
    </Card>
  )
}
