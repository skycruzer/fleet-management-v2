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

import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react'
import type { ReportType, PaginationMeta } from '@/types/reports'

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
  // Define columns based on report type
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (reportType === 'leave') {
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
          cell: ({ getValue }) => <div className="text-sm">{(getValue() as string) || 'N/A'}</div>,
        },
        {
          accessorKey: 'leave_type',
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
          accessorKey: 'status',
          header: 'Status',
          cell: ({ getValue }) => {
            const status = getValue() as string
            return (
              <Badge
                variant={
                  status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'
                }
              >
                {status}
              </Badge>
            )
          },
        },
        {
          accessorKey: 'roster_period',
          header: 'Roster Period',
          cell: ({ getValue }) => (
            <div className="text-sm font-mono">{(getValue() as string) || 'N/A'}</div>
          ),
        },
      ]
    }

    if (reportType === 'flight-requests') {
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
          cell: ({ getValue }) => <div className="text-sm">{(getValue() as string) || 'N/A'}</div>,
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
          accessorKey: 'flight_date',
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              Flight Date
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          ),
          cell: ({ getValue }) => {
            const date = getValue()
            return (
              <div className="text-sm">
                {date ? new Date(date as string).toLocaleDateString() : 'N/A'}
              </div>
            )
          },
        },
        {
          accessorKey: 'description',
          header: 'Description',
          cell: ({ getValue }) => (
            <div className="text-sm max-w-xs truncate">{(getValue() as string) || 'N/A'}</div>
          ),
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ getValue }) => {
            const status = getValue() as string
            return (
              <Badge
                variant={
                  status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: pagination?.totalPages ?? 1,
  })

  return (
    <div className="space-y-4">
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
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
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
