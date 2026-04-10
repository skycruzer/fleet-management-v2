'use client'

/**
 * Period Detail Panel Component
 *
 * Inline panel for viewing roster period renewal details
 * Eliminates need for page navigation - shows in dialog/sheet
 *
 * Features:
 * - Category breakdown with utilization bars
 * - Paginated renewal list
 * - Quick actions (export, email)
 */

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/date-utils'
import { ExportPDFButton } from './export-pdf-button'
import { EmailRenewalPlanButton } from './email-renewal-plan-button'
import {
  getUtilizationStatus,
  getUtilizationColorClass,
  calculateUtilization,
} from '@/lib/utils/category-capacity-utils'

interface RenewalPlan {
  id: string
  pilot: {
    id: string
    first_name: string
    last_name: string
    employee_id: string
    role: string
    seniority_number: number
  } | null
  check_type: {
    id: string
    check_code: string
    check_description: string
    category: string
  } | null
  planned_renewal_date: string
  status: string
  priority: number
}

interface CategoryBreakdown {
  plannedCount: number
  capacity: number
}

interface PeriodDetailPanelProps {
  isOpen: boolean
  onClose: () => void
  rosterPeriod: string
  periodStartDate: Date
  periodEndDate: Date
  totalPlannedRenewals: number
  totalCapacity: number
  utilizationPercentage: number
  categoryBreakdown: Record<string, CategoryBreakdown>
}

export function PeriodDetailPanel({
  isOpen,
  onClose,
  rosterPeriod,
  periodStartDate,
  periodEndDate,
  totalPlannedRenewals,
  totalCapacity,
  utilizationPercentage,
  categoryBreakdown,
}: PeriodDetailPanelProps) {
  const [renewals, setRenewals] = useState<RenewalPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10

  // Extract year from rosterPeriod (e.g., "RP07/2026" → 2026)
  const year = parseInt(rosterPeriod.split('/')[1] || new Date().getFullYear().toString(), 10)

  // Fetch renewals when panel opens
  useEffect(() => {
    if (isOpen && rosterPeriod) {
      fetchRenewals()
    }
  }, [isOpen, rosterPeriod, page])

  const fetchRenewals = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/renewal-planning/roster-period/${encodeURIComponent(rosterPeriod)}?page=${page}&pageSize=${pageSize}`
      )
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setRenewals(result.data.renewals || [])
          setTotalPages(result.data.pagination?.totalPages || 1)
        }
      }
    } catch {
      // Silently handle errors - UI will show empty state
    } finally {
      setLoading(false)
    }
  }

  const utilizationStatus = getUtilizationStatus(utilizationPercentage)
  const utilizationColorClass = getUtilizationColorClass(utilizationPercentage)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            {rosterPeriod}
            <Badge className={utilizationColorClass}>
              {Math.round(utilizationPercentage)}% Utilization
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {formatDate(periodStartDate)} - {formatDate(periodEndDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-muted-foreground text-sm">Total Planned</p>
              <p className="text-foreground text-2xl font-bold">{totalPlannedRenewals}</p>
            </Card>
            <Card className="p-4">
              <p className="text-muted-foreground text-sm">Capacity</p>
              <p className="text-foreground text-2xl font-bold">{totalCapacity}</p>
            </Card>
            <Card className="p-4">
              <p className="text-muted-foreground text-sm">Status</p>
              <Badge
                variant="outline"
                className={
                  utilizationStatus === 'over'
                    ? 'border-[var(--color-status-high-border)] text-[var(--color-status-high)]'
                    : utilizationStatus === 'high'
                      ? 'border-[var(--color-status-high-border)] text-[var(--color-status-high)]'
                      : utilizationStatus === 'medium'
                        ? 'border-[var(--color-status-medium-border)] text-[var(--color-status-medium)]'
                        : 'border-[var(--color-status-low-border)] text-[var(--color-status-low)]'
                }
              >
                {utilizationStatus === 'over'
                  ? 'Over Capacity'
                  : utilizationStatus === 'high'
                    ? 'High Usage'
                    : utilizationStatus === 'medium'
                      ? 'Medium Usage'
                      : 'Good'}
              </Badge>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card className="p-4">
            <h3 className="text-foreground mb-4 font-semibold">Category Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(categoryBreakdown).map(([category, data]) => {
                const catUtilization = calculateUtilization(data.plannedCount, data.capacity)
                const catColorClass = getUtilizationColorClass(catUtilization)

                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-medium">{category}</span>
                      <span className="text-muted-foreground">
                        {data.plannedCount} / {data.capacity}
                      </span>
                    </div>
                    <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
                      <div
                        className={`h-full transition-all ${catColorClass}`}
                        style={{ width: `${Math.min(catUtilization, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Renewal List */}
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-foreground font-semibold">Scheduled Renewals</h3>
              <div className="flex items-center gap-2">
                <ExportPDFButton year={year} hasData={renewals.length > 0} />
                <EmailRenewalPlanButton year={year} hasData={renewals.length > 0} />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              </div>
            ) : renewals.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                No renewals scheduled for this period
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pilot</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Check Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Planned Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renewals.map((renewal) => (
                      <TableRow key={renewal.id}>
                        <TableCell className="font-medium">
                          {renewal.pilot
                            ? `${renewal.pilot.first_name} ${renewal.pilot.last_name}`
                            : 'Unknown'}
                        </TableCell>
                        <TableCell>{renewal.pilot?.employee_id || '-'}</TableCell>
                        <TableCell>{renewal.check_type?.check_code || '-'}</TableCell>
                        <TableCell>{renewal.check_type?.category || '-'}</TableCell>
                        <TableCell>{formatDate(new Date(renewal.planned_renewal_date))}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              renewal.status === 'completed'
                                ? 'border-[var(--color-status-low-border)] text-[var(--color-status-low)]'
                                : renewal.status === 'confirmed'
                                  ? 'border-[var(--color-info-border)] text-[var(--color-info)]'
                                  : 'border-muted text-muted-foreground'
                            }
                          >
                            {renewal.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
