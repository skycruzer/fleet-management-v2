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
  const expiringSoonCerts = certifications?.filter(
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
        <StatCard
          title="Expiring Soon"
          value={expiringSoonCerts.length}
          icon="⚠️"
          color="yellow"
        />
        <StatCard
          title="Expired"
          value={expiredCerts.length}
          icon="🔴"
          color="red"
        />
        <StatCard
          title="Pending Leave Requests"
          value={stats?.pending_leave_requests || 0}
          icon="📅"
          color="purple"
        />
      </div>

      {/* Certification Status */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          Certification Status
        </h2>

        {/* Expired Certifications */}
        {expiredCerts.length > 0 && (
          <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <h3 className="font-medium text-red-800 dark:text-red-200">
              Expired Certifications ({expiredCerts.length})
            </h3>
            <ul className="mt-2 space-y-1">
              {expiredCerts.slice(0, 3).map((cert: any) => (
                <li key={cert.id} className="text-sm text-red-700 dark:text-red-300">
                  {cert.check_code} - Expired {Math.abs(cert.days_until_expiry)} days ago
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Expiring Soon Certifications */}
        {expiringSoonCerts.length > 0 && (
          <div className="mb-4 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
              Expiring Soon ({expiringSoonCerts.length})
            </h3>
            <ul className="mt-2 space-y-1">
              {expiringSoonCerts.slice(0, 5).map((cert: any) => (
                <li key={cert.id} className="text-sm text-yellow-700 dark:text-yellow-300">
                  {cert.check_code} - Expires in {cert.days_until_expiry} days
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Current Certifications */}
        <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
          <h3 className="font-medium text-green-800 dark:text-green-200">
            Current Certifications ({currentCerts.length})
          </h3>
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            All other certifications are current and valid
          </p>
        </div>
      </div>

      {/* Recent Leave Requests */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recent Leave Requests
          </h2>
          <Link
            href="/pilot/leave"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            View All
          </Link>
        </div>

        {leave_requests && leave_requests.length > 0 ? (
          <div className="space-y-3">
            {leave_requests.slice(0, 5).map((request: any) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-md border border-gray-200 p-3 dark:border-gray-700"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {request.request_type}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(request.start_date).toLocaleDateString()} -{' '}
                    {new Date(request.end_date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    request.status === 'APPROVED'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : request.status === 'DENIED'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}
                >
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No leave requests yet</p>
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
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    purple: 'bg-primary/5 text-primary dark:bg-purple-900/20 dark:text-primary',
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${colorClasses[color as keyof typeof colorClasses]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  )
}
