/**
 * Dashboard Page
 * Main dashboard showing fleet metrics and status
 * Individual widgets wrapped with ErrorBoundary for resilience
 */

export const dynamic = 'force-dynamic'

import { Card } from '@/components/ui/card'
import { getDashboardMetrics } from '@/lib/services/dashboard-service'
import { getExpiringCertifications } from '@/lib/services/expiring-certifications-service'
import { ErrorBoundary } from '@/components/error-boundary'

export default async function DashboardPage() {
  // Fetch dashboard data
  const [metrics, expiringCerts] = await Promise.all([
    getDashboardMetrics(),
    getExpiringCertifications(30),
  ])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-gray-600">Fleet overview and key metrics</p>
      </div>

      {/* Metrics Grid */}
      <ErrorBoundary>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Pilots"
            value={metrics.pilots.total}
            subtitle={`${metrics.pilots.active} active`}
            icon="👨‍✈️"
            color="blue"
          />
          <MetricCard
            title="Captains"
            value={metrics.pilots.captains}
            subtitle={`${metrics.pilots.trainingCaptains} training`}
            icon="⭐"
            color="purple"
          />
          <MetricCard
            title="First Officers"
            value={metrics.pilots.firstOfficers}
            subtitle="Active roster"
            icon="👤"
            color="green"
          />
          <MetricCard
            title="Compliance Rate"
            value={`${Math.round(metrics.certifications.complianceRate)}%`}
            subtitle={
              metrics.certifications.complianceRate >= 95
                ? 'Excellent'
                : metrics.certifications.complianceRate >= 85
                  ? 'Good'
                  : 'Needs attention'
            }
            icon="✅"
            color={
              metrics.certifications.complianceRate >= 95
                ? 'green'
                : metrics.certifications.complianceRate >= 85
                  ? 'yellow'
                  : 'red'
            }
          />
        </div>
      </ErrorBoundary>

      {/* Certifications Overview */}
      <ErrorBoundary>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <CertificationCard
            title="Expired"
            count={metrics.certifications.expired}
            color="red"
            icon="🔴"
          />
          <CertificationCard
            title="Expiring Soon"
            count={metrics.certifications.expiring}
            subtitle="Within 30 days"
            color="yellow"
            icon="🟡"
          />
          <CertificationCard
            title="Current"
            count={metrics.certifications.current}
            color="green"
            icon="🟢"
          />
        </div>
      </ErrorBoundary>

      {/* Expiring Certifications Alert */}
      <ErrorBoundary>
        {expiringCerts.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50 p-6">
            <div className="flex items-start space-x-4">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {expiringCerts.length} Certification
                  {expiringCerts.length > 1 ? 's' : ''} Expiring Soon
                </h3>
                <p className="mt-1 text-gray-600">
                  Review and renew certifications expiring within 30 days
                </p>
                <div className="mt-4 space-y-2">
                  {expiringCerts.slice(0, 5).map((cert) => (
                    <div
                      key={`${cert.employeeId}-${cert.checkCode}-${cert.expiryDate.toISOString()}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700">
                        {cert.pilotName} - {cert.checkDescription}
                      </span>
                      <span className="text-gray-500">{cert.status.daysUntilExpiry} days left</span>
                    </div>
                  ))}
                  {expiringCerts.length > 5 && (
                    <p className="mt-2 text-sm text-gray-500">+{expiringCerts.length - 5} more</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
      </ErrorBoundary>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ActionCard
            title="Add Pilot"
            description="Add a new pilot to the fleet"
            icon="➕"
            href="/dashboard/pilots/new"
          />
          <ActionCard
            title="Update Certification"
            description="Record a new certification check"
            icon="📋"
            href="/dashboard/certifications/new"
          />
          <ActionCard
            title="View Reports"
            description="Access analytics and reports"
            icon="📊"
            href="/dashboard/analytics"
          />
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string
  value: number | string
  subtitle: string
  icon: string
  color: 'blue' | 'purple' | 'green' | 'yellow' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-primary/5 border-primary/20',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
  }

  return (
    <Card className={`p-6 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </Card>
  )
}

function CertificationCard({
  title,
  count,
  subtitle,
  color,
  icon,
}: {
  title: string
  count: number
  subtitle?: string
  color: 'red' | 'yellow' | 'green'
  icon: string
}) {
  const colorClasses = {
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
  }

  return (
    <Card className={`p-6 ${colorClasses[color]}`}>
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-2xl font-bold text-gray-900">{count}</p>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </Card>
  )
}

function ActionCard({
  title,
  description,
  icon,
  href,
}: {
  title: string
  description: string
  icon: string
  href: string
}) {
  return (
    <a
      href={href}
      className="block rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-start space-x-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </a>
  )
}
