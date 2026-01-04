/**
 * Urgent Alert Banner Component
 *
 * Displays critical alerts for expiring certifications at the top of the dashboard.
 * Features:
 * - Color-coded by urgency (red: <7 days, yellow: <30 days)
 * - Dismissible with localStorage persistence
 * - Direct link to certifications page with filter
 * - Responsive design with icon and CTA
 *
 * Architecture: Server Component wrapper with Client Component for interactivity
 */

import { getExpiringCertifications } from '@/lib/services/expiring-certifications-service'
import { UrgentAlertBannerClient } from './urgent-alert-banner-client'

export async function UrgentAlertBanner() {
  // Fetch expiring certifications in next 30 days
  const expiringCerts = await getExpiringCertifications(30)

  // Don't show if no urgent items
  if (expiringCerts.length === 0) {
    return null
  }

  // Calculate urgency breakdown
  const critical = expiringCerts.filter((cert) => cert.status.daysUntilExpiry <= 7).length
  const warning = expiringCerts.filter(
    (cert) => cert.status.daysUntilExpiry > 7 && cert.status.daysUntilExpiry <= 14
  ).length
  const notice = expiringCerts.filter(
    (cert) => cert.status.daysUntilExpiry > 14 && cert.status.daysUntilExpiry <= 30
  ).length

  const total = expiringCerts.length
  const urgencyLevel = critical > 0 ? 'critical' : warning > 0 ? 'warning' : 'notice'

  return (
    <UrgentAlertBannerClient
      total={total}
      critical={critical}
      warning={warning}
      notice={notice}
      urgencyLevel={urgencyLevel}
    />
  )
}
