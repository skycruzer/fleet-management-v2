import { getDashboardMetrics } from '@/lib/services/dashboard-service-v4'
import { getExpiringCertifications } from '@/lib/services/expiring-certifications-service'
import { ComplianceOverviewClient } from './compliance-overview-client'
import { createClient } from '@/lib/supabase/server'

/**
 * Server Component - Fetches real compliance data and passes to client component
 * No mock data - all data comes from the database
 */
export async function ComplianceOverviewServer() {
  const [metrics, expiringCerts] = await Promise.all([
    getDashboardMetrics(true),
    getExpiringCertifications(60), // Get certs expiring in next 60 days
  ])

  const supabase = await createClient()

  // Get all certification checks grouped by category for breakdown
  const { data: allChecks } = await supabase
    .from('pilot_checks')
    .select(
      `
      id,
      expiry_date,
      check_types!inner (
        category
      )
    `
    )
    .not('expiry_date', 'is', null)

  // Calculate category breakdown
  const categoryMap = new Map<string, { current: number; total: number }>()
  const now = new Date()

  allChecks?.forEach((check: any) => {
    const category = check.check_types?.category || 'Other'
    const expiryDate = new Date(check.expiry_date)
    const isCurrent = expiryDate > now

    if (!categoryMap.has(category)) {
      categoryMap.set(category, { current: 0, total: 0 })
    }

    const stats = categoryMap.get(category)!
    stats.total++
    if (isCurrent) {
      stats.current++
    }
  })

  // Convert to categories array with status
  const categories = Array.from(categoryMap.entries()).map(([name, stats]) => {
    const complianceRate = (stats.current / stats.total) * 100
    let status: 'excellent' | 'good' | 'warning' | 'critical'

    if (complianceRate >= 95) {
      status = 'excellent'
    } else if (complianceRate >= 85) {
      status = 'good'
    } else if (complianceRate >= 70) {
      status = 'warning'
    } else {
      status = 'critical'
    }

    return {
      name: name,
      current: stats.current,
      total: stats.total,
      status,
    }
  })

  // Create action items from expiring certifications (top 10 most urgent)
  const actionItems = expiringCerts
    .filter((cert) => {
      return cert.status.daysUntilExpiry <= 30 // Only show items expiring in next 30 days or already expired
    })
    .slice(0, 10) // Limit to top 10 most urgent
    .map((cert, index) => {
      const daysUntilExpiry = cert.status.daysUntilExpiry

      let priority: 'high' | 'medium' | 'low'
      if (daysUntilExpiry < 0) {
        priority = 'high' // Expired
      } else if (daysUntilExpiry <= 10) {
        priority = 'high' // Expires within 10 days
      } else if (daysUntilExpiry <= 20) {
        priority = 'medium' // Expires within 20 days
      } else {
        priority = 'low' // Expires within 30 days
      }

      const title =
        daysUntilExpiry < 0
          ? `${cert.pilotName} - ${cert.checkDescription} expired ${Math.abs(daysUntilExpiry)} days ago`
          : `${cert.pilotName} - ${cert.checkDescription} expires in ${daysUntilExpiry} days`

      return {
        id: `action-${index}`,
        title,
        priority,
        dueDate: cert.expiryDate.toISOString(),
      }
    })

  return (
    <ComplianceOverviewClient
      overallCompliance={metrics.certifications.complianceRate}
      categories={categories}
      actionItems={actionItems}
    />
  )
}
