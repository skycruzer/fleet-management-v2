import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAuditLogs, getAuditStats, getAuditedTables, getAuditedUsers } from '@/lib/services/audit-service'
import { AuditFilters } from './components/audit-filters'
import { format } from 'date-fns'
import Link from 'next/link'
// Force dynamic rendering to prevent static generation at build time
export const dynamic = 'force-dynamic'


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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
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
      sortOrder: 'desc'
    }),
    getAuditStats(),
    getAuditedTables(),
    getAuditedUsers()
  ])

  const { logs, totalCount, totalPages } = logsResult
  const stats = statsResult

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'SOFT_DELETE':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'RESTORE':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Complete audit trail of all system activities and changes
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Logs</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.totalLogs}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalUsers}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tables Monitored</p>
          <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalTables}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Activity</p>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{totalCount}</p>
        </div>
      </div>

      {/* Action Breakdown */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Action Breakdown</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Inserts</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.actionBreakdown.INSERT}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Updates</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.actionBreakdown.UPDATE}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Deletes</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.actionBreakdown.DELETE}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Soft Deletes</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.actionBreakdown.SOFT_DELETE}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Restores</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.actionBreakdown.RESTORE}
            </p>
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
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Record ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No audit logs found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-gray-900 dark:text-white">{log.user_email || 'System'}</div>
                      {log.user_role && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{log.user_role}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {log.table_name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-900 dark:bg-gray-900 dark:text-white">
                        {log.record_id}
                      </code>
                    </td>
                    <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-900 dark:text-white">
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
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-1 justify-between sm:hidden">
              <Link
                href={`?${new URLSearchParams({ ...params, page: String(Math.max(1, page - 1)) }).toString()}`}
                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 ${
                  page === 1 ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                Previous
              </Link>
              <Link
                href={`?${new URLSearchParams({ ...params, page: String(Math.min(totalPages, page + 1)) }).toString()}`}
                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 ${
                  page === totalPages ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                Next
              </Link>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> of{' '}
                  <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <Link
                    href={`?${new URLSearchParams({ ...params, page: String(Math.max(1, page - 1)) }).toString()}`}
                    className={`relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 ${
                      page === 1 ? 'pointer-events-none opacity-50' : ''
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                  <span className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    {page} / {totalPages}
                  </span>
                  <Link
                    href={`?${new URLSearchParams({ ...params, page: String(Math.min(totalPages, page + 1)) }).toString()}`}
                    className={`relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 ${
                      page === totalPages ? 'pointer-events-none opacity-50' : ''
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
