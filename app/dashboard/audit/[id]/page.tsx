import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getAuditLogById } from '@/lib/services/audit-service'
import AuditLogDetail from '@/components/audit/audit-log-detail'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { ArrowLeft, ArrowRight } from 'lucide-react'
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
  params: Promise<{
    id: string
  }>
}

export default async function AuditDetailPage(props: AuditDetailPageProps) {
  // Next.js 16: params is a Promise and must be awaited
  const params = await props.params

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
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Audit Log Detail"
        description={`Complete details of audit record #${params.id.slice(0, 8)}`}
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/audit">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to Audit Logs
            </Link>
          </Button>
        }
      />

      {/* Audit Log Metadata */}
      <div className="bg-card border-border mb-8 rounded-lg border p-6 shadow-sm">
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
                    ? 'bg-[var(--color-success-muted)] text-[var(--color-success-muted-foreground)]'
                    : auditLog.action === 'UPDATE'
                      ? 'bg-[var(--color-info-bg)] text-[var(--color-info)]'
                      : auditLog.action === 'DELETE'
                        ? 'bg-[var(--color-destructive-muted)] text-[var(--color-destructive-muted-foreground)]'
                        : 'text-foreground bg-muted/30'
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
      <div className="bg-card border-border mt-8 rounded-lg border p-6 shadow-sm">
        <h2 className="text-foreground mb-4 text-lg font-semibold">Additional Metadata</h2>
        <div className="space-y-3 text-sm">
          {auditLog.ip_address && (
            <div className="border-border flex flex-col gap-1 border-b pb-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground font-medium">IP Address</span>
              <span className="text-foreground font-mono">{auditLog.ip_address}</span>
            </div>
          )}
          {auditLog.user_agent && (
            <div className="border-border flex flex-col gap-1 border-b pb-2 sm:flex-row sm:items-start sm:justify-between">
              <span className="text-muted-foreground font-medium">User Agent</span>
              <span className="text-foreground max-w-md truncate text-right font-mono text-xs">
                {auditLog.user_agent}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground font-medium">Record Created</span>
            <span className="text-foreground">
              {new Date(auditLog.created_at).toLocaleString('en-AU', {
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
      {auditLog.record_id && (
        <div className="mt-8 flex justify-end">
          <Button asChild>
            <Link href={`/dashboard/audit?recordId=${auditLog.record_id}`}>
              View All Changes to This Record
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
