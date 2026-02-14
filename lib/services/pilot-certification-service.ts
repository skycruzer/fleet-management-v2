/**
 * Pilot Certification Service
 * Author: Maurice Rondeau
 *
 * Handles pilot-specific certification operations for the pilot portal.
 * Provides read-only access to certifications for authenticated pilots.
 *
 * @version 1.0.0
 * @since 2025-11-09
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/supabase'
import { getCertificationStatus } from '@/lib/utils/certification-status'

type PilotCheck = Database['public']['Tables']['pilot_checks']['Row']
type CheckType = Database['public']['Tables']['check_types']['Row']

/**
 * Categories removed from the system — excluded from all queries.
 * Non-renewal: one-time qualifications with no expiry (B767_PE_CNS, PBN, etc.)
 * Travel Visa: removed as a separate category
 */
const EXCLUDED_CATEGORIES = ['Non-renewal', 'Travel Visa']

/**
 * Certification with check type details
 */
export interface PilotCertificationWithDetails extends PilotCheck {
  check_types: CheckType | null
  daysUntilExpiry?: number
  status?: 'expired' | 'expiring_soon' | 'current'
}

/**
 * Fetch all certifications for a specific pilot
 * Used in pilot portal to display certification history
 *
 * @param pilotId - UUID of the pilot
 * @returns Array of certifications with check type details
 */
export async function getPilotCertifications(
  pilotId: string
): Promise<PilotCertificationWithDetails[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('pilot_checks')
    .select(
      `
      *,
      check_types (*)
    `
    )
    .eq('pilot_id', pilotId)
    .order('expiry_date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch pilot certifications: ${error.message}`)
  }

  // Filter out non-renewal categories (removed from system)
  const renewalCerts = (data || []).filter(
    (cert) =>
      cert.check_types &&
      cert.check_types.category &&
      !EXCLUDED_CATEGORIES.includes(cert.check_types.category)
  )

  // Calculate days until expiry and status using shared utility
  const certificationsWithStatus = renewalCerts.map((cert) => {
    const certStatus = getCertificationStatus(cert.expiry_date)

    // Map shared utility colors to portal status values
    const statusMap: Record<string, 'expired' | 'expiring_soon' | 'current'> = {
      red: 'expired',
      yellow: 'expiring_soon',
      green: 'current',
      gray: 'current', // No date treated as current (not alarming red)
    }

    return {
      ...cert,
      daysUntilExpiry: certStatus.daysUntilExpiry,
      status: statusMap[certStatus.color],
    }
  })

  return certificationsWithStatus
}

/**
 * Get expiring certifications for a pilot
 * Returns certifications expiring within the specified number of days
 *
 * @param pilotId - UUID of the pilot
 * @param daysThreshold - Number of days threshold (default: 90)
 * @returns Array of expiring certifications
 */
export async function getExpiringPilotCertifications(
  pilotId: string,
  daysThreshold: number = 90
): Promise<PilotCertificationWithDetails[]> {
  const allCertifications = await getPilotCertifications(pilotId)

  // Filter certifications expiring within threshold
  return allCertifications.filter((cert) => {
    return (
      cert.daysUntilExpiry !== undefined &&
      cert.daysUntilExpiry >= 0 &&
      cert.daysUntilExpiry <= daysThreshold
    )
  })
}

/**
 * Get expired certifications for a pilot
 * Returns all certifications that have already expired
 *
 * @param pilotId - UUID of the pilot
 * @returns Array of expired certifications
 */
export async function getExpiredPilotCertifications(
  pilotId: string
): Promise<PilotCertificationWithDetails[]> {
  const allCertifications = await getPilotCertifications(pilotId)

  return allCertifications.filter((cert) => cert.status === 'expired')
}

/**
 * Get certification summary statistics for a pilot
 * Provides counts of expired, expiring soon, and current certifications
 *
 * @param pilotId - UUID of the pilot
 * @returns Summary statistics object
 */
export async function getPilotCertificationSummary(pilotId: string): Promise<{
  total: number
  expired: number
  expiringSoon: number
  current: number
  compliance: number
}> {
  const allCertifications = await getPilotCertifications(pilotId)

  const expired = allCertifications.filter((c) => c.status === 'expired').length
  const expiringSoon = allCertifications.filter((c) => c.status === 'expiring_soon').length
  const current = allCertifications.filter((c) => c.status === 'current').length

  const compliance =
    allCertifications.length > 0
      ? Math.round(((current + expiringSoon) / allCertifications.length) * 100)
      : 100

  return {
    total: allCertifications.length,
    expired,
    expiringSoon,
    current,
    compliance,
  }
}

/**
 * Get a specific certification by ID
 * Used to display detailed certification information
 *
 * @param certificationId - UUID of the certification
 * @param pilotId - UUID of the pilot (for security validation)
 * @returns Certification with details or null if not found
 */
export async function getPilotCertificationById(
  certificationId: string,
  pilotId: string
): Promise<PilotCertificationWithDetails | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('pilot_checks')
    .select(
      `
      *,
      check_types (*)
    `
    )
    .eq('id', certificationId)
    .eq('pilot_id', pilotId) // Security: ensure pilot owns this certification
    .single()

  if (error || !data) {
    return null
  }

  // Reject non-renewal categories
  const category = data.check_types?.category
  if (!category || EXCLUDED_CATEGORIES.includes(category)) {
    return null
  }

  // Calculate days until expiry and status using shared utility
  const certStatus = getCertificationStatus(data.expiry_date)
  const statusMap: Record<string, 'expired' | 'expiring_soon' | 'current'> = {
    red: 'expired',
    yellow: 'expiring_soon',
    green: 'current',
    gray: 'current',
  }

  return {
    ...data,
    daysUntilExpiry: certStatus.daysUntilExpiry,
    status: statusMap[certStatus.color],
  }
}

/**
 * Get certifications grouped by category
 * Returns certifications organized by check type category
 *
 * @param pilotId - UUID of the pilot
 * @returns Object with certifications grouped by category
 */
export async function getPilotCertificationsByCategory(pilotId: string): Promise<{
  [category: string]: PilotCertificationWithDetails[]
}> {
  const allCertifications = await getPilotCertifications(pilotId)

  const grouped: { [category: string]: PilotCertificationWithDetails[] } = {}

  allCertifications.forEach((cert) => {
    const category = cert.check_types?.category || 'Uncategorized'
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(cert)
  })

  return grouped
}
