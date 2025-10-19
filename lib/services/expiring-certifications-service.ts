/**
 * @fileoverview Service for fetching expiring certifications data
 * Provides reusable functions for both API routes and internal server calls
 *
 * @version 2.0.0
 * @since 2025-10-17
 */

import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { logError, logInfo, logWarning, ErrorSeverity } from '@/lib/error-logger'

/**
 * Get certification status based on expiry date
 * Red: Expired (days_until_expiry < 0)
 * Yellow: Expiring soon (days_until_expiry ≤ 30)
 * Green: Current (days_until_expiry > 30)
 */
function getCertificationStatus(expiryDate: Date) {
  const today = new Date()
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysUntilExpiry < 0) {
    return { color: 'red', label: 'Expired', daysUntilExpiry }
  }
  if (daysUntilExpiry <= 30) {
    return { color: 'yellow', label: 'Expiring Soon', daysUntilExpiry }
  }
  return { color: 'green', label: 'Current', daysUntilExpiry }
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
    code: `RP${number}/${year}`,
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
    const result = (expiringChecks || [])
      .map((check: any): ExpiringCertification | null => {
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

          rosterPeriod = `RP${estimatedRoster}/${year}`
          rosterDisplay = `${rosterPeriod} (Estimated)`
        }

        return {
          pilotName:
            `${check.pilots?.first_name || ''} ${check.pilots?.middle_name ? `${check.pilots.middle_name} ` : ''}${check.pilots?.last_name || ''}`.trim(),
          employeeId: check.pilots?.employee_id || '',
          checkCode: check.check_types?.check_code || '',
          checkDescription: check.check_types?.check_description || '',
          category: check.check_types?.category || '',
          expiryDate,
          status: getCertificationStatus(expiryDate),
          expiry_roster_period: rosterPeriod,
          expiry_roster_display: rosterDisplay,
        }
      })
      .filter((cert): cert is ExpiringCertification => cert !== null) // Remove null entries from invalid dates
      .filter((cert) => {
        // Only include certifications that are actually expiring soon (0 to daysAhead)
        // Exclude expired certifications (negative days)
        return cert.status.daysUntilExpiry >= 0 && cert.status.daysUntilExpiry <= daysAhead
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
