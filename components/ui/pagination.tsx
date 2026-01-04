/**
 * Pagination Component
 * For displaying and navigating paginated data
 * Supports various page sizes and displays page info
 */

'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PaginationProps {
  /** Current page (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Total number of items */
  totalItems: number
  /** Items per page */
  pageSize: number
  /** Available page sizes */
  pageSizeOptions?: number[]
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void
  /** Show page size selector */
  showPageSize?: boolean
  /** Show page info text */
  showPageInfo?: boolean
  /** Show first/last page buttons */
  showFirstLast?: boolean
  /** Compact mode (fewer buttons on mobile) */
  compact?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  showPageSize = true,
  showPageInfo = true,
  showFirstLast = true,
  compact = false,
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxButtons = compact ? 3 : 5
    const sideButtons = Math.floor(maxButtons / 2)

    if (totalPages <= maxButtons) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > sideButtons + 2) {
        pages.push('ellipsis')
      }

      // Show pages around current
      const startPage = Math.max(2, currentPage - sideButtons)
      const endPage = Math.min(totalPages - 1, currentPage + sideButtons)

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - sideButtons - 1) {
        pages.push('ellipsis')
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Page Size Selector */}
      {showPageSize && onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm whitespace-nowrap">Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]" aria-label="Select page size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Page Info */}
      {showPageInfo && (
        <div className="text-muted-foreground text-sm whitespace-nowrap">
          {totalItems === 0 ? (
            'No items'
          ) : (
            <>
              Showing {startItem} to {endItem} of {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </>
          )}
        </div>
      )}

      {/* Page Navigation */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        {showFirstLast && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious}
            aria-label="Go to first page"
            className="h-8 w-8"
          >
            <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}

        {/* Previous Page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          aria-label="Go to previous page"
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>

        {/* Page Numbers */}
        <div className="hidden items-center gap-1 sm:flex">
          {pageNumbers.map((page, index) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="text-muted-foreground px-2">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="icon"
                onClick={() => onPageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
                className="h-8 w-8"
              >
                {page}
              </Button>
            )
          )}
        </div>

        {/* Current Page Indicator (Mobile) */}
        <div className="flex items-center px-3 sm:hidden">
          <span className="text-muted-foreground text-sm">
            {currentPage} / {totalPages}
          </span>
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          aria-label="Go to next page"
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>

        {/* Last Page */}
        {showFirstLast && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext}
            aria-label="Go to last page"
            className="h-8 w-8"
          >
            <ChevronsRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Hook for client-side pagination
 */
export function usePagination<T>(data: T[], initialPageSize: number = 10) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(initialPageSize)

  const totalPages = Math.ceil(data.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = data.slice(startIndex, endIndex)

  // Reset to page 1 when data changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [data.length])

  // Reset to page 1 when page size changes
  const handlePageSizeChange = React.useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }, [])

  return {
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    setCurrentPage,
    setPageSize: handlePageSizeChange,
  }
}
