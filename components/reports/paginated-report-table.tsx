/**
 * Paginated Report Table Component
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Phase 2.3: TanStack Table integration with server-side pagination
 * Features:
 * - Server-side pagination (50 records/page default)
 * - Sorting support
 * - Column visibility toggle
 * - Responsive design
 * - Type-specific column definitions
 */

'use client'

import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type GroupingState,
  type ExpandedState,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react'
import type { ReportType, PaginationMeta } from '@/types/reports'
import { STATUS_COLORS } from '@/lib/constants/status-colors'
import { getAffectedRosterPeriods } from '@/lib/utils/roster-utils'
import { formatAustralianDate } from '@/lib/utils/date-format'

interface PaginatedReportTableProps {
  data: any[]
  reportType: ReportType
  pagination?: PaginationMeta
  onPageChange?: (page: number) => void
  isLoading?: boolean
}

export function PaginatedReportTable({
  data,
  reportType,
  pagination,
  onPageChange,
  isLoading = false,
}: PaginatedReportTableProps) {
  // Grouping state for hierarchical display
  const [grouping, setGrouping] = useState<GroupingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})

  // Define columns based on report type
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (reportType === 'leave') {
      return [
        {
          accessorFn: (row) =>
            row.name || `${row.pilot?.first_name} ${row.pilot?.last_name}` || 'N/A',
          id: 'pilot',
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              Pilot
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          ),
          cell: ({ getValue }) => <div className="font-medium">{getValue() as string}</div>,
        },
        {
          accessorFn: (row) => row.rank || row.pilot?.role || 'N/A',
          id: 'rank',
          header: 'Rank',
          enableGrouping: true,
          cell: ({ getValue }) => <div className="text-sm">{getValue() as string}</div>,
        },
        {
          accessorFn: (row) => row.request_type || row.leave_type || 'N/A',
          id: 'leave_type',
          header: 'Type',
          cell: ({ getValue }) => (
            <Badge variant="outline" className="font-mono text-xs">
              {getValue() as string}
            </Badge>
          ),
        },
        {
          accessorKey: 'submission_date',
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              Submitted
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          ),
          cell: ({ getValue }) => (
            <div className="text-sm">{formatAustralianDate(getValue() as string)}</div>
          ),
        },
        {
          accessorKey: 'start_date',
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              Start Date
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          ),
          cell: ({ getValue }) => (
            <div className="text-sm">{formatAustralianDate(getValue() as string)}</div>
          ),
        },
        {
          accessorKey: 'end_date',
          header: 'End Date',
          cell: ({ getValue }) => (
            <div className="text-sm">{formatAustralianDate(getValue() as string)}</div>
          ),
        },
        {
          accessorFn: (row) => row.workflow_status || row.status || 'N/A',
          id: 'status',
          header: 'Status',
          cell: ({ getValue }) => {
            const status = (getValue() as string).toLowerCase()
            return (
              <Badge
                variant={
                  status === 'approved'
                    ? 'default'
                    : status === 'rejected' || status === 'denied'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {status}
              </Badge>
            )
          },
        },
        {
          accessorKey: 'is_late_request',
          header: 'Late',
          cell: ({ getValue }) => <div className="text-sm">{getValue() ? 'Yes' : ''}</div>,
        },
        {
          accessorFn: (row) => {
            // Calculate roster periods dynamically from date range
            if (!row.start_date) return 'N/A'

            const startDate = new Date(row.start_date)
            const endDate = row.end_date ? new Date(row.end_date) : startDate

            try {
              const periods = getAffectedRosterPeriods(startDate, endDate)
              return periods.map((p) => p.code).join(', ')
            } catch (error) {
              console.error('Error calculating roster periods:', error)
              return row.roster_period || 'N/A'
            }
          },
          id: 'roster_period',
          header: 'Roster Period',
          enableGrouping: true,
          cell: ({ getValue }) => <div className="font-mono text-sm">{getValue() as string}</div>,
        },
      ]
    }

    if (reportType === 'flight-requests') {
      return [
        {
          accessorFn: (row) =>
            row.name || `${row.pilot?.first_name} ${row.pilot?.last_name}` || 'N/A',
          id: 'pilot',
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              Pilot
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          ),
          cell: ({ getValue }) => <div className="font-medium">{getValue() as string}</div>,
        },
        {
          accessorFn: (row) => row.rank || row.pilot?.role || 'N/A',
          id: 'rank',
          header: 'Rank',
          enableGrouping: true,
          cell: ({ getValue }) => <div className="text-sm">{getValue() as string}</div>,
        },
        {
          accessorKey: 'request_type',
          header: 'Type',
          cell: ({ getValue }) => (
            <Badge variant="outline" className="font-mono text-xs">
              {(getValue() as string) || 'N/A'}
            </Badge>
          ),
        },
        {
          accessorKey: 'start_date',
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              RDO/SDO Date
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          ),
          cell: ({ row }) => {
            const startDate = row.original.start_date
            const endDate = row.original.end_date
            return (
              <div className="text-sm">
                {startDate && endDate && startDate !== endDate
                  ? `${formatAustralianDate(startDate)} - ${formatAustralianDate(endDate)}`
                  : startDate
                    ? formatAustralianDate(startDate)
                    : 'N/A'}
              </div>
            )
          },
        },
        {
          accessorFn: (row) => {
            // Calculate roster periods dynamically from date range
            if (!row.start_date) return 'N/A'

            const startDate = new Date(row.start_date)
            const endDate = row.end_date ? new Date(row.end_date) : startDate

            try {
              const periods = getAffectedRosterPeriods(startDate, endDate)
              return periods.map((p) => p.code).join(', ')
            } catch (error) {
              console.error('Error calculating roster periods:', error)
              return row.roster_period || 'N/A'
            }
          },
          id: 'roster_periods',
          header: 'Roster Period',
          enableGrouping: true,
          cell: ({ getValue }) => <div className="text-sm font-medium">{getValue() as string}</div>,
        },
        {
          accessorFn: (row) => row.workflow_status || row.status || 'N/A',
          id: 'status',
          header: 'Status',
          cell: ({ getValue }) => {
            const status = (getValue() as string).toLowerCase()
            return (
              <Badge
                variant={
                  status === 'approved'
                    ? 'default'
                    : status === 'rejected' || status === 'denied'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {status}
              </Badge>
            )
          },
        },
      ]
    }

    if (reportType === 'leave-bids') {
      return [
        {
          accessorFn: (row: any) =>
            row.name || `${row.pilot?.first_name} ${row.pilot?.last_name}` || 'N/A',
          id: 'pilot',
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              Pilot
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          ),
          cell: ({ getValue }) => <div className="font-medium">{getValue() as string}</div>,
        },
        {
          accessorFn: (row: any) => row.rank || row.pilot?.role || 'N/A',
          id: 'rank',
          header: 'Rank',
          enableGrouping: true,
          cell: ({ getValue }) => <div className="text-sm">{getValue() as string}</div>,
        },
        {
          accessorFn: (row: any) => row.seniority || row.pilot?.seniority_number || 0,
          id: 'seniority',
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              Seniority
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          ),
          cell: ({ getValue }) => (
            <div className="text-sm font-medium">#{getValue() as number}</div>
          ),
        },
        {
          id: 'preferences',
          header: 'Preferences, Date Ranges & Roster Periods',
          cell: ({ row }) => {
            const options = row.original.leave_bid_options || []
            const optStatuses = row.original.option_statuses || {}
            if (options.length === 0)
              return <span className="text-muted-foreground text-xs">No preferences</span>
            return (
              <div className="space-y-1.5">
                {options
                  .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0))
                  .map((opt: any, idx: number) => {
                    const start = opt.start_date
                      ? new Date(opt.start_date).toLocaleDateString('en-AU', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '?'
                    const end = opt.end_date
                      ? new Date(opt.end_date).toLocaleDateString('en-AU', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '?'
                    const days =
                      opt.start_date && opt.end_date
                        ? Math.ceil(
                            (new Date(opt.end_date).getTime() -
                              new Date(opt.start_date).getTime()) /
                              (1000 * 60 * 60 * 24)
                          ) + 1
                        : 0
                    const ordinal =
                      opt.priority === 1
                        ? '1st'
                        : opt.priority === 2
                          ? '2nd'
                          : opt.priority === 3
                            ? '3rd'
                            : `${opt.priority}th`
                    const optStatus = optStatuses[String(idx)]
                    return (
                      <div key={idx} className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {ordinal}
                        </Badge>
                        <span className="text-xs">
                          {start} – {end}
                          <span className="text-muted-foreground ml-1">({days}d)</span>
                        </span>
                        {opt.roster_periods && opt.roster_periods.length > 0 && (
                          <>
                            <span className="text-muted-foreground text-[10px]">→</span>
                            {opt.roster_periods.map((rp: string) => (
                              <Badge
                                key={rp}
                                variant="outline"
                                className="border-[var(--color-info-border)] bg-[var(--color-info-bg)] px-1.5 py-0 text-[10px] text-[var(--color-info)]"
                              >
                                {rp}
                              </Badge>
                            ))}
                          </>
                        )}
                        {optStatus === 'APPROVED' && (
                          <Badge
                            variant="outline"
                            className="bg-[var(--color-status-low-bg)] text-[10px] text-[var(--color-status-low)]"
                          >
                            Approved
                          </Badge>
                        )}
                        {optStatus === 'REJECTED' && (
                          <Badge
                            variant="outline"
                            className="bg-[var(--color-status-high-bg)] text-[10px] text-[var(--color-status-high)]"
                          >
                            Rejected
                          </Badge>
                        )}
                      </div>
                    )
                  })}
              </div>
            )
          },
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ getValue }) => {
            const status = (getValue() as string).toLowerCase()
            return (
              <Badge
                variant={
                  status === 'approved'
                    ? 'default'
                    : status === 'rejected'
                      ? 'destructive'
                      : status === 'processing'
                        ? 'default'
                        : 'secondary'
                }
              >
                {status}
              </Badge>
            )
          },
        },
      ]
    }

    // Pilot Info Report
    if (reportType === 'pilot-info') {
      return [
        {
          accessorKey: 'seniority_number',
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              Seniority
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          ),
          cell: ({ getValue }) => (
            <div className="text-sm font-medium">{(getValue() as number) || 'N/A'}</div>
          ),
        },
        {
          accessorKey: 'employee_id',
          header: 'Employee ID',
          cell: ({ getValue }) => (
            <div className="font-mono text-sm">{(getValue() as string) || 'N/A'}</div>
          ),
        },
        {
          accessorKey: 'name',
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              Name
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          ),
          cell: ({ getValue }) => <div className="font-medium">{getValue() as string}</div>,
        },
        {
          accessorKey: 'rank',
          header: 'Rank',
          enableGrouping: true,
          cell: ({ getValue }) => <div className="text-sm">{(getValue() as string) || 'N/A'}</div>,
        },
        {
          accessorKey: 'licence_type',
          header: 'Licence',
          cell: ({ getValue }) => (
            <Badge variant="outline" className="font-mono text-xs">
              {(getValue() as string) || 'N/A'}
            </Badge>
          ),
        },
        {
          accessorKey: 'is_active',
          header: 'Status',
          cell: ({ getValue }) => {
            const isActive = getValue() as boolean
            return (
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            )
          },
        },
        {
          accessorFn: (row) => {
            const quals = row.qualifications || {}
            const list = []
            if (quals.line_captain) list.push('LC')
            if (quals.training_captain) list.push('TC')
            if (quals.examiner) list.push('EX')
            if (quals.rhs_captain) list.push('RHS')
            return list.join(', ') || '-'
          },
          id: 'qualifications',
          header: 'Qualifications',
          cell: ({ getValue }) => <div className="text-sm">{getValue() as string}</div>,
        },
        {
          accessorFn: (row) => {
            const status = row.certificationStatus || { current: 0, expiring: 0, expired: 0 }
            return `${status.current}/${status.expiring}/${status.expired}`
          },
          id: 'cert_status',
          header: 'Certs (C/E/X)',
          cell: ({ row }) => {
            const status = row.original.certificationStatus || {
              current: 0,
              expiring: 0,
              expired: 0,
            }
            return (
              <div className="flex items-center gap-1 text-xs">
                <span className={STATUS_COLORS.success.text}>{status.current}</span>
                <span>/</span>
                <span className={STATUS_COLORS.warning.text}>{status.expiring}</span>
                <span>/</span>
                <span className={STATUS_COLORS.danger.text}>{status.expired}</span>
              </div>
            )
          },
        },
      ]
    }

    // Forecast Report
    if (reportType === 'forecast') {
      return [
        {
          accessorKey: 'section',
          header: 'Section',
          enableGrouping: true,
          cell: ({ getValue }) => <div className="text-sm font-medium">{getValue() as string}</div>,
        },
        {
          accessorKey: 'type',
          header: 'Type',
          cell: ({ getValue }) => {
            const type = getValue() as string
            return (
              <Badge variant="outline" className="text-xs capitalize">
                {type?.replace('_', ' ') || 'N/A'}
              </Badge>
            )
          },
        },
        {
          accessorFn: (row) => row.name || row.month || '-',
          id: 'identifier',
          header: 'Name/Month',
          cell: ({ getValue }) => <div className="font-medium">{getValue() as string}</div>,
        },
        {
          accessorFn: (row) => row.rank || row.readiness || row.warningLevel || '-',
          id: 'status_info',
          header: 'Rank/Readiness/Level',
          cell: ({ getValue }) => {
            const value = getValue() as string
            const variant =
              value === 'Ready' || value === 'Captain'
                ? 'default'
                : value === 'critical'
                  ? 'destructive'
                  : value === 'high'
                    ? 'destructive'
                    : 'secondary'
            return <Badge variant={variant}>{value}</Badge>
          },
        },
        {
          accessorFn: (row) => {
            if (row.retirementDate) {
              return formatAustralianDate(row.retirementDate)
            }
            if (row.monthsUntilRetirement !== undefined) {
              return `${row.monthsUntilRetirement} months`
            }
            if (row.yearsOfService !== undefined) {
              return `${row.yearsOfService} years`
            }
            if (row.count !== undefined) {
              return row.count.toString()
            }
            return '-'
          },
          id: 'value',
          header: 'Value',
          cell: ({ getValue }) => <div className="text-sm">{getValue() as string}</div>,
        },
        {
          accessorFn: (row) => {
            if (row.qualificationGaps?.length > 0) {
              return row.qualificationGaps.join(', ')
            }
            if (row.message) {
              return row.message
            }
            return '-'
          },
          id: 'details',
          header: 'Details',
          cell: ({ getValue }) => (
            <div className="text-muted-foreground max-w-xs truncate text-sm">
              {getValue() as string}
            </div>
          ),
        },
      ]
    }

    // Certifications (default)
    return [
      {
        accessorFn: (row) => `${row.pilot?.first_name} ${row.pilot?.last_name}`,
        id: 'pilot',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Pilot
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ getValue }) => <div className="font-medium">{getValue() as string}</div>,
      },
      {
        accessorKey: 'pilot.role',
        header: 'Rank',
        enableGrouping: true,
        cell: ({ getValue }) => <div className="text-sm">{(getValue() as string) || 'N/A'}</div>,
      },
      {
        accessorFn: (row) =>
          row.check_type?.check_description || row.check_type?.check_code || 'N/A',
        id: 'check_type',
        header: 'Check Type',
        cell: ({ getValue }) => (
          <div className="max-w-xs truncate text-sm">{getValue() as string}</div>
        ),
      },
      {
        accessorKey: 'completion_date',
        header: 'Completion',
        cell: ({ getValue }) => (
          <div className="text-sm">{formatAustralianDate(getValue() as string)}</div>
        ),
      },
      {
        accessorKey: 'expiry_date',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Expiry
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="text-sm">{formatAustralianDate(getValue() as string)}</div>
        ),
      },
      {
        accessorKey: 'daysUntilExpiry',
        header: 'Days Until Expiry',
        cell: ({ getValue }) => {
          const days = getValue() as number
          return (
            <div
              className={`text-sm font-medium ${
                days < 0
                  ? 'text-[var(--color-status-high)]'
                  : days <= 30
                    ? 'text-[var(--color-status-medium)]'
                    : 'text-[var(--color-status-low)]'
              }`}
            >
              {days}
            </div>
          )
        },
      },
      {
        accessorFn: (row) =>
          row.isExpired ? 'EXPIRED' : row.isExpiringSoon ? 'EXPIRING SOON' : 'CURRENT',
        id: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue() as string
          return (
            <Badge
              variant={
                status === 'EXPIRED'
                  ? 'destructive'
                  : status === 'EXPIRING SOON'
                    ? 'default'
                    : 'secondary'
              }
            >
              {status}
            </Badge>
          )
        },
      },
    ]
  }, [reportType])

  const table = useReactTable({
    data,
    columns,
    state: {
      grouping,
      expanded,
    },
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: pagination?.totalPages ?? 1,
  })

  return (
    <div className="space-y-4">
      {/* Grouping Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-sm font-medium">Group by:</span>
        <Button
          variant={
            grouping.includes('roster_period') || grouping.includes('roster_periods')
              ? 'default'
              : 'outline'
          }
          size="sm"
          onClick={() => {
            const rosterPeriodColumn =
              reportType === 'flight-requests' ? 'roster_periods' : 'roster_period'
            if (grouping.includes(rosterPeriodColumn)) {
              setGrouping(grouping.filter((id) => id !== rosterPeriodColumn))
            } else {
              setGrouping([rosterPeriodColumn, ...grouping.filter((id) => id !== 'rank')])
            }
          }}
        >
          Roster Period
        </Button>
        <Button
          variant={grouping.includes('rank') ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            const rosterPeriodColumn =
              reportType === 'flight-requests' ? 'roster_periods' : 'roster_period'
            if (grouping.includes('rank')) {
              setGrouping(grouping.filter((id) => id !== 'rank'))
            } else {
              // Add rank after roster_period for hierarchical grouping
              const newGrouping = grouping.includes(rosterPeriodColumn)
                ? [rosterPeriodColumn, 'rank']
                : ['rank']
              setGrouping(newGrouping)
            }
          }}
        >
          Rank
        </Button>
        {grouping.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGrouping([])}
            className="text-muted-foreground hover:text-destructive"
          >
            Clear Grouping
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="h-10 px-3 text-left align-middle font-medium">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  if (row.getIsGrouped()) {
                    // Render group header row
                    return (
                      <tr key={row.id} className="bg-muted/30 border-muted border-b-2 font-medium">
                        <td colSpan={columns.length} className="p-3">
                          <button
                            onClick={row.getToggleExpandedHandler()}
                            className="hover:text-primary flex items-center gap-2 transition-colors"
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                row.getIsExpanded() ? '' : '-rotate-90'
                              }`}
                            />
                            <span className="font-semibold">
                              {flexRender(
                                row.getVisibleCells()[0].column.columnDef.cell,
                                row.getVisibleCells()[0].getContext()
                              )}
                            </span>
                            <Badge variant="secondary" className="ml-2">
                              {row.subRows.length} {row.subRows.length === 1 ? 'record' : 'records'}
                            </Badge>
                          </button>
                        </td>
                      </tr>
                    )
                  }

                  // Render regular data row
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-3 align-middle">
                          {cell.getIsGrouped()
                            ? // Don't render grouped cells inline
                              null
                            : cell.getIsAggregated()
                              ? flexRender(
                                  cell.column.columnDef.aggregatedCell ??
                                    cell.column.columnDef.cell,
                                  cell.getContext()
                                )
                              : cell.getIsPlaceholder()
                                ? null
                                : flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-muted-foreground h-24 text-center">
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-muted-foreground text-sm">
            Showing{' '}
            <span className="font-medium">
              {(pagination.currentPage - 1) * pagination.pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium">
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)}
            </span>{' '}
            of <span className="font-medium">{pagination.totalRecords}</span> records
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(1)}
              disabled={!pagination.hasPrevPage || isLoading}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              <span className="text-sm">Page</span>
              <span className="text-sm font-medium">
                {pagination.currentPage} of {pagination.totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.totalPages)}
              disabled={!pagination.hasNextPage || isLoading}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
