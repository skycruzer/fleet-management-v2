/**
 * @fileoverview Service for fetching expiring certifications data
 * Provides reusable functions for both API routes and internal server calls
 *
 * @version 2.0.0
 * @since 2025-10-17
 */

import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { logError, logWarning, ErrorSeverity } from '@/lib/error-logger'
import { getAlertThresholds } from './admin-service'
import {
  getCertificationStatus as getStatus,
  type CertificationStatus,
} from '@/lib/utils/certification-status'

/**
 * Get certification status based on expiry date and configurable admin thresholds
 * Uses shared utility with admin-configured warning threshold
 * @returns Status with guaranteed daysUntilExpiry since we always pass a valid Date
 */
async function getCertificationStatus(
  expiryDate: Date
): Promise<{ color: string; label: string; daysUntilExpiry: number }> {
  const thresholds = await getAlertThresholds()
  const status = getStatus(expiryDate, thresholds.warning_30_days)
  // daysUntilExpiry is guaranteed when a valid Date is passed (not null/undefined)
  return {
    color: status.color,
    label: status.label,
    daysUntilExpiry: status.daysUntilExpiry!,
  }
}

/**
 * Get roster period from date (28-day cycles)
 * Known anchor: RP12/2025 = 2025-10-11
 * Rollover: RP13/YYYY → RP1/(YYYY+1)
 */
