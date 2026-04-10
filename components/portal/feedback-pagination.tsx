'use client'

/**
 * Feedback Pagination Component with Keyboard Navigation
 * - Arrow keys for previous/next navigation
 * - Number keys 1-9 for quick page jumps
 * - Full keyboard accessibility
 */

import { useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-nav'

interface PaginationProps {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function FeedbackPagination({ pagination }: PaginationProps) {
  const searchParams = useSearchParams()

  // Build URL with page parameter - memoized for stability
  const buildPageUrl = useCallback(
    (page: number): string => {
      const params = new URLSearchParams(searchParams)
      params.set('page', page.toString())
      return `/portal/feedback?${params.toString()}`
    },
    [searchParams]
  )

  // Navigate to page programmatically - memoized for use in keyboard shortcuts
  const navigateToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= pagination.totalPages) {
        window.location.href = buildPageUrl(page)
      }
    },
    [pagination.totalPages, buildPageUrl]
  )

  // Keyboard shortcuts for pagination
  useKeyboardShortcuts([
    // Arrow Left / H = Previous page
    {
      key: 'ArrowLeft',
      handler: () => {
        if (pagination.hasPrev) {
          navigateToPage(pagination.page - 1)
        }
      },
      description: 'Go to previous page',
    },
    {
      key: 'h',
      handler: () => {
        if (pagination.hasPrev) {
          navigateToPage(pagination.page - 1)
        }
      },
      description: 'Go to previous page (vim-style)',
    },
    // Arrow Right / L = Next page
    {
      key: 'ArrowRight',
      handler: () => {
        if (pagination.hasNext) {
          navigateToPage(pagination.page + 1)
        }
      },
      description: 'Go to next page',
    },
    {
      key: 'l',
      handler: () => {
        if (pagination.hasNext) {
          navigateToPage(pagination.page + 1)
        }
      },
      description: 'Go to next page (vim-style)',
    },
    // Home = First page
    {
      key: 'Home',
      handler: () => {
        navigateToPage(1)
      },
      description: 'Go to first page',
    },
    // End = Last page
    {
      key: 'End',
      handler: () => {
        navigateToPage(pagination.totalPages)
      },
      description: 'Go to last page',
    },
    // Number keys 1-9 for quick page jumps
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => ({
      key: num.toString(),
      handler: () => {
        if (num <= pagination.totalPages) {
          navigateToPage(num)
        }
      },
      description: `Go to page ${num}`,
    })),
  ])

  // Generate page numbers to display
  const getPageNumbers = (): number[] => {
    const pages: number[] = []
    const { page, totalPages } = pagination

    // Always show first page
    pages.push(1)

    // Calculate range around current page
    const start = Math.max(2, page - 2)
    const end = Math.min(totalPages - 1, page + 2)

    // Add ellipsis before range if needed
    if (start > 2) {
      pages.push(-1) // -1 represents ellipsis
    }

    // Add pages in range
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add ellipsis after range if needed
    if (end < totalPages - 1) {
      pages.push(-1) // -1 represents ellipsis
    }

    // Always show last page if there's more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="border-border bg-card rounded-lg border p-6 shadow-sm">
      {/* Keyboard shortcuts hint */}
      <div className="text-muted-foreground mb-4 text-center text-xs">
        Keyboard: <kbd className="border-border bg-muted rounded border px-2 py-1">←</kbd>{' '}
        <kbd className="border-border bg-muted rounded border px-2 py-1">→</kbd> to navigate,{' '}
        <kbd className="border-border bg-muted rounded border px-2 py-1">Home</kbd>{' '}
        <kbd className="border-border bg-muted rounded border px-2 py-1">End</kbd> for first/last,{' '}
        <kbd className="border-border bg-muted rounded border px-2 py-1">1-9</kbd> for quick jump
      </div>
      <div className="flex items-center justify-between">
        {/* Previous Button */}
        <div>
          {pagination.hasPrev ? (
            <Link href={buildPageUrl(pagination.page - 1)}>
              <button
                className="focus:ring-primary bg-primary hover:bg-primary/90 rounded-lg px-4 py-2 font-medium text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
                aria-label="Go to previous page"
              >
                ← Previous
              </button>
            </Link>
          ) : (
            <button
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed rounded-lg px-4 py-2 font-medium"
              aria-label="Previous page (disabled)"
              aria-disabled="true"
            >
              ← Previous
            </button>
          )}
        </div>

        {/* Page Numbers */}
        <div className="flex items-center space-x-2">
          {pageNumbers.map((pageNum, idx) => {
            if (pageNum === -1) {
              // Ellipsis
              return (
                <span key={`ellipsis-${idx}`} className="text-muted-foreground px-3 py-2">
                  ...
                </span>
              )
            }

            const isCurrentPage = pageNum === pagination.page

            return (
              <Link key={pageNum} href={buildPageUrl(pageNum)}>
                <button
                  className={`rounded-lg px-4 py-2 font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none ${
                    isCurrentPage
                      ? 'focus:ring-primary bg-primary text-white'
                      : 'bg-muted text-foreground hover:bg-muted/80 focus:ring-border'
                  }`}
                  aria-label={`Go to page ${pageNum}`}
                  aria-current={isCurrentPage ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              </Link>
            )
          })}
        </div>

        {/* Next Button */}
        <div>
          {pagination.hasNext ? (
            <Link href={buildPageUrl(pagination.page + 1)}>
              <button
                className="focus:ring-primary bg-primary hover:bg-primary/90 rounded-lg px-4 py-2 font-medium text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
                aria-label="Go to next page"
              >
                Next →
              </button>
            </Link>
          ) : (
            <button
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed rounded-lg px-4 py-2 font-medium"
              aria-label="Next page (disabled)"
              aria-disabled="true"
            >
              Next →
            </button>
          )}
        </div>
      </div>

      {/* Pagination Info */}
      <div className="text-muted-foreground mt-4 text-center text-sm">
        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} posts
      </div>
    </div>
  )
}
