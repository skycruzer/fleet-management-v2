import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getAuditLogById } from '@/lib/services/audit-service'
import AuditLogDetail from '@/components/audit/AuditLogDetail'
import Link from 'next/link'

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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(params.id)) {
    notFound()
  }

  // Fetch audit log
  const result = await getAuditLogById(params.id)

  if (!result.success || !result.data) {
    notFound()
  }

  const auditLog = result.data

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/dashboard/audit"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Log Detail</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Complete details of audit record #{params.id.slice(0, 8)}
        </p>
      </div>

      {/* Audit Log Metadata */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Record Information
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">User</p>
            <p className="mt-1 text-gray-900 dark:text-white">{auditLog.user_email || 'System'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Action</p>
            <p className="mt-1">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  auditLog.action === 'INSERT'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : auditLog.action === 'UPDATE'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      : auditLog.action === 'DELETE'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}
              >
                {auditLog.action}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Table</p>
            <p className="mt-1 font-mono text-sm text-gray-900 dark:text-white">
              {auditLog.table_name}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Record ID</p>
            <p className="mt-1 font-mono text-sm text-gray-900 dark:text-white">
              {auditLog.record_id || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Timestamp</p>
            <p className="mt-1 text-gray-900 dark:text-white">
              {new Date(auditLog.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Audit ID</p>
            <p className="mt-1 font-mono text-xs text-gray-600 dark:text-gray-400">
              {auditLog.id}
            </p>
          </div>
        </div>

        {auditLog.description && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</p>
            <p className="mt-1 text-gray-900 dark:text-white">{auditLog.description}</p>
          </div>
        )}
      </div>

      {/* Audit Log Detail Component (Old/New Values) */}
      <AuditLogDetail auditLog={auditLog} />

      {/* Metadata Section */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Additional Metadata
        </h2>
        <div className="space-y-3 text-sm">
          {auditLog.ip_address && (
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
              <span className="font-medium text-gray-600 dark:text-gray-400">IP Address</span>
              <span className="font-mono text-gray-900 dark:text-white">{auditLog.ip_address}</span>
            </div>
          )}
          {auditLog.user_agent && (
            <div className="flex items-start justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
              <span className="font-medium text-gray-600 dark:text-gray-400">User Agent</span>
              <span className="max-w-md truncate text-right font-mono text-xs text-gray-900 dark:text-white">
                {auditLog.user_agent}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-400">Record Created</span>
            <span className="text-gray-900 dark:text-white">
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
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
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
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            View All Changes to This Record
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
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
