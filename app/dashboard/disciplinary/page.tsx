import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getMatters, getMatterStats } from '@/lib/services/disciplinary-service'
import { formatDate } from '@/lib/utils/date-utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SeverityBadge, StatusBadge } from '@/components/disciplinary/badges'
import { DisciplinaryFilters } from './components/disciplinary-filters'

interface DisciplinaryPageProps {
  searchParams: Promise<{
    status?: string
    severity?: string
    pilotId?: string
    page?: string
  }>
}

export default async function DisciplinaryPage({ searchParams }: DisciplinaryPageProps) {
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

  const buildPageHref = (pageNum: number) => {
    const qs = new URLSearchParams()
    qs.set('page', String(pageNum))
    if (status) qs.set('status', status)
    if (severity) qs.set('severity', severity)
    return `?${qs.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-xl font-semibold">Disciplinary Matters</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Track and manage disciplinary matters and actions
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/disciplinary/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Matter
          </Link>
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <p className="text-muted-foreground text-sm font-medium">Total Matters</p>
          <p className="text-foreground mt-2 text-3xl font-bold">{stats.totalMatters}</p>
        </Card>
        <Card className="p-6">
          <p className="text-muted-foreground text-sm font-medium">Open Cases</p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-warning-600)]">
            {stats.openMatters}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-muted-foreground text-sm font-medium">Under Review</p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-primary-600)]">
            {stats.underInvestigation}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-muted-foreground text-sm font-medium">Overdue</p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-danger-600)]">
            {stats.overdueMatters}
          </p>
        </Card>
      </div>

      <DisciplinaryFilters currentStatus={status} currentSeverity={severity} />

      <Card className="overflow-hidden">
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
                  <TableCell colSpan={5} className="py-12 text-center">
                    <p className="text-muted-foreground mb-4 text-sm">
                      No disciplinary matters found
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/disciplinary/new">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Create the first matter
                      </Link>
                    </Button>
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
                      <SeverityBadge value={matter.severity} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={matter.status} />
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

        {totalPages > 1 && (
          <div className="bg-card border-border flex items-center justify-between border-t px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button asChild variant="outline" size="sm" disabled={page === 1}>
                <Link
                  href={buildPageHref(page - 1)}
                  aria-disabled={page === 1}
                  className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                >
                  Previous
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" disabled={page === totalPages}>
                <Link
                  href={buildPageHref(page + 1)}
                  aria-disabled={page === totalPages}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                >
                  Next
                </Link>
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <p className="text-foreground/80 text-sm">
                Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> of{' '}
                <span className="font-medium">{totalCount}</span> results
              </p>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Link
                    key={pageNum}
                    href={buildPageHref(pageNum)}
                    aria-current={pageNum === page ? 'page' : undefined}
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
        )}
      </Card>
    </div>
  )
}
