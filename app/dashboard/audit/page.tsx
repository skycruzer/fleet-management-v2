import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import {
  getAuditLogs,
  getAuditStats,
  type AuditStats,
  type AuditLogFilters as AuditLogFiltersType,
} from '@/lib/services/audit-service'
import AuditLogTable from '@/components/audit/audit-log-table'
import AuditLogFilters from '@/components/audit/audit-log-filters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layout/page-header'
import { FileText, Users, Table2, Calendar, Download } from 'lucide-react'
// Force dynamic rendering to prevent static generation at build time
/**
 * Audit Log Viewer Page (Admin)
 *
 * Admin-only page for viewing complete audit trail of all system changes.
 * Features filtering, searching, pagination, and CSV export capabilities.
 *
 * @spec 001-missing-core-features (US4, T072)
 */

interface AuditPageProps {
  searchParams: Promise<{
    userEmail?: string
    tableName?: string
    action?: string
    recordId?: string
    startDate?: string
    endDate?: string
    searchQuery?: string
    page?: string
    pageSize?: string
    sortBy?: string
    sortOrder?: string
  }>
}

export default async function AuditPage(props: AuditPageProps) {
  // Next.js 16: searchParams is a Promise and must be awaited
  const searchParams = await props.searchParams

  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  // Parse filter parameters
  const filters: AuditLogFiltersType = {}

  if (searchParams.userEmail) {
    filters.userEmail = searchParams.userEmail
  }

  if (searchParams.tableName) {
    filters.tableName = searchParams.tableName
  }

  if (searchParams.action) {
    filters.action = searchParams.action
  }

  if (searchParams.recordId) {
    filters.recordId = searchParams.recordId
  }

  if (searchParams.startDate) {
    filters.startDate = new Date(searchParams.startDate)
  }

  if (searchParams.endDate) {
    filters.endDate = new Date(searchParams.endDate)
  }

  if (searchParams.searchQuery) {
    filters.searchQuery = searchParams.searchQuery
  }

  const page = parseInt(searchParams.page || '1')
  if (!isNaN(page) && page > 0) {
    filters.page = page
  }

  const pageSize = parseInt(searchParams.pageSize || '20')
  if (!isNaN(pageSize) && pageSize > 0 && pageSize <= 100) {
    filters.pageSize = pageSize
  }

  const validSortBy = ['created_at', 'user_email', 'table_name', 'action'] as const
  if (
    searchParams.sortBy &&
    validSortBy.includes(searchParams.sortBy as (typeof validSortBy)[number])
  ) {
    filters.sortBy = searchParams.sortBy as (typeof validSortBy)[number]
  }

  const validSortOrder = ['asc', 'desc'] as const
  if (
    searchParams.sortOrder &&
    validSortOrder.includes(searchParams.sortOrder as (typeof validSortOrder)[number])
  ) {
    filters.sortOrder = searchParams.sortOrder as (typeof validSortOrder)[number]
  }

  // Fetch audit logs and stats
  let logs: Awaited<ReturnType<typeof getAuditLogs>>['logs'] = []
  let pagination = { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 }
  let stats: AuditStats = {
    totalLogs: 0,
    totalUsers: 0,
    totalTables: 0,
    actionBreakdown: { INSERT: 0, UPDATE: 0, DELETE: 0, RESTORE: 0, SOFT_DELETE: 0 },
    tableActivity: [],
    userActivity: [],
    recentActivity: [],
  }
  let fetchError: string | null = null

  try {
    const [logsResult, statsResult] = await Promise.all([
      getAuditLogs(filters),
      getAuditStats(filters.startDate, filters.endDate),
    ])

    logs = logsResult.logs
    pagination = {
      page: logsResult.page,
      pageSize: logsResult.pageSize,
      totalCount: logsResult.totalCount,
      totalPages: logsResult.totalPages,
    }
    stats = statsResult
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'Unknown error'
  }

  if (fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-[var(--color-destructive-muted)] p-6">
          <p className="text-[var(--color-destructive-muted-foreground)]">
            Failed to load audit data: {fetchError}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Audit Logs"
        description="Complete audit trail of all system changes and activities"
        actions={
          <Button asChild variant="outline">
            <a
              href={`/api/audit/export?${new URLSearchParams(
                Object.fromEntries(
                  Object.entries(searchParams).filter(([_, v]) => v != null) as [string, string][]
                )
              ).toString()}`}
            >
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              Export to CSV
            </a>
          </Button>
        }
      />

      {/* Statistics Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="bg-card border-border rounded-lg border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-medium">Total Logs</p>
            <FileText className="text-muted-foreground h-4 w-4" aria-hidden="true" />
          </div>
          <p className="text-foreground mt-1 text-2xl font-bold">{stats.totalLogs}</p>
        </div>
        <div className="bg-card border-border rounded-lg border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-medium">Unique Users</p>
            <Users className="text-muted-foreground h-4 w-4" aria-hidden="true" />
          </div>
          <p className="text-foreground mt-1 text-2xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-card border-border rounded-lg border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-medium">Tables Monitored</p>
            <Table2 className="text-muted-foreground h-4 w-4" aria-hidden="true" />
          </div>
          <p className="text-foreground mt-1 text-2xl font-bold">{stats.totalTables}</p>
        </div>
        <div className="bg-card border-border rounded-lg border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-medium">Activity (30d)</p>
            <Calendar className="text-muted-foreground h-4 w-4" aria-hidden="true" />
          </div>
          <p className="text-foreground mt-1 text-2xl font-bold">
            {stats.recentActivity.reduce((sum, day) => sum + day.count, 0)}
          </p>
        </div>
      </div>

      {/* Actions Breakdown */}
      <div className="flex flex-wrap items-center gap-2">
        {(['INSERT', 'UPDATE', 'DELETE', 'RESTORE', 'SOFT_DELETE'] as const).map((action) => (
          <Badge key={action} size="sm" variant="secondary">
            {action.replace(/_/g, ' ')} {stats.actionBreakdown[action] || 0}
          </Badge>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Suspense
          fallback={
            <div className="bg-card border-border rounded-lg border p-6">
              <p className="text-muted-foreground">Loading filters...</p>
            </div>
          }
        >
          <AuditLogFilters currentFilters={searchParams} />
        </Suspense>
      </div>

      {/* Audit Log Table */}
      <Suspense
        fallback={
          <div className="bg-card border-border rounded-lg border p-6">
            <p className="text-muted-foreground">Loading audit logs...</p>
          </div>
        }
      >
        <AuditLogTable logs={logs} pagination={pagination} />
      </Suspense>
    </div>
  )
}
