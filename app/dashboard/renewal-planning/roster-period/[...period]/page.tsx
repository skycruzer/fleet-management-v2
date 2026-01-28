/**
 * Roster Period Detail Page
 * Shows all renewal plans for a specific roster period
 *
 * Features:
 * - List of all pilots with renewals in this period
 * - Category breakdown
 * - Capacity utilization
 * - Ability to reschedule renewals
 */

import { ArrowLeft, Calendar, Users, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getRosterPeriodCapacity,
  getRenewalsByRosterPeriod,
} from '@/lib/services/certification-renewal-planning-service'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils/date-utils'

interface PageProps {
  params: Promise<{ period: string[] }>
}

export default async function RosterPeriodDetailPage({ params }: PageProps) {
  const { period: periodArray } = await params

  // Join the catch-all route segments (e.g., ["RP12", "2025"] -> "RP12/2025")
  const period = periodArray.join('/')

  // Get capacity summary and renewals
  const summary = await getRosterPeriodCapacity(period)

  if (!summary) {
    notFound()
  }

  const renewals = await getRenewalsByRosterPeriod(period)

  // Group renewals by category
  const renewalsByCategory = renewals.reduce(
    (acc, renewal) => {
      const category = renewal.check_type?.category || 'Unknown'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(renewal)
      return acc
    },
    {} as Record<string, typeof renewals>
  )

  const utilizationColor =
    summary.utilizationPercentage > 80
      ? 'bg-red-500/10 border-red-500/20'
      : summary.utilizationPercentage > 60
        ? 'bg-amber-500/10 border-amber-500/20'
        : 'bg-emerald-500/10 border-emerald-500/20'

  const badgeColor =
    summary.utilizationPercentage > 80
      ? 'bg-red-600 text-white'
      : summary.utilizationPercentage > 60
        ? 'bg-yellow-600 text-white'
        : 'bg-green-600 text-white'

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/renewal-planning">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Planning
            </Button>
          </Link>
          <div>
            <h1 className="text-foreground text-3xl font-bold">{summary.rosterPeriod}</h1>
            <p className="text-muted-foreground mt-1">
              {formatDate(summary.periodStartDate)} - {formatDate(summary.periodEndDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={`border-2 p-6 ${utilizationColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Renewals</p>
              <p className="text-foreground text-2xl font-bold">
                {summary.totalPlannedRenewals} / {summary.totalCapacity}
              </p>
            </div>
            <Calendar className="text-primary h-8 w-8" />
          </div>
        </Card>

        <Card className={`border-2 p-6 ${utilizationColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Utilization</p>
              <p className="text-foreground text-2xl font-bold">
                {Math.round(summary.utilizationPercentage)}%
              </p>
            </div>
            <Badge className={badgeColor}>
              {summary.utilizationPercentage > 80
                ? 'High'
                : summary.utilizationPercentage > 60
                  ? 'Medium'
                  : 'Good'}
            </Badge>
          </div>
        </Card>

        <Card className="border-2 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Categories</p>
              <p className="text-foreground text-2xl font-bold">
                {Object.keys(renewalsByCategory).length}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* High Utilization Warning */}
      {summary.utilizationPercentage > 80 && (
        <Card className="border-red-500/20 bg-red-500/10 p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="mt-1 h-6 w-6 text-red-400" />
            <div>
              <h3 className="font-semibold text-red-400">High Capacity Utilization</h3>
              <p className="mt-1 text-sm text-red-400">
                This roster period has {Math.round(summary.utilizationPercentage)}% utilization.
                Consider rescheduling some renewals to other periods to avoid bottlenecks.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Category Breakdown */}
      <Card className="p-6">
        <h2 className="text-foreground mb-4 text-xl font-semibold">Capacity by Category</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(summary.categoryBreakdown).map(([category, data]) => {
            const categoryUtilization =
              data.capacity > 0 ? (data.plannedCount / data.capacity) * 100 : 0
            const categoryColor =
              categoryUtilization > 80
                ? 'bg-red-500/10 border-red-500/20'
                : categoryUtilization > 60
                  ? 'bg-amber-500/10 border-amber-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20'

            return (
              <Card key={category} className={`border-2 p-4 ${categoryColor}`}>
                <h3 className="text-foreground mb-2 font-semibold">{category}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Capacity</span>
                  <span className="text-foreground font-medium">
                    {data.plannedCount} / {data.capacity}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                    <div
                      className={`h-full ${
                        categoryUtilization > 80
                          ? 'bg-red-600'
                          : categoryUtilization > 60
                            ? 'bg-yellow-600'
                            : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(categoryUtilization, 100)}%` }}
                    />
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {Math.round(categoryUtilization)}% utilized
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      </Card>

      {/* Renewals by Category */}
      {Object.entries(renewalsByCategory).map(([category, categoryRenewals]) => (
        <Card key={category} className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-foreground text-xl font-semibold">{category}</h2>
            <Badge variant="outline">{categoryRenewals.length} renewals</Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pilot</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Check Type</TableHead>
                  <TableHead>Original Expiry</TableHead>
                  <TableHead>Planned Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryRenewals.map((renewal) => (
                  <TableRow key={renewal.id}>
                    <TableCell className="font-medium">
                      {renewal.pilot
                        ? `${renewal.pilot.first_name} ${renewal.pilot.last_name}`
                        : 'Unknown'}
                    </TableCell>
                    <TableCell>{renewal.pilot?.employee_id || 'N/A'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{renewal.check_type?.check_code}</p>
                        <p className="text-muted-foreground text-xs">
                          {renewal.check_type?.check_description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {renewal.original_expiry_date
                        ? formatDate(renewal.original_expiry_date)
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {renewal.planned_renewal_date
                        ? formatDate(renewal.planned_renewal_date)
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          renewal.priority && renewal.priority >= 7 ? 'destructive' : 'secondary'
                        }
                      >
                        {renewal.priority || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          renewal.status === 'confirmed'
                            ? 'default'
                            : renewal.status === 'completed'
                              ? 'outline'
                              : 'secondary'
                        }
                      >
                        {renewal.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ))}

      {/* Empty State */}
      {renewals.length === 0 && (
        <Card className="p-12 text-center">
          <Calendar className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="text-foreground mb-2 text-lg font-semibold">No Renewals Planned</h3>
          <p className="text-muted-foreground">
            There are no certification renewals planned for this roster period yet.
          </p>
        </Card>
      )}
    </div>
  )
}
