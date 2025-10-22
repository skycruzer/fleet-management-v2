/**
 * Data Table Component
 * Sortable and filterable table with built-in features
 */

'use client'

import * as React from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination, usePagination } from '@/components/ui/pagination'

export interface Column<T> {
  id: string
  header: string
  accessorKey?: keyof T
  accessorFn?: (row: T) => any
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
  /** Enable pagination */
  enablePagination?: boolean
  /** Initial page size for pagination */
  initialPageSize?: number
  /** Available page sizes */
  pageSizeOptions?: number[]
}

type SortDirection = 'asc' | 'desc' | null

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'No data available',
  enablePagination = false,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null)

  // Pagination state
  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination(data, initialPageSize)

  // Handle column sorting
  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      // Cycle through: asc → desc → null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      }
    } else {
      setSortColumn(columnId)
      setSortDirection('asc')
    }
  }

  // Get value from row for sorting
  const getValue = (row: T, column: Column<T>) => {
    if (column.accessorFn) {
      return column.accessorFn(row)
    }
    if (column.accessorKey) {
      return row[column.accessorKey]
    }
    return ''
  }

  // Sort data (use paginatedData if pagination is enabled, otherwise use all data)
  const dataToSort = enablePagination ? paginatedData : data

  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return dataToSort
    }

    const column = columns.find((col) => col.id === sortColumn)
    if (!column) return dataToSort

    return [...dataToSort].sort((a, b) => {
      const aValue = getValue(a, column)
      const bValue = getValue(b, column)

      if (aValue === bValue) return 0

      const comparison = aValue < bValue ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [dataToSort, sortColumn, sortDirection, columns])

  // Render sort icon
  const renderSortIcon = (columnId: string) => {
    if (sortColumn !== columnId) {
      return <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" aria-hidden="true" />
    }
    return <ArrowDown className="ml-2 h-4 w-4" aria-hidden="true" />
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id} className="whitespace-nowrap">
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort(column.id)}
                      aria-label={`Sort by ${column.header}`}
                    >
                      <span>{column.header}</span>
                      {renderSortIcon(column.id)}
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, index) => (
                <TableRow
                  key={index}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : 'hover:bg-muted/50'}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.id} className="whitespace-nowrap">
                      {column.cell
                        ? column.cell(row)
                        : getValue(row, column)?.toString() || '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {enablePagination && data.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={data.length}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          showPageSize
          showPageInfo
          showFirstLast
        />
      )}
    </div>
  )
}

/**
 * Hook for client-side filtering
 */
export function useTableFilter<T>(data: T[], filterFn: (item: T, query: string) => boolean) {
  const [filterQuery, setFilterQuery] = React.useState('')

  const filteredData = React.useMemo(() => {
    if (!filterQuery.trim()) return data
    return data.filter((item) => filterFn(item, filterQuery.toLowerCase()))
  }, [data, filterQuery, filterFn])

  return {
    filteredData,
    filterQuery,
    setFilterQuery,
  }
}

/**
 * Search Input for DataTable
 */
interface DataTableSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DataTableSearch({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: DataTableSearchProps) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={placeholder}
      />
    </div>
  )
}
