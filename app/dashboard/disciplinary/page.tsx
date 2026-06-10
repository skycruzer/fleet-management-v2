import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getMatters, getMatterStats } from '@/lib/services/disciplinary-service'
import { formatDate } from '@/lib/utils/date-utils'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DisciplinaryFilters } from './components/disciplinary-filters'
import { DisciplinaryPagination } from './components/disciplinary-pagination'
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

  if (!mattersResult.success || !statsResult.success) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-foreground text-xl font-semibold">Disciplinary Matters</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Track and manage disciplinary matters and actions
          </p>
        </div>
        <div className="border-destructive/20 rounded-lg border bg-[var(--color-destructive-muted)] p-6">
          <p className="text-[var(--color-destructive-muted-foreground)]">
            Failed to load disciplinary matters:{' '}
            {!mattersResult.success ? mattersResult.error : statsResult.error}
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
        return 'bg-[var(--color-destructive-muted)] text-[var(--color-destructive-muted-foreground)]'
      case 'SERIOUS':
        return 'bg-[var(--color-badge-orange-bg)] text-[var(--color-badge-orange)]'
      case 'MODERATE':
        return 'bg-[var(--color-warning-muted)] text-[var(--color-warning-muted-foreground)]'
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
        return 'bg-[var(--color-success-muted)] text-[var(--color-success-muted-foreground)]'
      case 'UNDER_INVESTIGATION':
        return 'bg-[var(--color-warning-muted)] text-[var(--color-warning-muted-foreground)]'
      case 'ACTION_TAKEN':
        return 'bg-[var(--color-info-bg)] text-[var(--color-info)]'
      case 'APPEALED':
        return 'bg-[var(--color-info-bg)] text-[var(--color-info)]'
      default:
        return 'bg-muted/30 text-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-xl font-semibold">Disciplinary Matters</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Track and manage disciplinary matters and actions
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/disciplinary/new">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            New Matter
          </Link>
        </Button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="bg-card border-border rounded-lg border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Total Matters</p>
          <p className="text-foreground mt-1 text-2xl font-bold">{stats.totalMatters}</p>
        </div>
        <div className="bg-card border-border rounded-lg border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Open Cases</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-warning-600)]">
            {stats.openMatters}
          </p>
        </div>
        <div className="bg-card border-border rounded-lg border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Under Investigation</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-primary-600)]">
            {stats.underInvestigation}
          </p>
        </div>
        <div className="bg-card border-border rounded-lg border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Overdue</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-danger-600)]">
            {stats.overdueMatters}
          </p>
        </div>
      </div>

      {/* Filters */}
      <DisciplinaryFilters currentStatus={status} currentSeverity={severity} />

      {/* Matters Table */}
      <div className="bg-card border-border overflow-hidden rounded-lg border shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Pilot</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Incident Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                    No disciplinary matters found
                  </TableCell>
                </TableRow>
              ) : (
                matters.map((matter) => (
                  <TableRow key={matter.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/disciplinary/${matter.id}`}
                        className="font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
                      >
                        {matter.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-foreground text-sm">
                      {matter.pilot
                        ? `${matter.pilot.role} ${matter.pilot.first_name} ${matter.pilot.last_name}`
                        : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-sm px-2 py-1 text-xs font-semibold ${getSeverityBadgeColor(matter.severity)}`}
                      >
                        {matter.severity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-sm px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(matter.status)}`}
                      >
                        {matter.status.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(matter.incident_date)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t p-4">
            <DisciplinaryPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={pageSize}
            />
          </div>
        )}
      </div>
    </div>
  )
}
