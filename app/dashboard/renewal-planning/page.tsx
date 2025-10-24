/**
 * Renewal Planning Dashboard
 * Main page for viewing and managing certification renewal plans
 *
 * Features:
 * - Timeline view of 13 roster periods
 * - Category filtering
 * - Capacity indicators
 * - Generate/regenerate planning
 */

import { Calendar, RefreshCw, Download, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRosterPeriodCapacity } from '@/lib/services/certification-renewal-planning-service'

export const dynamic = 'force-dynamic'

async function getRosterPeriodSummaries() {
  const supabase = await createClient()

  // Get all roster periods
  const { data: periods } = await supabase
    .from('roster_period_capacity')
    .select('roster_period')
    .order('period_start_date')
    .limit(13)

  if (!periods) return []

  // Get capacity summaries for each period
  const summaries = await Promise.all(
    periods.map(async (p) => {
      const summary = await getRosterPeriodCapacity(p.roster_period)
      return summary
    })
  )

  return summaries.filter((s) => s !== null)
}

// Removed getTotalPlans - not used in current implementation

export default async function RenewalPlanningPage() {
  const summaries = await getRosterPeriodSummaries()

  const highRiskPeriods = summaries.filter((s) => s!.utilizationPercentage > 80)
  const totalCapacity = summaries.reduce((sum, s) => sum + s!.totalCapacity, 0)
  const totalPlanned = summaries.reduce((sum, s) => sum + s!.totalPlannedRenewals, 0)
  const overallUtilization = totalCapacity > 0 ? (totalPlanned / totalCapacity) * 100 : 0

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold">Certification Renewal Planning</h1>
          <p className="text-muted-foreground mt-1">
            Manage and distribute pilot certification renewals across roster periods
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/api/renewal-planning/export" target="_blank">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </Link>
          <Link href="/dashboard/renewal-planning/generate">
            <Button size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Planned</p>
              <p className="text-foreground text-2xl font-bold">{totalPlanned}</p>
            </div>
            <Calendar className="text-primary h-8 w-8" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Overall Utilization</p>
              <p className="text-foreground text-2xl font-bold">
                {Math.round(overallUtilization)}%
              </p>
            </div>
            <Badge
              className={
                overallUtilization > 80
                  ? 'bg-red-600 text-white'
                  : overallUtilization > 60
                    ? 'bg-yellow-600 text-white'
                    : 'bg-green-600 text-white'
              }
            >
              {overallUtilization > 80 ? 'High' : overallUtilization > 60 ? 'Medium' : 'Good'}
            </Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Roster Periods</p>
              <p className="text-foreground text-2xl font-bold">{summaries.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">High Risk Periods</p>
              <p className="text-foreground text-2xl font-bold">{highRiskPeriods.length}</p>
            </div>
            {highRiskPeriods.length > 0 && <AlertTriangle className="h-8 w-8 text-red-600" />}
          </div>
        </Card>
      </div>

      {/* High Risk Alert */}
      {highRiskPeriods.length > 0 && (
        <Card className="border-red-200 bg-red-50 p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="mt-1 h-6 w-6 text-red-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">High Capacity Utilization</h3>
              <p className="mt-1 text-sm text-red-700">
                {highRiskPeriods.length} roster period{highRiskPeriods.length > 1 ? 's' : ''} have
                utilization above 80%:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {highRiskPeriods.map((period) => (
                  <Link
                    key={period!.rosterPeriod}
                    href={`/dashboard/renewal-planning/roster-period/${period!.rosterPeriod}`}
                  >
                    <Badge className="bg-red-600 text-white hover:bg-red-700">
                      {period!.rosterPeriod} - {Math.round(period!.utilizationPercentage)}%
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Roster Period Timeline */}
      <Card className="p-6">
        <h2 className="text-foreground mb-6 text-xl font-semibold">Roster Period Distribution</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {summaries.map((summary) => {
            if (!summary) return null

            const utilizationColor =
              summary.utilizationPercentage > 80
                ? 'bg-red-100 border-red-300'
                : summary.utilizationPercentage > 60
                  ? 'bg-yellow-100 border-yellow-300'
                  : 'bg-green-100 border-green-300'

            const badgeColor =
              summary.utilizationPercentage > 80
                ? 'bg-red-600 text-white'
                : summary.utilizationPercentage > 60
                  ? 'bg-yellow-600 text-white'
                  : 'bg-green-600 text-white'

            return (
              <Link
                key={summary.rosterPeriod}
                href={`/dashboard/renewal-planning/roster-period/${summary.rosterPeriod}`}
              >
                <Card className={`border-2 p-4 transition-all hover:shadow-md ${utilizationColor}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-foreground font-semibold">{summary.rosterPeriod}</h3>
                    <Badge className={badgeColor}>
                      {Math.round(summary.utilizationPercentage)}%
                    </Badge>
                  </div>

                  <p className="text-muted-foreground mb-3 text-xs">
                    {summary.periodStartDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    -{' '}
                    {summary.periodEndDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>

                  <div className="space-y-2">
                    {Object.entries(summary.categoryBreakdown)
                      .slice(0, 4)
                      .map(([category, data]) => (
                        <div key={category} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate">{category}</span>
                          <span className="text-foreground font-medium">
                            {data.plannedCount}/{data.capacity}
                          </span>
                        </div>
                      ))}
                  </div>

                  <div className="border-border mt-3 border-t pt-3">
                    <p className="text-foreground text-sm font-semibold">
                      Total: {summary.totalPlannedRenewals} / {summary.totalCapacity}
                    </p>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </Card>

      {/* Help Text */}
      <Card className="bg-blue-50 p-6">
        <h3 className="font-semibold text-blue-900">How to Use Renewal Planning</h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-700">
          <li>
            • <strong>Click a roster period</strong> to see detailed renewal schedule
          </li>
          <li>
            • <strong>Green</strong> = Good utilization (&lt;60%), <strong>Yellow</strong> = Medium
            (60-80%), <strong>Red</strong> = High (&gt;80%)
          </li>
          <li>
            • <strong>Generate Plan</strong> to create or update renewal schedule for all pilots
          </li>
          <li>• Capacity limits: Medical (4), Flight (4), Simulator (6), Ground (8) per period</li>
        </ul>
      </Card>
    </div>
  )
}
