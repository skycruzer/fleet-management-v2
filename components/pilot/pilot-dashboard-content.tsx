'use client'

/**
 * Pilot Dashboard Content Component
 *
 * Displays pilot dashboard with certifications, leave balance, and stats.
 * Part of User Story 1: Pilot Portal Authentication & Dashboard (US1)
 *
 * @version 1.0.0
 * @since 2025-10-22
 * @spec 001-missing-core-features
 */

import Link from 'next/link'

interface PilotDashboardContentProps {
  dashboardData: any
}

export default function PilotDashboardContent({ dashboardData }: PilotDashboardContentProps) {
  const { certifications, leave_requests, stats } = dashboardData

  // Categorize certifications by expiry status
  const expiredCerts = certifications?.filter((cert: any) => cert.days_until_expiry < 0) || []
  const expiringSoonCerts =
    certifications?.filter(
      (cert: any) => cert.days_until_expiry >= 0 && cert.days_until_expiry <= 30
    ) || []
  const currentCerts = certifications?.filter((cert: any) => cert.days_until_expiry > 30) || []

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Certifications"
          value={stats?.total_certifications || 0}
          icon="📋"
          color="blue"
        />
        <StatCard title="Expiring Soon" value={expiringSoonCerts.length} icon="⚠️" color="yellow" />
        <StatCard title="Expired" value={expiredCerts.length} icon="🔴" color="red" />
        <StatCard
          title="Pending Leave Requests"
          value={stats?.pending_leave_requests || 0}
          icon="📅"
          color="purple"
        />
      </div>

      {/* Certification Status */}
      <div className="bg-card rounded-lg p-6 shadow">
        <h2 className="text-foreground mb-4 text-xl font-bold">Certification Status</h2>

        {/* Expired Certifications */}
        {expiredCerts.length > 0 && (
          <div className="mb-4 rounded-md bg-[var(--color-status-high-bg)] p-4">
            <h3 className="font-medium text-[var(--color-status-high)]">
              Expired Certifications ({expiredCerts.length})
            </h3>
            <ul className="mt-2 space-y-1">
              {expiredCerts.slice(0, 3).map((cert: any) => (
                <li key={cert.id} className="text-sm text-[var(--color-status-high)]">
                  {cert.check_code} - Expired {Math.abs(cert.days_until_expiry)} days ago
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Expiring Soon Certifications */}
        {expiringSoonCerts.length > 0 && (
          <div className="mb-4 rounded-md bg-[var(--color-status-medium-bg)] p-4">
            <h3 className="font-medium text-[var(--color-status-medium)]">
              Expiring Soon ({expiringSoonCerts.length})
            </h3>
            <ul className="mt-2 space-y-1">
              {expiringSoonCerts.slice(0, 5).map((cert: any) => (
                <li key={cert.id} className="text-sm text-[var(--color-status-medium)]">
                  {cert.check_code} - Expires in {cert.days_until_expiry} days
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Current Certifications */}
        <div className="rounded-md bg-[var(--color-status-low-bg)] p-4">
          <h3 className="font-medium text-[var(--color-status-low)]">
            Current Certifications ({currentCerts.length})
          </h3>
          <p className="mt-1 text-sm text-[var(--color-status-low)]">
            All other certifications are current and valid
          </p>
        </div>
      </div>

      {/* Recent Leave Requests */}
      <div className="bg-card rounded-lg p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-xl font-bold">Recent Leave Requests</h2>
          <Link href="/pilot/leave" className="text-primary hover:text-primary/80 text-sm">
            View All
          </Link>
        </div>

        {leave_requests && leave_requests.length > 0 ? (
          <div className="space-y-3">
            {leave_requests.slice(0, 5).map((request: any) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="text-foreground font-medium">{request.request_type}</p>
                  <p className="text-muted-foreground text-sm">
                    {new Date(request.start_date).toLocaleDateString()} -{' '}
                    {new Date(request.end_date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    (request.workflow_status || request.status) === 'APPROVED'
                      ? 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]'
                      : (request.workflow_status || request.status) === 'DENIED'
                        ? 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]'
                        : 'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)]'
                  }`}
                >
                  {request.workflow_status || request.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No leave requests yet</p>
        )}
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: number
  icon: string
  color: string
}) {
  const colorClasses = {
    blue: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    yellow: 'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)]',
    red: 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]',
    purple: 'bg-primary/10 text-primary',
  }

  return (
    <div className="bg-card rounded-lg p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-foreground mt-2 text-3xl font-bold">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${colorClasses[color as keyof typeof colorClasses]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  )
}
