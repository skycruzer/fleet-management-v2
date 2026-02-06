/**
 * Audit Log Table Component
 * Displays paginated audit log entries in a table format
 *
 * @author Maurice Rondeau
 * @version 1.0.0
 */

'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ScrollText } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import type { AuditLog } from '@/lib/services/audit-service'

interface AuditLogTableProps {
  logs: AuditLog[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

export default function AuditLogTable({ logs, pagination }: AuditLogTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function navigateToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`/dashboard/audit?${params.toString()}`)
  }

  const actionColors: Record<string, string> = {
    INSERT: 'bg-[var(--color-success-muted)] text-[var(--color-success-500)]',
    UPDATE: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    DELETE: 'bg-[var(--color-destructive-muted)] text-[var(--color-danger-500)]',
    RESTORE: 'bg-[var(--color-warning-muted)] text-[var(--color-warning-500)]',
    SOFT_DELETE: 'bg-[var(--color-badge-orange-bg)] text-[var(--color-badge-orange)]',
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title="No audit logs found"
        description="Try adjusting your filter criteria or date range."
      />
    )
  }

  return (
    <div className="bg-card border-border rounded-lg border shadow-sm">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b">
              <th scope="col" className="text-muted-foreground px-4 py-3 text-left font-medium">
                Timestamp
              </th>
              <th scope="col" className="text-muted-foreground px-4 py-3 text-left font-medium">
                User
              </th>
              <th scope="col" className="text-muted-foreground px-4 py-3 text-left font-medium">
                Action
              </th>
              <th scope="col" className="text-muted-foreground px-4 py-3 text-left font-medium">
                Table
              </th>
              <th scope="col" className="text-muted-foreground px-4 py-3 text-left font-medium">
                Description
              </th>
              <th scope="col" className="text-muted-foreground px-4 py-3 text-left font-medium">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-border hover:bg-muted/20 border-b transition-colors"
              >
                <td className="text-foreground px-4 py-3 text-xs whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="text-foreground px-4 py-3">{log.user_email || 'System'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${actionColors[log.action] || 'text-foreground bg-muted/30'}`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="text-foreground px-4 py-3 font-mono text-xs">{log.table_name}</td>
                <td className="text-muted-foreground max-w-[200px] truncate px-4 py-3 text-xs">
                  {log.description || '—'}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/audit/${log.id}`}
                    className="text-xs text-[var(--color-primary-500)] hover:text-[var(--color-primary-400)] hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="border-border flex items-center justify-between border-t px-4 py-3">
          <p className="text-muted-foreground text-sm">
            Showing {(pagination.page - 1) * pagination.pageSize + 1}–
            {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{' '}
            {pagination.totalCount}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigateToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="border-border hover:bg-muted/50 rounded-md border px-3 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => navigateToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="border-border hover:bg-muted/50 rounded-md border px-3 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
