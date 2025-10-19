/**
 * Dashboard Page
 * Main dashboard showing fleet metrics and status
 * Individual widgets wrapped with ErrorBoundary for resilience
 */

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
        <p className="text-gray-600 mt-1">
          Fleet overview and key metrics
        </p>
      </div>

      {/* Metrics Grid */}
      <ErrorBoundary
        fallback={
          <Card className="p-6 border-yellow-200 bg-yellow-50">
            <p className="text-center text-gray-600">
              Unable to load metrics. Please refresh the page.
            </p>
          </Card>
        }
        onError={(error) => {
          console.error('Dashboard Metrics Error:', error)
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <ErrorBoundary
        fallback={
          <Card className="p-6 border-yellow-200 bg-yellow-50">
            <p className="text-center text-gray-600">
              Unable to load certification status. Please refresh the page.
            </p>
          </Card>
        }
        onError={(error) => {
          console.error('Dashboard Certifications Error:', error)
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
      <ErrorBoundary
        fallback={
          <Card className="p-6 border-yellow-200 bg-yellow-50">
            <p className="text-center text-gray-600">
              Unable to load expiring certifications. Please refresh the page.
            </p>
          </Card>
        }
        onError={(error) => {
          console.error('Dashboard Expiring Certifications Error:', error)
        }}
      >
        {expiringCerts.length > 0 && (
          <Card className="p-6 border-yellow-200 bg-yellow-50">
            <div className="flex items-start space-x-4">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {expiringCerts.length} Certification
                  {expiringCerts.length > 1 ? 's' : ''} Expiring Soon
                </h3>
                <p className="text-gray-600 mt-1">
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
                      <span className="text-gray-500">
                        {cert.status.daysUntilExpiry} days left
                      </span>
                    </div>
                  ))}
                  {expiringCerts.length > 5 && (
                    <p className="text-sm text-gray-500 mt-2">
                      +{expiringCerts.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
      </ErrorBoundary>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
    blue: 'bg-blue-50 border-blue-200',
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
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
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
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
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
      className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all"
    >
      <div className="flex items-start space-x-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </a>
  )
}
