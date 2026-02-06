import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getMatters, getMatterStats } from '@/lib/services/disciplinary-service'
import Link from 'next/link'
import { DisciplinaryFilters } from './components/disciplinary-filters'
// Force dynamic rendering to prevent static generation at build time
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
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
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
        <div className="rounded-lg bg-[var(--color-destructive-muted)] p-6">
          <p className="text-[var(--color-danger-400)]">
            Failed to load disciplinary matters: {mattersResult.error}
          </p>
        </div>
      </div>
    )
  }

  if (!statsResult.success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-[var(--color-destructive-muted)] p-6">
          <p className="text-[var(--color-danger-400)]">
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
        return 'bg-[var(--color-destructive-muted)] text-[var(--color-danger-400)]'
      case 'SERIOUS':
        return 'bg-[var(--color-badge-orange-bg)] text-[var(--color-badge-orange)]'
      case 'MODERATE':
        return 'bg-[var(--color-warning-muted)] text-[var(--color-warning-400)]'
      case 'MINOR':
        return 'bg-[var(--color-info-bg)] text-[var(--color-info)]'
      default:
        return 'bg-muted/30 text-foreground'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-[var(--color-success-muted)] text-[var(--color-success-400)]'
      case 'UNDER_INVESTIGATION':
        return 'bg-[var(--color-warning-muted)] text-[var(--color-warning-400)]'
      case 'ACTION_TAKEN':
        return 'bg-[var(--color-info-bg)] text-[var(--color-info)]'
      case 'APPEALED':
        return 'bg-primary/10 text-primary-foreground'
      default:
        return 'bg-muted/30 text-foreground'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold">Disciplinary Matters</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage disciplinary matters and actions
          </p>
        </div>
        <Link
          href="/dashboard/disciplinary/new"
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary-600)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-700)] focus:ring-2 focus:ring-[var(--color-primary-500)] focus:ring-offset-2 focus:outline-none"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Matter
        </Link>
      </div>

      {/* Statistics Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Total Matters</p>
          <p className="text-foreground mt-2 text-3xl font-bold">{stats.totalMatters}</p>
        </div>
        <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Open Cases</p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-warning-600)]">
            {stats.openMatters}
          </p>
        </div>
        <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Under Investigation</p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-primary-600)]">
            {stats.underInvestigation}
          </p>
        </div>
        <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Overdue</p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-danger-600)]">
            {stats.overdueMatters}
          </p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="bg-card border-border mb-8 rounded-lg border p-6 shadow-sm">
        <h2 className="text-foreground mb-4 text-lg font-semibold">Matter Breakdown</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* By Severity */}
          <div>
            <h3 className="text-foreground/80 mb-3 text-sm font-medium">By Severity</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Critical</span>
                <span className="font-semibold text-[var(--color-danger-600)]">
                  {stats.bySeverity.critical}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Serious</span>
                <span className="font-semibold text-[var(--color-badge-orange)]">
                  {stats.bySeverity.serious}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Moderate</span>
                <span className="font-semibold text-[var(--color-warning-600)]">
                  {stats.bySeverity.moderate}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Minor</span>
                <span className="font-semibold text-[var(--color-primary-600)]">
                  {stats.bySeverity.minor}
                </span>
              </div>
            </div>
          </div>

          {/* By Status */}
          <div>
            <h3 className="text-foreground/80 mb-3 text-sm font-medium">By Status</h3>
            <div className="space-y-2">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">{status.replace(/_/g, ' ')}</span>
                  <span className="text-foreground font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <DisciplinaryFilters currentStatus={status} currentSeverity={severity} />

      {/* Matters Table */}
      <div className="bg-card border-border overflow-hidden rounded-lg border shadow-sm">
        <div className="overflow-x-auto">
          <table className="divide-border min-w-full divide-y">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Title
                </th>
                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Pilot
                </th>
                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Severity
                </th>
                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Status
                </th>
                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Incident Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-border divide-y">
              {matters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted-foreground px-6 py-8 text-center">
                    No disciplinary matters found
                  </td>
                </tr>
              ) : (
                matters.map((matter) => (
                  <tr key={matter.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/disciplinary/${matter.id}`}
                        className="font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
                      >
                        {matter.title}
                      </Link>
                    </td>
                    <td className="text-foreground px-6 py-4 text-sm">
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
                    <td className="text-muted-foreground px-6 py-4 text-sm">
                      {new Date(matter.incident_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-card border-border flex items-center justify-between border-t px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Link
                href={`?page=${page - 1}${status ? `&status=${status}` : ''}${severity ? `&severity=${severity}` : ''}`}
                className={`bg-card text-foreground/80 border-border hover:bg-muted/30 relative inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}
              >
                Previous
              </Link>
              <Link
                href={`?page=${page + 1}${status ? `&status=${status}` : ''}${severity ? `&severity=${severity}` : ''}`}
                className={`bg-card text-foreground/80 border-border hover:bg-muted/30 relative ml-3 inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium ${page === totalPages ? 'pointer-events-none opacity-50' : ''}`}
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Link
                      key={pageNum}
                      href={`?page=${pageNum}${status ? `&status=${status}` : ''}${severity ? `&severity=${severity}` : ''}`}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        pageNum === page
                          ? 'z-10 bg-[var(--color-primary-600)] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-600)]'
                          : 'text-foreground ring-border hover:bg-muted/30 ring-1 ring-inset focus:outline-offset-0'
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
