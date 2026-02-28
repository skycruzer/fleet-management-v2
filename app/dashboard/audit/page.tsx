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
  searchParams: {
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
  }
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
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
          <p className="text-[var(--color-danger-400)]">Failed to load audit data: {fetchError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">
          Complete audit trail of all system changes and activities
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Logs */}
        <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Logs</p>
              <p className="text-foreground mt-2 text-3xl font-bold">{stats.totalLogs}</p>
            </div>
            <div className="rounded-full bg-[var(--color-info-bg)] p-3">
              <svg
                className="h-6 w-6 text-[var(--color-primary-600)]"
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
            </div>
          </div>
        </div>

        {/* Unique Users */}
        <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Unique Users</p>
              <p className="text-foreground mt-2 text-3xl font-bold">{stats.totalUsers}</p>
            </div>
            <div className="rounded-full bg-[var(--color-success-muted)] p-3">
              <svg
                className="h-6 w-6 text-[var(--color-success-600)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Tables Monitored */}
        <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Tables Monitored</p>
              <p className="text-foreground mt-2 text-3xl font-bold">{stats.totalTables}</p>
            </div>
            <div className="bg-primary/10 rounded-full p-3">
              <svg
                className="text-primary h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Activity (30d)</p>
              <p className="text-foreground mt-2 text-3xl font-bold">
                {stats.recentActivity.reduce((sum, day) => sum + day.count, 0)}
              </p>
            </div>
            <div className="rounded-full bg-[var(--color-badge-orange-bg)] p-3">
              <svg
                className="h-6 w-6 text-[var(--color-badge-orange)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Breakdown */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-card border-border rounded-lg border p-4">
          <p className="text-muted-foreground text-sm font-medium">Inserts</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-success-600)]">
            {stats.actionBreakdown.INSERT || 0}
          </p>
        </div>
        <div className="bg-card border-border rounded-lg border p-4">
          <p className="text-muted-foreground text-sm font-medium">Updates</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-primary-600)]">
            {stats.actionBreakdown.UPDATE || 0}
          </p>
        </div>
        <div className="bg-card border-border rounded-lg border p-4">
          <p className="text-muted-foreground text-sm font-medium">Deletes</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-danger-600)]">
            {stats.actionBreakdown.DELETE || 0}
          </p>
        </div>
        <div className="bg-card border-border rounded-lg border p-4">
          <p className="text-muted-foreground text-sm font-medium">Restores</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-warning-600)]">
            {stats.actionBreakdown.RESTORE || 0}
          </p>
        </div>
        <div className="bg-card border-border rounded-lg border p-4">
          <p className="text-muted-foreground text-sm font-medium">Soft Deletes</p>
          <p className="text-muted-foreground mt-1 text-2xl font-bold">
            {stats.actionBreakdown.SOFT_DELETE || 0}
          </p>
        </div>
      </div>

      {/* Export Button */}
      <div className="mb-6 flex justify-end">
        <a
          href={`/api/audit/export?${new URLSearchParams(
            Object.fromEntries(
              Object.entries(searchParams).filter(([_, v]) => v != null) as [string, string][]
            )
          ).toString()}`}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary-600)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-700)] focus:ring-2 focus:ring-[var(--color-primary-500)] focus:ring-offset-2 focus:outline-none"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export to CSV
        </a>
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
