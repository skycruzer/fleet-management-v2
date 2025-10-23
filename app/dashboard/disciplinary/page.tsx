import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMatters, getMatterStats } from '@/lib/services/disciplinary-service'
import Link from 'next/link'
import { DisciplinaryFilters } from './components/disciplinary-filters'
// Force dynamic rendering to prevent static generation at build time
export const dynamic = 'force-dynamic'


/**
 * Disciplinary Matters Dashboard (Admin)
 *
 * Main disciplinary matters page with statistics and table view.
 * Displays matter statistics and allows filtering by status/severity.
 *
 * @spec 001-missing-core-features (US6, T096)
 */

interface DisciplinaryPageProps {
  searchParams: Promise<{
    status?: string
    severity?: string
    pilotId?: string
    page?: string
  }>
}

export default async function DisciplinaryPage({ searchParams }: DisciplinaryPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const params = await searchParams
  const status = params.status || undefined
  const severity = params.severity || undefined
  const pilotId = params.pilotId || undefined
  const page = params.page ? parseInt(params.page, 10) : 1
  const pageSize = 20

  // Fetch matters and stats
  const [mattersResult, statsResult] = await Promise.all([
    getMatters({
      status,
      severity,
      pilotId,
      page,
      pageSize,
      includeResolved: true,
    }),
    getMatterStats(),
  ])

  if (!mattersResult.success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-200">
            Failed to load disciplinary matters: {mattersResult.error}
          </p>
        </div>
      </div>
    )
  }

  if (!statsResult.success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-200">
            Failed to load statistics: {statsResult.error}
          </p>
        </div>
      </div>
    )
  }

  const matters = mattersResult.data!.matters
  const totalCount = mattersResult.data!.totalCount
  const stats = statsResult.data!
  const totalPages = Math.ceil(totalCount / pageSize)

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'SERIOUS':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'MINOR':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'UNDER_INVESTIGATION':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'ACTION_TAKEN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'APPEALED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Disciplinary Matters</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track and manage disciplinary matters and actions
          </p>
        </div>
        <Link
          href="/dashboard/disciplinary/new"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Matter
        </Link>
      </div>

      {/* Statistics Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Matters</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.totalMatters}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Cases</p>
          <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.openMatters}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Under Investigation</p>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
            {stats.underInvestigation}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{stats.overdueMatters}</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Matter Breakdown</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* By Severity */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">By Severity</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Critical</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {stats.bySeverity.critical}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Serious</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {stats.bySeverity.serious}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Moderate</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {stats.bySeverity.moderate}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Minor</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {stats.bySeverity.minor}
                </span>
              </div>
            </div>
          </div>

          {/* By Status */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">By Status</h3>
            <div className="space-y-2">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {status.replace(/_/g, ' ')}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <DisciplinaryFilters currentStatus={status} currentSeverity={severity} />

      {/* Matters Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Pilot
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Incident Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {matters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No disciplinary matters found
                  </td>
                </tr>
              ) : (
                matters.map((matter) => (
                  <tr
                    key={matter.id}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/disciplinary/${matter.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {matter.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {matter.pilot
                        ? `${matter.pilot.role} ${matter.pilot.first_name} ${matter.pilot.last_name}`
                        : 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getSeverityBadgeColor(matter.severity)}`}
                      >
                        {matter.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(matter.status)}`}
                      >
                        {matter.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(matter.incident_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-gray-900 dark:text-white">
                        {matter.actions?.length || 0} action{matter.actions?.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Link
                href={`?page=${page - 1}${status ? `&status=${status}` : ''}${severity ? `&severity=${severity}` : ''}`}
                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}
              >
                Previous
              </Link>
              <Link
                href={`?page=${page + 1}${status ? `&status=${status}` : ''}${severity ? `&severity=${severity}` : ''}`}
                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${page === totalPages ? 'pointer-events-none opacity-50' : ''}`}
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Link
                      key={pageNum}
                      href={`?page=${pageNum}${status ? `&status=${status}` : ''}${severity ? `&severity=${severity}` : ''}`}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        pageNum === page
                          ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-900'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
