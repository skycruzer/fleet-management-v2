import { getDashboardMetrics } from '@/lib/services/dashboard-service'
import { HeroStatsClient } from './hero-stats-client'

/**
 * Server Component - Fetches real dashboard metrics and passes to client component
 * No mock data - all data comes from the database via dashboard-service
 */
export async function HeroStatsServer() {
  const metrics = await getDashboardMetrics(true) // Use cache for performance

  const stats = [
    {
      title: 'Total Pilots',
      value: metrics.pilots.total,
      subtitle: 'Active fleet members',
      icon: 'Users',
      trend: undefined, // TODO: Calculate trend from historical data
      gradientFrom: 'from-primary-500',
      gradientTo: 'to-primary-700',
      iconColor: 'text-primary-600',
    },
    {
      title: 'Certifications',
      value: metrics.certifications.total,
      subtitle: 'Total active certifications',
      icon: 'FileCheck',
      trend: undefined, // TODO: Calculate trend from historical data
      gradientFrom: 'from-success-500',
      gradientTo: 'to-success-700',
      iconColor: 'text-success-600',
    },
    {
      title: 'Compliance Rate',
      value: `${metrics.certifications.complianceRate}%`,
      subtitle: 'Fleet-wide compliance',
      icon: 'TrendingUp',
      trend: undefined, // TODO: Calculate trend from historical data
      gradientFrom: 'from-accent-500',
      gradientTo: 'to-accent-700',
      iconColor: 'text-accent-600',
    },
    {
      title: 'Leave Requests',
      value: metrics.leave.pending,
      subtitle: 'Pending approval',
      icon: 'Calendar',
      trend: undefined, // TODO: Calculate trend from historical data
      gradientFrom: 'from-warning-500',
      gradientTo: 'to-warning-700',
      iconColor: 'text-warning-600',
    },
  ]

  return <HeroStatsClient stats={stats} />
}
