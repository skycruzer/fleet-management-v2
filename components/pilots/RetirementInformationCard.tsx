/**
 * Retirement Information Card Component
 * Comprehensive retirement details card for pilot profile
 * Displays countdown, timeline progress, years of service, and warnings
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, Calendar, TrendingUp, AlertTriangle } from 'lucide-react'
import {
  calculateRetirementCountdown,
  formatRetirementCountdown,
  formatRetirementDate,
  getRetirementStatus,
  type RetirementCountdown,
} from '@/lib/utils/retirement-utils'

interface RetirementInformationCardProps {
  dateOfBirth: string | null
  commencementDate: string | null
  retirementAge: number
  pilotName: string
}

function calculateYearsOfService(commencementDate: string | null): number | null {
  if (!commencementDate) return null

  const start = new Date(commencementDate)
  const now = new Date()
  const years = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

  return Math.round(years * 10) / 10 // Round to 1 decimal place
}

export function RetirementInformationCard({
  dateOfBirth,
  commencementDate,
  retirementAge,
  pilotName,
}: RetirementInformationCardProps) {
  // No date of birth - cannot calculate retirement
  if (!dateOfBirth) {
    return (
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5 text-purple-600" />
            Retirement Information
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm italic">
            Date of birth not available - retirement information cannot be calculated
          </p>
        </CardContent>
      </Card>
    )
  }

  const countdown = calculateRetirementCountdown(dateOfBirth, retirementAge)
  const yearsOfService = calculateYearsOfService(commencementDate)
  const status = getRetirementStatus(countdown)

  if (!countdown) return null

  // Already retired
  if (countdown.isRetired) {
    return (
      <Card className="border-border bg-muted">
        <CardHeader>
          <h3 className="text-muted-foreground flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5" />
            Retirement Status
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {pilotName} has reached the standard retirement age of {retirementAge} years.
          </p>
          {yearsOfService && (
            <p className="text-foreground mt-2 text-sm font-medium">
              Years of Service: {yearsOfService} years
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  // Calculate career progress (0-100% based on actual service period to retirement)
  const birthDate = new Date(dateOfBirth)
  const currentAge = new Date().getFullYear() - birthDate.getFullYear()

  // Use actual commencement date if available, otherwise use age 18
  let careerStartAge = 18
  let careerStartDate = null

  if (commencementDate) {
    careerStartDate = new Date(commencementDate)
    const birthYear = birthDate.getFullYear()
    const commencementYear = careerStartDate.getFullYear()
    careerStartAge = commencementYear - birthYear
  }

  const totalCareerYears = retirementAge - careerStartAge
  const yearsCompleted = currentAge - careerStartAge
  const careerProgress = Math.min(100, Math.max(0, (yearsCompleted / totalCareerYears) * 100))

  // Warning thresholds
  const isUrgent = countdown.totalDays <= 365 // Less than 1 year
  const isWarning = countdown.totalDays <= 730 // Less than 2 years

  return (
    <Card
      className={
        isUrgent
          ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
          : isWarning
            ? 'border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30'
            : ''
      }
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5 text-purple-600" />
            Retirement Information
          </h3>
          <Badge variant="outline" className="text-xs">
            Retirement Age: {retirementAge}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Countdown Display */}
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30">
          <div className="mb-2 text-sm font-medium text-purple-700 dark:text-purple-300">
            Time Until Retirement
          </div>
          <div className="text-4xl font-bold text-purple-900 dark:text-purple-100">
            {formatRetirementCountdown(countdown)}
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-purple-600 dark:text-purple-300">
            <Calendar className="h-4 w-4" />
            Retirement Date:{' '}
            <span className="font-semibold">{formatRetirementDate(countdown.retirementDate)}</span>
          </div>
        </div>

        {/* Timeline Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Career Timeline</span>
            <span className="text-muted-foreground">{careerProgress.toFixed(0)}% complete</span>
          </div>
          <Progress value={careerProgress} className="h-3" />
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>
              {commencementDate
                ? `Started: ${new Date(commencementDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}`
                : `Age ${careerStartAge}`}
            </span>
            <span>Current Age: {currentAge}</span>
            <span>Retirement Age: {retirementAge}</span>
          </div>
        </div>

        {/* Years of Service */}
        {yearsOfService && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Years of Service
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {yearsOfService} years
              </div>
            </div>
          </div>
        )}

        {/* Warning Alerts */}
        {isUrgent && (
          <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-100 p-4 dark:border-red-800 dark:bg-red-950">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400"
              aria-hidden="true"
            />
            <div>
              <div className="font-semibold text-red-900 dark:text-red-100">
                Urgent: Retirement Within 1 Year
              </div>
              <p className="mt-1 text-sm text-red-700 dark:text-red-200">
                {pilotName} will retire in less than 1 year. Begin succession planning and
                recruitment immediately to ensure smooth transition.
              </p>
            </div>
          </div>
        )}

        {isWarning && !isUrgent && (
          <div className="flex items-start gap-3 rounded-lg border border-orange-300 bg-orange-100 p-4 dark:border-orange-800 dark:bg-orange-950">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 text-orange-600 dark:text-orange-400"
              aria-hidden="true"
            />
            <div>
              <div className="font-semibold text-orange-900 dark:text-orange-100">
                Warning: Retirement Within 2 Years
              </div>
              <p className="mt-1 text-sm text-orange-700 dark:text-orange-200">
                {pilotName} will retire in less than 2 years. Consider succession planning and
                knowledge transfer initiatives.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
