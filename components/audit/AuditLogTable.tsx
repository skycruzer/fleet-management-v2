'use client'

/**
 * Audit Log Table Component
 *
 * Displays audit logs in a sortable/filterable table with pagination.
 *
 * @spec 001-missing-core-features (US4, T074)
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface AuditLog {
  id: string
  user_id: string | null
  user_email: string | null
  action: string
  table_name: string
  record_id: string | null
  old_values: any
  new_values: any
  description: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

interface Pagination {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

interface AuditLogTableProps {
  logs: AuditLog[]
  pagination: Pagination
}

export default function AuditLogTable({ logs, pagination }: AuditLogTableProps) {
  const router = useRouter()
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortBy(column)
    setSortOrder(newOrder)

    const url = new URL(window.location.href)
    url.searchParams.set('sortBy', column)
    url.searchParams.set('sortOrder', newOrder)
    url.searchParams.set('page', '1') // Reset to page 1
    router.push(url.toString())
  }

  const handlePageChange = (newPage: number) => {
    const url = new URL(window.location.href)
    url.searchParams.set('page', newPage.toString())
    router.push(url.toString())
  }

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]'
      case 'UPDATE':
        return 'bg-[var(--color-info-bg)] text-[var(--color-info)]'
      case 'DELETE':
        return 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]'
      case 'LOGIN':
        return 'bg-[var(--color-category-simulator-bg)] text-[var(--color-category-simulator)]'
      case 'LOGOUT':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  if (logs.length === 0) {
    return (
      <div className="border-border bg-card rounded-lg border p-8 text-center">
        <svg
          className="text-muted-foreground mx-auto h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-foreground mt-2 text-lg font-medium">No audit logs found</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          No audit logs match your current filters. Try adjusting your search criteria.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="border-border bg-card overflow-x-auto rounded-lg border shadow-sm">
        <table className="divide-border min-w-full divide-y">
          <thead className="bg-muted/50">
            <tr>
              <th
                scope="col"
                className="text-muted-foreground hover:bg-muted cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  Timestamp
                  {sortBy === 'created_at' && (
                    <svg
                      className={`h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="text-muted-foreground hover:bg-muted cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
                onClick={() => handleSort('user_email')}
              >
                <div className="flex items-center gap-1">
                  User
                  {sortBy === 'user_email' && (
                    <svg
                      className={`h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="text-muted-foreground hover:bg-muted cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
                onClick={() => handleSort('action')}
              >
                <div className="flex items-center gap-1">
                  Action
                  {sortBy === 'action' && (
                    <svg
                      className={`h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="text-muted-foreground hover:bg-muted cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
                onClick={() => handleSort('table_name')}
              >
                <div className="flex items-center gap-1">
                  Table
                  {sortBy === 'table_name' && (
                    <svg
                      className={`h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
              >
                Record ID
              </th>
              <th
                scope="col"
                className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
              >
                Description
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-border bg-card divide-y">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-muted">
                <td className="text-foreground px-6 py-4 text-sm whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="text-foreground px-6 py-4 text-sm">{log.user_email || 'System'}</td>
                <td className="px-6 py-4 text-sm whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getActionBadgeColor(log.action)}`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <code className="bg-muted text-foreground rounded px-2 py-1 font-mono text-xs">
                    {log.table_name}
                  </code>
                </td>
                <td className="px-6 py-4 text-sm">
                  <code className="text-muted-foreground font-mono text-xs">
                    {log.record_id ? log.record_id.slice(0, 8) + '...' : 'N/A'}
                  </code>
                </td>
                <td className="text-muted-foreground max-w-xs truncate px-6 py-4 text-sm">
                  {log.description || '-'}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                  <Link
                    href={`/dashboard/audit/${log.id}`}
                    className="text-[var(--color-info)] hover:text-[var(--color-info)]/80"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="border-border bg-card flex items-center justify-between rounded-lg border px-6 py-4">
        <div className="text-foreground text-sm">
          Showing{' '}
          <span className="font-medium">{(pagination.page - 1) * pagination.pageSize + 1}</span> to{' '}
          <span className="font-medium">
            {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)}
          </span>{' '}
          of <span className="font-medium">{pagination.totalCount.toLocaleString()}</span> results
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="border-border text-foreground hover:bg-muted rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum
              if (pagination.totalPages <= 5) {
                pageNum = i + 1
              } else if (pagination.page <= 3) {
                pageNum = i + 1
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i
              } else {
                pageNum = pagination.page - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    pagination.page === pageNum
                      ? 'bg-[var(--color-info)] text-white'
                      : 'border-border text-foreground hover:bg-muted border'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="border-border text-foreground hover:bg-muted rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
