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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ChevronDown } from 'lucide-react'
import type { ReportType, PaginationMeta } from '@/types/reports'
import { getAffectedRosterPeriods } from '@/lib/utils/roster-utils'

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
          accessorFn: (row) => row.name || `${row.pilot?.first_name} ${row.pilot?.last_name}` || 'N/A',
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
            <div className="text-sm">{new Date(getValue() as string).toLocaleDateString()}</div>
          ),
        },
        {
          accessorKey: 'end_date',
          header: 'End Date',
          cell: ({ getValue }) => (
            <div className="text-sm">{new Date(getValue() as string).toLocaleDateString()}</div>
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
                  status === 'approved' ? 'default' : status === 'rejected' || status === 'denied' ? 'destructive' : 'secondary'
                }
              >
                {status}
              </Badge>
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
              return periods.map(p => p.code).join(', ')
            } catch (error) {
              console.error('Error calculating roster periods:', error)
              return row.roster_period || 'N/A'
            }
          },
          id: 'roster_period',
          header: 'Roster Period',
          enableGrouping: true,
          cell: ({ getValue }) => (
            <div className="text-sm font-mono">{getValue() as string}</div>
          ),
        },
      ]
    }

    if (reportType === 'flight-requests') {
      return [
        {
          accessorFn: (row) => row.name || `${row.pilot?.first_name} ${row.pilot?.last_name}` || 'N/A',
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
                  ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                  : startDate
                  ? new Date(startDate).toLocaleDateString()
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
              return periods.map(p => p.code).join(', ')
            } catch (error) {
              console.error('Error calculating roster periods:', error)
              return row.roster_period || 'N/A'
            }
          },
          id: 'roster_periods',
          header: 'Roster Period',
          enableGrouping: true,
          cell: ({ getValue }) => (
            <div className="text-sm font-medium">{getValue() as string}</div>
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
                  status === 'approved' ? 'default' : status === 'rejected' || status === 'denied' ? 'destructive' : 'secondary'
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
          accessorFn: (row) => row.name || `${row.pilot?.first_name} ${row.pilot?.last_name}` || 'N/A',
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
          accessorKey: 'roster_period_code',
          id: 'roster_period',
          header: 'Roster Period',
          enableGrouping: true,
          cell: ({ getValue }) => (
            <div className="text-sm font-mono">{(getValue() as string) || 'N/A'}</div>
          ),
        },
        {
          accessorKey: 'priority',
          header: 'Priority',
          cell: ({ getValue }) => (
            <Badge
              variant="outline"
              className={`font-mono text-xs ${
                getValue() === 'HIGH'
                  ? 'border-red-500 text-red-600'
                  : getValue() === 'MEDIUM'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-gray-500 text-gray-600'
              }`}
            >
              {getValue() as string}
            </Badge>
          ),
        },
        {
          accessorKey: 'submitted_at',
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
            <div className="text-sm">{new Date(getValue() as string).toLocaleDateString()}</div>
          ),
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

    // Certifications
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
        accessorFn: (row) => row.check_type?.check_description || row.check_type?.check_code || 'N/A',
        id: 'check_type',
        header: 'Check Type',
        cell: ({ getValue }) => (
          <div className="text-sm max-w-xs truncate">{getValue() as string}</div>
        ),
      },
      {
        accessorKey: 'completion_date',
        header: 'Completion',
        cell: ({ getValue }) => (
          <div className="text-sm">{new Date(getValue() as string).toLocaleDateString()}</div>
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
          <div className="text-sm">{new Date(getValue() as string).toLocaleDateString()}</div>
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
                days < 0 ? 'text-red-600' : days <= 30 ? 'text-yellow-600' : 'text-green-600'
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
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Group by:</span>
        <Button
          variant={grouping.includes('roster_period') || grouping.includes('roster_periods') ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            const rosterPeriodColumn = reportType === 'flight-requests' ? 'roster_periods' : 'roster_period'
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
            const rosterPeriodColumn = reportType === 'flight-requests' ? 'roster_periods' : 'roster_period'
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
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  if (row.getIsGrouped()) {
                    // Render group header row
                    return (
                      <tr
                        key={row.id}
                        className="bg-muted/30 font-medium border-b-2 border-muted"
                      >
                        <td colSpan={columns.length} className="p-3">
                          <button
                            onClick={row.getToggleExpandedHandler()}
                            className="flex items-center gap-2 hover:text-primary transition-colors"
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
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-3 align-middle">
                          {cell.getIsGrouped() ? (
                            // Don't render grouped cells inline
                            null
                          ) : cell.getIsAggregated() ? (
                            flexRender(
                              cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
                              cell.getContext()
                            )
                          ) : cell.getIsPlaceholder() ? null : (
                            flexRender(cell.column.columnDef.cell, cell.getContext())
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
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
          <div className="text-sm text-muted-foreground">
            Showing{' '}
            <span className="font-medium">
              {((pagination.currentPage - 1) * pagination.pageSize) + 1}
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
