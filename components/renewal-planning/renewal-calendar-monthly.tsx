/**
 * Monthly Calendar View for Renewal Planning
 * Shows detailed pilot-level renewals for a specific roster period
 */

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils/date-utils'
import { Calendar, Users, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PilotInfo {
  first_name: string
  last_name: string
  employee_id: string
  rank?: string
}

interface CheckTypeInfo {
  check_code: string
  check_description: string
  category: string
}

interface RenewalItem {
  id: string
  pilot: PilotInfo
  check_type: CheckTypeInfo
  planned_renewal_date: string
  original_expiry_date: string
  roster_period: string
  priority?: number
  status: string
}

interface RenewalCalendarMonthlyProps {
  renewals: RenewalItem[]
  rosterPeriod: string
  periodStartDate: Date
  periodEndDate: Date
  totalCapacity: number
  utilizationPercentage: number
}

export function RenewalCalendarMonthly({
  renewals,
  rosterPeriod,
  periodStartDate,
  periodEndDate,
  totalCapacity,
  utilizationPercentage,
}: RenewalCalendarMonthlyProps) {
  // Group renewals by category
  const renewalsByCategory = renewals.reduce(
    (acc, renewal) => {
      const category = renewal.check_type.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(renewal)
      return acc
    },
    {} as Record<string, RenewalItem[]>
  )

  // Sort categories alphabetically
  const sortedCategories = Object.keys(renewalsByCategory).sort()

  const getUtilizationBadge = () => {
    if (utilizationPercentage > 80) {
      return <Badge className="bg-[var(--color-status-high)] text-white">High Utilization</Badge>
    }
    if (utilizationPercentage > 60) {
      return (
        <Badge className="bg-[var(--color-status-medium)] text-white">Medium Utilization</Badge>
      )
    }
    return <Badge className="bg-[var(--color-status-low)] text-white">Good Utilization</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/renewal-planning/calendar">
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Calendar
        </Button>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-foreground text-3xl font-bold">{rosterPeriod}</h1>
        <p className="text-muted-foreground mt-1 text-lg">
          {formatDate(periodStartDate)} - {formatDate(periodEndDate)}
        </p>
      </div>

      {/* Summary Card */}
      <Card className="p-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="text-muted-foreground mb-2 flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="text-sm">Total Renewals</span>
            </div>
            <p className="text-foreground text-3xl font-bold">
              {renewals.length}{' '}
              <span className="text-muted-foreground text-lg">/ {totalCapacity}</span>
            </p>
          </div>

          <div>
            <div className="text-muted-foreground mb-2 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span className="text-sm">Utilization</span>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-foreground text-3xl font-bold">
                {Math.round(utilizationPercentage)}%
              </p>
              {getUtilizationBadge()}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground mb-2 flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="text-sm">Categories</span>
            </div>
            <p className="text-foreground text-3xl font-bold">{sortedCategories.length}</p>
          </div>
        </div>
      </Card>

      {/* Category Breakdown */}
      {sortedCategories.map((category) => {
        const categoryRenewals = renewalsByCategory[category]

        return (
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
                    <TableHead>Rank</TableHead>
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
                        {renewal.pilot.first_name} {renewal.pilot.last_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{renewal.pilot.rank || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {renewal.pilot.employee_id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{renewal.check_type.check_code}</p>
                          <p className="text-muted-foreground text-xs">
                            {renewal.check_type.check_description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(renewal.original_expiry_date)}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatDate(renewal.planned_renewal_date)}
                        </span>
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
        )
      })}

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

      {/* Help Card */}
      <Card className="bg-[var(--color-info-bg)] p-4">
        <h4 className="mb-2 font-semibold text-[var(--color-info-foreground)]">Schedule Details</h4>
        <ul className="space-y-1 text-sm text-[var(--color-info)]">
          <li>
            • <strong>Planned Date</strong>: Target date for certification renewal
          </li>
          <li>
            • <strong>Original Expiry</strong>: Current certification expiry date
          </li>
          <li>
            • <strong>Priority</strong>: Higher numbers indicate more urgent renewals
          </li>
          <li>
            • <strong>Status</strong>: Confirmed (scheduled), Pending (not finalized), Completed
            (done)
          </li>
        </ul>
      </Card>
    </div>
  )
}
