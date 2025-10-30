/**
 * Expiring Certifications Banner - Server Component
 *
 * Fetches expiring certifications data and passes to client component.
 * Displays certifications expiring within the next 30 days.
 */

import { getExpiringCertifications } from '@/lib/services/expiring-certifications-service'
import { ExpiringCertificationsBanner } from './expiring-certifications-banner'

export async function ExpiringCertificationsBannerServer() {
  // Get certifications expiring in next 30 days
  const expiringCerts = await getExpiringCertifications(30)

  // Filter to only show items expiring in next 30 days or already expired
  const urgentItems = expiringCerts
    .filter((cert) => cert.status.daysUntilExpiry <= 30)
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
        id: `cert-${index}`,
        title,
        priority,
        dueDate: cert.expiryDate.toISOString(),
      }
    })

  return <ExpiringCertificationsBanner actionItems={urgentItems} />
}
