import { memo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { getDashboardMetrics, type DashboardMetrics } from '@/lib/services/dashboard-service'
import {
  getExpiringCertifications,
  type ExpiringCertification,
} from '@/lib/services/expiring-certifications-service'
import { ErrorBoundary } from '@/components/error-boundary'
import { RosterPeriodCarousel } from '@/components/dashboard/roster-period-carousel'
import { HeroStatsServer } from '@/components/dashboard/hero-stats-server'
import { ComplianceOverviewServer } from '@/components/dashboard/compliance-overview-server'
import {
  Users,
  Star,
  User,
  CheckCircle,
  AlertCircle,
  Circle,
  Plus,
  FileText,
  BarChart3,
  AlertTriangle,
} from 'lucide-react'
import { getCachedData, setCachedData } from '@/lib/services/cache-service'

// Cached data fetching function
async function getCachedDashboardData(): Promise<DashboardMetrics> {
  const cacheKey = 'dashboard:metrics'
  const cached = await getCachedData<DashboardMetrics>(cacheKey)
  if (cached) return cached

  const data = await getDashboardMetrics()
  await setCachedData(cacheKey, data, 60) // 60 second cache
  return data
}

async function getCachedExpiringCerts(): Promise<ExpiringCertification[]> {
  const cacheKey = 'dashboard:expiring-certs:30'
  const cached = await getCachedData<ExpiringCertification[]>(cacheKey)
  if (cached) return cached

  const data = await getExpiringCertifications(30)
  await setCachedData(cacheKey, data, 60) // 60 second cache
  return data
}

export async function DashboardContent() {
  // Fetch dashboard data with caching
  const [metrics, expiringCerts] = await Promise.all([
    getCachedDashboardData(),
    getCachedExpiringCerts(),
  ])

  return (
    <>
      {/* Professional Hero Stats - Real Data */}
      <ErrorBoundary>
        <HeroStatsServer />
      </ErrorBoundary>

      {/* Professional Compliance Overview - Real Data */}
      <ErrorBoundary>
        <ComplianceOverviewServer />
      </ErrorBoundary>

      {/* Roster Period Carousel */}
      <ErrorBoundary>
        <RosterPeriodCarousel />
      </ErrorBoundary>

      {/* Original Metrics Grid (Keep for now for additional data) */}
      <ErrorBoundary>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Pilots"
            value={metrics.pilots.total}
            subtitle={`${metrics.pilots.active} active`}
            icon={<Users className="text-primary h-8 w-8" aria-hidden="true" />}
            color="blue"
          />
          <MetricCard
            title="Captains"
            value={metrics.pilots.captains}
            subtitle={`${metrics.pilots.trainingCaptains} training`}
            icon={<Star className="h-8 w-8 text-purple-600" aria-hidden="true" />}
            color="purple"
          />
          <MetricCard
            title="First Officers"
            value={metrics.pilots.firstOfficers}
            subtitle="Active roster"
            icon={<User className="h-8 w-8 text-green-600" aria-hidden="true" />}
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
            icon={
              <CheckCircle
                className={`h-8 w-8 ${metrics.certifications.complianceRate >= 95 ? 'text-green-600' : metrics.certifications.complianceRate >= 85 ? 'text-yellow-600' : 'text-red-600'}`}
                aria-hidden="true"
              />
            }
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CertificationCard
            title="Expired"
            count={metrics.certifications.expired}
            color="red"
            icon={<AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />}
          />
          <CertificationCard
            title="Expiring Soon"
            count={metrics.certifications.expiring}
            subtitle="Within 30 days"
            color="yellow"
            icon={<AlertCircle className="h-6 w-6 text-yellow-600" aria-hidden="true" />}
          />
          <CertificationCard
            title="Current"
            count={metrics.certifications.current}
            color="green"
            icon={<Circle className="h-6 w-6 fill-green-600 text-green-600" aria-hidden="true" />}
          />
        </div>
      </ErrorBoundary>

      {/* Expiring Certifications Alert */}
      <ErrorBoundary>
        {expiringCerts.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50 p-6">
            <div className="flex items-start space-x-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600" aria-hidden="true" />
              <div className="flex-1">
                <h3 className="text-foreground text-lg font-semibold">
                  {expiringCerts.length} Certification
                  {expiringCerts.length > 1 ? 's' : ''} Expiring Soon
                </h3>
                <p className="text-muted-foreground mt-1">
                  Review and renew certifications expiring within 30 days
                </p>
                <div className="mt-4 space-y-2">
                  {expiringCerts.slice(0, 5).map((cert) => (
                    <div
                      key={`${cert.employeeId}-${cert.checkCode}-${cert.expiryDate.toISOString()}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-card-foreground">
                        {cert.pilotName} - {cert.checkDescription}
                      </span>
                      <span className="text-muted-foreground">
                        {cert.status.daysUntilExpiry} days left
                      </span>
                    </div>
                  ))}
                  {expiringCerts.length > 5 && (
                    <p className="text-muted-foreground mt-2 text-sm">
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
        <h3 className="text-foreground mb-4 text-lg font-semibold">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ActionCard
            title="Add Pilot"
            description="Add a new pilot to the fleet"
            icon={<Plus className="text-primary h-6 w-6" aria-hidden="true" />}
            href="/dashboard/pilots/new"
          />
          <ActionCard
            title="Update Certification"
            description="Record a new certification check"
            icon={<FileText className="text-primary h-6 w-6" aria-hidden="true" />}
            href="/dashboard/certifications/new"
          />
          <ActionCard
            title="View Reports"
            description="Access analytics and reports"
            icon={<BarChart3 className="text-primary h-6 w-6" aria-hidden="true" />}
            href="/dashboard/analytics"
          />
        </div>
      </div>
    </>
  )
}

// Memoized components for performance
const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string
  value: number | string
  subtitle: string
  icon: React.ReactNode
  color: 'blue' | 'purple' | 'green' | 'yellow' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-primary/5 border-primary/20',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-destructive/20',
  }

  return (
    <Card className={`p-6 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-foreground mt-2 text-3xl font-bold">{value}</p>
          <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center">{icon}</div>
      </div>
    </Card>
  )
})

const CertificationCard = memo(function CertificationCard({
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
  icon: React.ReactNode
}) {
  const colorClasses = {
    red: 'bg-red-50 border-destructive/20',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
  }

  return (
    <Card className={`p-6 ${colorClasses[color]}`}>
      <div className="flex items-center space-x-3">
        <div className="flex h-6 w-6 items-center justify-center">{icon}</div>
        <div>
          <p className="text-foreground text-2xl font-bold">{count}</p>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          {subtitle && <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>}
        </div>
      </div>
    </Card>
  )
})

const ActionCard = memo(function ActionCard({
  title,
  description,
  icon,
  href,
}: {
  title: string
  description: string
  icon: React.ReactNode
  href: string
}) {
  return (
    <Link
      href={href}
      className="border-border block rounded-lg border p-6 transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-start space-x-3">
        <div className="flex h-6 w-6 items-center justify-center">{icon}</div>
        <div>
          <h4 className="text-foreground font-semibold">{title}</h4>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>
      </div>
    </Link>
  )
})
