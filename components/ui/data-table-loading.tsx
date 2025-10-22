/**
 * Data Table Loading Component
 * Reusable skeleton loader for data tables with pagination
 */

import { Card } from './card'
import { Skeleton, TableSkeleton } from './skeleton'

interface DataTableLoadingProps {
  /** Number of rows to display in skeleton */
  rows?: number
  /** Number of columns to display in skeleton */
  columns?: number
  /** Show pagination skeleton */
  showPagination?: boolean
  /** Show search/filter skeleton */
  showFilters?: boolean
  /** Custom header content */
  headerContent?: React.ReactNode
}

export function DataTableLoading({
  rows = 5,
  columns = 4,
  showPagination = true,
  showFilters = false,
  headerContent,
}: DataTableLoadingProps) {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      {headerContent || (
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      )}

      {/* Filters Skeleton */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </Card>
      )}

      {/* Table Skeleton */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <TableSkeleton rows={rows} columns={columns} />
        </div>
      </Card>

      {/* Pagination Skeleton */}
      {showPagination && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Simple table loading state without filters or pagination
 */
export function SimpleTableLoading() {
  return (
    <Card className="overflow-hidden">
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading data...</p>
      </div>
    </Card>
  )
}

/**
 * Inline table loading state (for tables already rendered with loading prop)
 */
export function InlineTableLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="p-8 text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="mt-2 text-gray-600">{message}</p>
    </div>
  )
}
