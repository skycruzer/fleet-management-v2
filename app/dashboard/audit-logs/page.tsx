import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import {
  getAuditLogs,
  getAuditStats,
  getAuditedTables,
  getAuditedUsers,
} from '@/lib/services/audit-service'
import { AuditFilters } from './components/audit-filters'
import { format } from 'date-fns'
import Link from 'next/link'
// Force dynamic rendering to prevent static generation at build time
/**
 * Audit Logs Dashboard (Admin)
 *
 * Comprehensive audit trail viewer with filtering and statistics.
 * Displays all system activity for compliance and security monitoring.
 *
 * @spec 001-missing-core-features (US7)
 */

interface AuditLogsPageProps {
  searchParams: Promise<{
    userEmail?: string
    tableName?: string
    action?: string
    page?: string
  }>
}

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  const params = await searchParams
  const userEmail = params.userEmail || undefined
  const tableName = params.tableName || undefined
  const action = params.action || undefined
  const page = params.page ? parseInt(params.page, 10) : 1
  const pageSize = 20

  // Fetch data in parallel
  const [logsResult, statsResult, tablesResult, usersResult] = await Promise.all([
    getAuditLogs({
      userEmail,
      tableName,
      action,
      page,
      pageSize,
      sortBy: 'created_at',
      sortOrder: 'desc',
    }),
    getAuditStats(),
    getAuditedTables(),
    getAuditedUsers(),
  ])

  const { logs, totalCount, totalPages } = logsResult
  const stats = statsResult

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-emerald-500/10 text-emerald-400'
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-400'
      case 'DELETE':
        return 'bg-red-500/10 text-red-400'
      case 'SOFT_DELETE':
        return 'bg-orange-500/10 text-orange-400'
      case 'RESTORE':
        return 'bg-primary/10 text-primary-foreground'
      default:
        return 'bg-white/[0.03] text-foreground'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-foreground text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">
          Complete audit trail of all system activities and changes
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card rounded-lg border border-white/[0.08] p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Total Logs</p>
          <p className="text-foreground mt-2 text-3xl font-bold">{stats.totalLogs}</p>
        </div>
        <div className="bg-card rounded-lg border border-white/[0.08] p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Active Users</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
        </div>
        <div className="bg-card rounded-lg border border-white/[0.08] p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Tables Monitored</p>
          <p className="text-primary mt-2 text-3xl font-bold">{stats.totalTables}</p>
        </div>
        <div className="bg-card rounded-lg border border-white/[0.08] p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Recent Activity</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{totalCount}</p>
        </div>
      </div>

      {/* Action Breakdown */}
      <div className="bg-card mb-8 rounded-lg border border-white/[0.08] p-6 shadow-sm">
        <h2 className="text-foreground mb-4 text-lg font-semibold">Action Breakdown</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div>
            <p className="text-muted-foreground text-sm">Inserts</p>
            <p className="text-2xl font-bold text-green-600">{stats.actionBreakdown.INSERT}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Updates</p>
            <p className="text-2xl font-bold text-blue-600">{stats.actionBreakdown.UPDATE}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Deletes</p>
            <p className="text-2xl font-bold text-red-600">{stats.actionBreakdown.DELETE}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Soft Deletes</p>
            <p className="text-2xl font-bold text-orange-600">
              {stats.actionBreakdown.SOFT_DELETE}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Restores</p>
            <p className="text-primary text-2xl font-bold">{stats.actionBreakdown.RESTORE}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <AuditFilters
        currentUserEmail={userEmail}
        currentTableName={tableName}
        currentAction={action}
        tables={tablesResult}
        users={usersResult}
      />

      {/* Audit Logs Table */}
      <div className="bg-card overflow-hidden rounded-lg border border-white/[0.08] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/[0.08]">
            <thead className="bg-white/[0.03]">
              <tr>
                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Timestamp
                </th>
                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  User
                </th>
                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Action
                </th>
                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Table
                </th>
                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Record ID
                </th>
                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-white/[0.08]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground px-6 py-12 text-center">
                    No audit logs found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.03]">
                    <td className="text-foreground px-6 py-4 text-sm whitespace-nowrap">
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-foreground">{log.user_email || 'System'}</div>
                      {log.user_role && (
                        <div className="text-muted-foreground text-xs">{log.user_role}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="text-foreground px-6 py-4 text-sm whitespace-nowrap">
                      {log.table_name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <code className="text-foreground rounded bg-white/[0.03] px-2 py-1 text-xs">
                        {log.record_id}
                      </code>
                    </td>
                    <td className="text-foreground max-w-xs truncate px-6 py-4 text-sm">
                      {log.description || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-card flex items-center justify-between border-t border-white/[0.08] px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Link
                href={`?${new URLSearchParams({ ...params, page: String(Math.max(1, page - 1)) }).toString()}`}
                className={`bg-card text-foreground/80 relative inline-flex items-center rounded-md border border-white/[0.1] px-4 py-2 text-sm font-medium hover:bg-white/[0.03] ${
                  page === 1 ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                Previous
              </Link>
              <Link
                href={`?${new URLSearchParams({ ...params, page: String(Math.min(totalPages, page + 1)) }).toString()}`}
                className={`bg-card text-foreground/80 relative ml-3 inline-flex items-center rounded-md border border-white/[0.1] px-4 py-2 text-sm font-medium hover:bg-white/[0.03] ${
                  page === totalPages ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                Next
              </Link>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-foreground/80 text-sm">
                  Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> of{' '}
                  <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                  aria-label="Pagination"
                >
                  <Link
                    href={`?${new URLSearchParams({ ...params, page: String(Math.max(1, page - 1)) }).toString()}`}
                    className={`bg-card text-muted-foreground relative inline-flex items-center rounded-l-md border border-white/[0.1] px-2 py-2 text-sm font-medium hover:bg-white/[0.03] focus:z-20 ${
                      page === 1 ? 'pointer-events-none opacity-50' : ''
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                  <span className="bg-card text-foreground/80 relative inline-flex items-center border border-white/[0.1] px-4 py-2 text-sm font-medium">
                    {page} / {totalPages}
                  </span>
                  <Link
                    href={`?${new URLSearchParams({ ...params, page: String(Math.min(totalPages, page + 1)) }).toString()}`}
                    className={`bg-card text-muted-foreground relative inline-flex items-center rounded-r-md border border-white/[0.1] px-2 py-2 text-sm font-medium hover:bg-white/[0.03] focus:z-20 ${
                      page === totalPages ? 'pointer-events-none opacity-50' : ''
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
