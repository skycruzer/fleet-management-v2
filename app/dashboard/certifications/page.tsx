/**
 * Certifications Management Page
 *
 * Server component: fetches every certification, derives the summary stats, and
 * hands them to the client component. The componentized client renders the
 * tabbed views (All / Attention / By Category) with URL-synced tab state, so
 * the `/dashboard/certifications/expiring -> ?tab=attention` redirect resolves
 * correctly.
 *
 * @author Maurice Rondeau
 * @version 3.0.0
 * @updated 2026-05-22 - Migrated to componentized tabbed architecture
 */

import { getCertificationsUnpaginated } from '@/lib/services/certification-service'
import { CertificationsPageClient } from './certifications-page-client'

export default async function CertificationsPage() {
  const certifications = await getCertificationsUnpaginated()

  // Derive summary stats from the certification list so the stat cards stay in
  // lockstep with the table and with the client-side recount after mutations
  // (refreshData). Counts every certification, matching prior page behaviour.
  const stats = {
    total: certifications.length,
    current: certifications.filter((c) => c.status?.color === 'green').length,
    expiring: certifications.filter((c) => c.status?.color === 'yellow').length,
    expired: certifications.filter((c) => c.status?.color === 'red').length,
  }

  return <CertificationsPageClient certifications={certifications} stats={stats} />
}
