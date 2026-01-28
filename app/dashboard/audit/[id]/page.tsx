import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getAuditLogById } from '@/lib/services/audit-service'
import AuditLogDetail from '@/components/audit/AuditLogDetail'
import Link from 'next/link'
// Force dynamic rendering to prevent static generation at build time
/**
 * Audit Log Detail Page (Admin)
 *
 * Detailed view of a single audit log record.
 * Displays full audit entry including old/new value comparison.
 *
 * @spec 001-missing-core-features (US4, T073)
 */

interface AuditDetailPageProps {
  params: {
    id: string
  }
}

export default async function AuditDetailPage({ params }: AuditDetailPageProps) {
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(params.id)) {
    notFound()
  }

  // Fetch audit log
  const auditLog = await getAuditLogById(params.id)

  if (!auditLog) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/dashboard/audit"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Audit Logs
        </Link>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-foreground text-3xl font-bold">Audit Log Detail</h1>
        <p className="text-muted-foreground mt-2">
          Complete details of audit record #{params.id.slice(0, 8)}
        </p>
      </div>

      {/* Audit Log Metadata */}
      <div className="bg-card mb-8 rounded-lg border border-white/[0.08] p-6 shadow-sm">
        <h2 className="text-foreground mb-4 text-lg font-semibold">Record Information</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm font-medium">User</p>
            <p className="text-foreground mt-1">{auditLog.user_email || 'System'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Action</p>
            <p className="mt-1">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  auditLog.action === 'INSERT'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : auditLog.action === 'UPDATE'
                      ? 'bg-blue-500/10 text-blue-400'
                      : auditLog.action === 'DELETE'
                        ? 'bg-red-500/10 text-red-400'
                        : 'text-foreground bg-white/[0.03]'
                }`}
              >
                {auditLog.action}
              </span>
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Table</p>
            <p className="text-foreground mt-1 font-mono text-sm">{auditLog.table_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Record ID</p>
            <p className="text-foreground mt-1 font-mono text-sm">{auditLog.record_id || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Timestamp</p>
            <p className="text-foreground mt-1">{new Date(auditLog.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Audit ID</p>
            <p className="text-muted-foreground mt-1 font-mono text-xs">{auditLog.id}</p>
          </div>
        </div>

        {auditLog.description && (
          <div className="mt-4">
            <p className="text-muted-foreground text-sm font-medium">Description</p>
            <p className="text-foreground mt-1">{auditLog.description}</p>
          </div>
        )}
      </div>

      {/* Audit Log Detail Component (Old/New Values) */}
      <AuditLogDetail auditLog={auditLog} />

      {/* Metadata Section */}
      <div className="bg-card mt-8 rounded-lg border border-white/[0.08] p-6 shadow-sm">
        <h2 className="text-foreground mb-4 text-lg font-semibold">Additional Metadata</h2>
        <div className="space-y-3 text-sm">
          {auditLog.ip_address && (
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <span className="text-muted-foreground font-medium">IP Address</span>
              <span className="text-foreground font-mono">{auditLog.ip_address}</span>
            </div>
          )}
          {auditLog.user_agent && (
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-2">
              <span className="text-muted-foreground font-medium">User Agent</span>
              <span className="text-foreground max-w-md truncate text-right font-mono text-xs">
                {auditLog.user_agent}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Record Created</span>
            <span className="text-foreground">
              {new Date(auditLog.created_at).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="mt-8 flex justify-between">
        <Link
          href="/dashboard/audit"
          className="text-foreground/80 inline-flex items-center gap-2 rounded-md border border-white/[0.1] px-4 py-2 text-sm font-medium transition-colors hover:bg-white/[0.03] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Audit Logs
        </Link>

        {auditLog.record_id && (
          <Link
            href={`/dashboard/audit?recordId=${auditLog.record_id}`}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            View All Changes to This Record
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        )}
      </div>
    </div>
  )
}
