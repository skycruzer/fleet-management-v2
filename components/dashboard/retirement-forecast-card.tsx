/**
 * Retirement Forecast Card
 * Displays pilot retirement forecasts for 2 and 5 years
 * Server component with system settings integration
 */

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, TrendingUp, Users } from 'lucide-react'
import { getRetirementForecastByRank } from '@/lib/services/retirement-forecast-service'
import { getPilotRequirements } from '@/lib/services/admin-service'

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
  try {
    // Fetch system settings first
    const requirements = await getPilotRequirements()
    const retirementAge = requirements.pilot_retirement_age

    // Get forecast data with the correct retirement age
    const forecastData = await getRetirementForecastByRank(retirementAge).catch((error) => {
      console.error('Error fetching retirement forecast:', error)
      return {
        twoYears: { captains: 0, firstOfficers: 0, total: 0, captainsList: [], firstOfficersList: [] },
        fiveYears: { captains: 0, firstOfficers: 0, total: 0, captainsList: [], firstOfficersList: [] },
      }
    })

    return (
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <h3 className="text-sm font-semibold text-foreground">Retirement Forecast</h3>
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
                <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
                <h4 className="text-xs font-medium text-foreground">Next 2 Years</h4>
              </div>
              <span className="text-lg font-bold text-orange-600">
                {forecastData.twoYears.total}
              </span>
            </div>

            {/* Captain List */}
            {forecastData.twoYears.captainsList.length > 0 && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-2">
                <div className="mb-1 flex items-center space-x-1">
                  <Users className="h-3 w-3 text-orange-700" />
                  <p className="text-xs font-medium text-orange-700">
                    Captains ({forecastData.twoYears.captains})
                  </p>
                </div>
                <div className="space-y-0.5">
                  {forecastData.twoYears.captainsList.map((pilot: any) => (
                    <div key={pilot.id} className="text-xs text-orange-900">
                      <span className="font-medium">{pilot.name.split(' ').map((n: string) => n[0]).join('')}</span>
                      <span className="ml-1 text-orange-700">
                        ({formatTimeUntilRetirement(pilot.monthsUntilRetirement)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* First Officer List */}
            {forecastData.twoYears.firstOfficersList.length > 0 && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-2">
                <div className="mb-1 flex items-center space-x-1">
                  <Users className="h-3 w-3 text-orange-700" />
                  <p className="text-xs font-medium text-orange-700">
                    First Officers ({forecastData.twoYears.firstOfficers})
                  </p>
                </div>
                <div className="space-y-0.5">
                  {forecastData.twoYears.firstOfficersList.map((pilot: any) => (
                    <div key={pilot.id} className="text-xs text-orange-900">
                      <span className="font-medium">{pilot.name.split(' ').map((n: string) => n[0]).join('')}</span>
                      <span className="ml-1 text-orange-700">
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
                <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                <h4 className="text-xs font-medium text-foreground">Years 3-5</h4>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {forecastData.fiveYears.total - forecastData.twoYears.total}
              </span>
            </div>

            {/* Captain List (Years 3-5 only) */}
            {forecastData.fiveYears.captainsList.filter((p: any) => p.monthsUntilRetirement > 24).length > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
                <div className="mb-1 flex items-center space-x-1">
                  <Users className="h-3 w-3 text-blue-700" />
                  <p className="text-xs font-medium text-blue-700">
                    Captains ({forecastData.fiveYears.captains - forecastData.twoYears.captains})
                  </p>
                </div>
                <div className="space-y-0.5">
                  {forecastData.fiveYears.captainsList
                    .filter((p: any) => p.monthsUntilRetirement > 24)
                    .map((pilot: any) => (
                      <div key={pilot.id} className="text-xs text-blue-900">
                        <span className="font-medium">{pilot.name.split(' ').map((n: string) => n[0]).join('')}</span>
                        <span className="ml-1 text-blue-700">
                          ({formatTimeUntilRetirement(pilot.monthsUntilRetirement)})
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* First Officer List (Years 3-5 only) */}
            {forecastData.fiveYears.firstOfficersList.filter((p: any) => p.monthsUntilRetirement > 24).length > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
                <div className="mb-1 flex items-center space-x-1">
                  <Users className="h-3 w-3 text-blue-700" />
                  <p className="text-xs font-medium text-blue-700">
                    First Officers ({forecastData.fiveYears.firstOfficers - forecastData.twoYears.firstOfficers})
                  </p>
                </div>
                <div className="space-y-0.5">
                  {forecastData.fiveYears.firstOfficersList
                    .filter((p: any) => p.monthsUntilRetirement > 24)
                    .map((pilot: any) => (
                      <div key={pilot.id} className="text-xs text-blue-900">
                        <span className="font-medium">{pilot.name.split(' ').map((n: string) => n[0]).join('')}</span>
                        <span className="ml-1 text-blue-700">
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
  } catch (error) {
    console.error('Error in RetirementForecastCard:', error)
    // Return error state card
    return (
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-foreground">Retirement Forecast</h3>
          </div>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Unable to load retirement forecast data. Please try refreshing the page.
          </p>
        </div>
      </Card>
    )
  }
}