function getRosterPeriodFromDate(date: Date) {
  const ROSTER_DURATION = 28
  const KNOWN_ROSTER = {
    number: 12,
    year: 2025,
    startDate: new Date('2025-10-11'),
  }

  const daysSinceKnown = Math.floor(
    (date.getTime() - KNOWN_ROSTER.startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const periodsPassed = Math.floor(daysSinceKnown / ROSTER_DURATION)

  let number = KNOWN_ROSTER.number + periodsPassed
  let year = KNOWN_ROSTER.year

  // Handle year rollovers
  while (number > 13) {
    number -= 13
    year++
  }
  while (number < 1) {
    number += 13
    year--
  }

  // Calculate start and end dates using milliseconds for safer arithmetic
  const startDate = new Date(
    KNOWN_ROSTER.startDate.getTime() + periodsPassed * ROSTER_DURATION * 24 * 60 * 60 * 1000
  )

  const endDate = new Date(startDate.getTime() + (ROSTER_DURATION - 1) * 24 * 60 * 60 * 1000)

  return {
    number,
    year,
    code: `RP${String(number).padStart(2, '0')}/${year}`,
    startDate,
    endDate,
  }
}

/**
 * Expiring certification data structure
 */
export interface ExpiringCertification {
  pilotName: string
  employeeId: string
  checkCode: string
  checkDescription: string
  category: string
  expiryDate: Date
  status: {
    color: string
    label: string
    daysUntilExpiry: number
  }
  expiry_roster_period: string
  expiry_roster_display: string
}

/**
 * Core service function to fetch expiring certifications
 * This function can be used by both API routes and internal server calls
 *
 * @param daysAhead - Number of days ahead to look for expiring certifications
 * @returns Promise<ExpiringCertification[]> - Array of expiring certification objects
 */
export async function getExpiringCertifications(daysAhead: number = 60): Promise<ExpiringCertification[]> {
  const supabase = await createClient()

  try {
    // Calculate date threshold - include expired certifications (30 days back)
    const today = new Date()

    // Use milliseconds for safer date arithmetic
    const futureDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000)

    // Look back 365 days to include all expired certifications for planning purposes
    const pastDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)

    // Validate dates before using them
    if (isNaN(futureDate.getTime()) || isNaN(pastDate.getTime())) {
      throw new Error(`Invalid date calculation: futureDate=${futureDate}, pastDate=${pastDate}`)
    }

    const { data: expiringChecks, error } = await supabase
      .from('pilot_checks')
      .select(
        `
        id,
        expiry_date,
        pilots!inner (
          id,
          first_name,
          middle_name,
          last_name,
          employee_id
        ),
        check_types!inner (
          id,
          check_code,
          check_description,
          category
        )
      `
      )
      .not('expiry_date', 'is', null)
      .gte('expiry_date', pastDate.toISOString().split('T')[0])
      .lte('expiry_date', futureDate.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true })

    if (error) {
      logError(error as Error, {
        source: 'ExpiringCertificationsService',
        severity: ErrorSeverity.HIGH,
        metadata: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
      })
      throw new Error(`Database error: ${error.message}`)
    }

    // Transform the data to match the expected format
    const transformedCertifications = await Promise.all(
      (expiringChecks || []).map(async (check: any): Promise<ExpiringCertification | null> => {
        // First, validate that we have a proper expiry_date
        if (!check.expiry_date) {
          logWarning('Missing expiry_date for check', {
            source: 'ExpiringCertificationsService',
            metadata: {
              operation: 'getExpiringCertifications',
              checkId: check.id,
            },
          })
          return null // Skip this record
        }

        const expiryDate = new Date(check.expiry_date)

        // Validate the date is valid
        if (isNaN(expiryDate.getTime())) {
          logWarning('Invalid expiry_date for check', {
            source: 'ExpiringCertificationsService',
            metadata: {
              operation: 'getExpiringCertifications',
              checkId: check.id,
              date: check.expiry_date,
            },
          })
          return null // Skip this record
        }

        // Calculate roster period for this expiry date
        let rosterPeriod, rosterDisplay
        try {
          const period = getRosterPeriodFromDate(expiryDate)

          // Check if roster number is valid (not NaN) or if any critical fields are invalid
          if (
            isNaN(period.number) ||
            !period.number ||
            period.number <= 0 ||
            period.code.includes('NaN')
          ) {
            logWarning('Invalid roster calculation detected', {
              source: 'ExpiringCertificationsService',
              metadata: {
                number: period.number,
                code: period.code,
                year: period.year,
                isNumberNaN: isNaN(period.number),
              },
            })
            throw new Error(
              `Invalid roster calculation: number=${period.number}, code=${period.code}`
            )
          }

          rosterPeriod = period.code
          rosterDisplay = `${period.code} (${format(period.startDate, 'MMM dd')} - ${format(period.endDate, 'MMM dd, yyyy')})`
        } catch (error) {
          logWarning('Error calculating roster period for date', {
            source: 'ExpiringCertificationsService',
            metadata: {
              date: expiryDate.toISOString().split('T')[0],
              error,
            },
          })

          // Robust fallback: determine roster period based on date with proper validation
          const year = expiryDate.getFullYear()
          const month = expiryDate.getMonth() + 1 // getMonth() returns 0-11

          // Simple heuristic: roughly 13.09 roster periods per year (365/28 ≈ 13.04)
          // But we'll use a conservative estimate
          let estimatedRoster = Math.ceil((month * 13) / 12)
          if (estimatedRoster > 13) estimatedRoster = 13
          if (estimatedRoster < 1) estimatedRoster = 1

          rosterPeriod = `RP${String(estimatedRoster).padStart(2, '0')}/${year}`
          rosterDisplay = `${rosterPeriod} (Estimated)`
        }

        const status = await getCertificationStatus(expiryDate)

        return {
          pilotName:
            `${check.pilots?.first_name || ''} ${check.pilots?.middle_name ? `${check.pilots.middle_name} ` : ''}${check.pilots?.last_name || ''}`.trim(),
          employeeId: check.pilots?.employee_id || '',
          checkCode: check.check_types?.check_code || '',
          checkDescription: check.check_types?.check_description || '',
          category: check.check_types?.category || '',
          expiryDate,
          status,
          expiry_roster_period: rosterPeriod,
          expiry_roster_display: rosterDisplay,
        }
      })
    )

    const result = transformedCertifications
      .filter((cert): cert is ExpiringCertification => cert !== null) // Remove null entries from invalid dates
      .filter((cert) => {
        // Include both expired certifications (negative days) and those expiring soon (0 to daysAhead)
        return cert.status.daysUntilExpiry <= daysAhead
      })

    return result
  } catch (error) {
    logError(error as Error, {
      source: 'ExpiringCertificationsService',
      severity: ErrorSeverity.HIGH,
      metadata: { operation: 'getExpiringCertifications' },
    })
    throw error
  }
}
