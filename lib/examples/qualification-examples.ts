/**
 * Captain Qualifications Examples
 *
 * This file demonstrates proper usage of the captain qualifications type system.
 * These examples can be used as reference for implementing features.
 *
 * @module lib/examples/qualification-examples
 */

import type { CaptainQualifications, PilotRow } from '../../types'
import {
  parseCaptainQualifications,
  sanitizeCaptainQualifications,
  createDefaultCaptainQualifications,
} from '../utils/type-guards'
import {
  isLineCaptain,
  isTrainingCaptain,
  isExaminer,
  isRHSCaptainValid,
  getDaysUntilRHSExpiry,
  getCaptainQualificationSummary,
  getQualificationBadges,
  hasRequiredQualifications,
  hasExpiringQualifications,
  getQualificationStatusColor,
} from '../utils/qualification-utils'

/* ============================================================================
 * EXAMPLE 1: Creating a new pilot with qualifications
 * ========================================================================== */

export function createNewPilotExample() {
  // Create a new pilot with line captain qualification
  const newPilot = {
    first_name: 'John',
    last_name: 'Doe',
    employee_id: 'EMP001',
    role: 'Captain' as const,
    captain_qualifications: {
      line_captain: true,
      training_captain: false,
      examiner: false,
    } satisfies CaptainQualifications,
  }

  return newPilot
}

/* ============================================================================
 * EXAMPLE 2: Validating pilot data from API
 * ========================================================================== */

export function validatePilotDataExample(rawData: unknown) {
  // Assume rawData comes from an external API or user input
  if (typeof rawData !== 'object' || rawData === null) {
    throw new Error('Invalid pilot data')
  }

  const data = rawData as Record<string, unknown>

  // Validate captain qualifications
  const qualifications = parseCaptainQualifications(data.captain_qualifications)

  if (qualifications === null && data.captain_qualifications !== null) {
    console.warn('Invalid captain qualifications, using defaults')
    return {
      ...data,
      captain_qualifications: createDefaultCaptainQualifications(),
    }
  }

  return {
    ...data,
    captain_qualifications: qualifications,
  }
}

/* ============================================================================
 * EXAMPLE 3: Checking pilot qualifications for assignments
 * ========================================================================== */

export function canPilotConductTraining(pilot: PilotRow): boolean {
  // A pilot can conduct training if they are:
  // 1. A line captain
  // 2. A training captain
  // 3. Have valid RHS captain qualification (if required)

  return hasRequiredQualifications(pilot.captain_qualifications, ['line_captain', 'training_captain'])
}

export function canPilotConductCheckRide(pilot: PilotRow): boolean {
  // A pilot can conduct check rides if they are:
  // 1. A line captain
  // 2. An examiner

  return hasRequiredQualifications(pilot.captain_qualifications, ['line_captain', 'examiner'])
}

export function canPilotFlyRightHandSeat(pilot: PilotRow): boolean {
  // Check if RHS captain qualification is valid
  return isRHSCaptainValid(pilot.captain_qualifications)
}

/* ============================================================================
 * EXAMPLE 4: Displaying qualification badges in UI
 * ========================================================================== */

export function getPilotQualificationDisplay(pilot: PilotRow) {
  const badges = getQualificationBadges(pilot.captain_qualifications)
  const summary = getCaptainQualificationSummary(pilot.captain_qualifications)

  return {
    badges,
    details: {
      name: `${pilot.first_name} ${pilot.last_name}`,
      employeeId: pilot.employee_id,
      role: pilot.role,
      qualifications: {
        lineCaptain: summary.isLineCaptain,
        trainingCaptain: summary.isTrainingCaptain,
        examiner: summary.isExaminer,
      },
      rhsCaptain: {
        valid: summary.rhsCaptainIsValid,
        expiryDate: summary.rhsCaptainExpiry,
        daysUntilExpiry: summary.rhsCaptainDaysUntilExpiry,
      },
    },
  }
}

/* ============================================================================
 * EXAMPLE 5: Generating qualification alerts
 * ========================================================================== */

export function getQualificationAlerts(pilot: PilotRow) {
  const alerts: Array<{ type: 'error' | 'warning' | 'info'; message: string }> = []

  // Check for expiring qualifications
  if (hasExpiringQualifications(pilot.captain_qualifications, 30)) {
    const days = getDaysUntilRHSExpiry(pilot.captain_qualifications)
    alerts.push({
      type: 'warning',
      message: `RHS Captain qualification expires in ${days} days`,
    })
  }

  if (hasExpiringQualifications(pilot.captain_qualifications, 7)) {
    alerts.push({
      type: 'error',
      message: 'RHS Captain qualification expires within 7 days - immediate action required',
    })
  }

  // Check if RHS captain expired
  const daysUntilExpiry = getDaysUntilRHSExpiry(pilot.captain_qualifications)
  if (daysUntilExpiry !== null && daysUntilExpiry < 0) {
    alerts.push({
      type: 'error',
      message: 'RHS Captain qualification has expired',
    })
  }

  return alerts
}

/* ============================================================================
 * EXAMPLE 6: Filtering pilots by qualifications
 * ========================================================================== */

export function filterPilotsByQualification(
  pilots: PilotRow[],
  filter: 'line_captain' | 'training_captain' | 'examiner' | 'rhs_captain'
) {
  return pilots.filter((pilot) => {
    switch (filter) {
      case 'line_captain':
        return isLineCaptain(pilot.captain_qualifications)
      case 'training_captain':
        return isTrainingCaptain(pilot.captain_qualifications)
      case 'examiner':
        return isExaminer(pilot.captain_qualifications)
      case 'rhs_captain':
        return isRHSCaptainValid(pilot.captain_qualifications)
      default:
        return false
    }
  })
}

export function getAvailableTrainingCaptains(pilots: PilotRow[]) {
  return pilots.filter(
    (pilot) => pilot.is_active && hasRequiredQualifications(pilot.captain_qualifications, ['training_captain'])
  )
}

export function getAvailableExaminers(pilots: PilotRow[]) {
  return pilots.filter((pilot) => pilot.is_active && hasRequiredQualifications(pilot.captain_qualifications, ['examiner']))
}

/* ============================================================================
 * EXAMPLE 7: Updating pilot qualifications
 * ========================================================================== */

export function updatePilotQualificationsExample(currentQualifications: CaptainQualifications | null, updates: Partial<CaptainQualifications>) {
  // Safely merge updates with current qualifications
  const current = currentQualifications || createDefaultCaptainQualifications()

  const updated: CaptainQualifications = {
    ...current,
    ...updates,
  }

  // Sanitize to ensure type safety
  return sanitizeCaptainQualifications(updated)
}

export function promoteToCaptain(pilot: PilotRow): CaptainQualifications {
  // When promoting to captain, grant line captain qualification
  return sanitizeCaptainQualifications({
    line_captain: true,
    training_captain: false,
    examiner: false,
  })
}

export function grantTrainingCaptainQualification(currentQualifications: CaptainQualifications | null): CaptainQualifications {
  // Add training captain qualification
  return updatePilotQualificationsExample(currentQualifications, {
    training_captain: true,
  })
}

export function grantExaminerQualification(currentQualifications: CaptainQualifications | null): CaptainQualifications {
  // Add examiner qualification
  return updatePilotQualificationsExample(currentQualifications, {
    examiner: true,
  })
}

export function updateRHSCaptainExpiry(currentQualifications: CaptainQualifications | null, expiryDate: Date): CaptainQualifications {
  // Update RHS captain expiry date
  return updatePilotQualificationsExample(currentQualifications, {
    rhs_captain_expiry: expiryDate.toISOString(),
  })
}

/* ============================================================================
 * EXAMPLE 8: Generating reports
 * ========================================================================== */

export function generateQualificationReport(pilots: PilotRow[]) {
  const report = {
    totalPilots: pilots.length,
    activePilots: pilots.filter((p) => p.is_active).length,
    lineCaptains: pilots.filter((p) => isLineCaptain(p.captain_qualifications)).length,
    trainingCaptains: pilots.filter((p) => isTrainingCaptain(p.captain_qualifications)).length,
    examiners: pilots.filter((p) => isExaminer(p.captain_qualifications)).length,
    validRHSCaptains: pilots.filter((p) => isRHSCaptainValid(p.captain_qualifications)).length,
    expiringRHSCaptains: pilots.filter((p) => hasExpiringQualifications(p.captain_qualifications, 30)).length,
  }

  return report
}

export function getPilotsWithExpiringQualifications(pilots: PilotRow[], daysAhead: number = 30) {
  return pilots
    .filter((pilot) => hasExpiringQualifications(pilot.captain_qualifications, daysAhead))
    .map((pilot) => ({
      id: pilot.id,
      name: `${pilot.first_name} ${pilot.last_name}`,
      employeeId: pilot.employee_id,
      daysUntilExpiry: getDaysUntilRHSExpiry(pilot.captain_qualifications),
      statusColor: getQualificationStatusColor(pilot.captain_qualifications),
    }))
    .sort((a, b) => (a.daysUntilExpiry || 0) - (b.daysUntilExpiry || 0))
}

/* ============================================================================
 * EXAMPLE 9: Form validation
 * ========================================================================== */

export function validateQualificationForm(formData: Record<string, unknown>) {
  const errors: Record<string, string> = {}

  // Check if at least one qualification is selected for captains
  const hasAnyQualification =
    formData.line_captain === true || formData.training_captain === true || formData.examiner === true

  if (!hasAnyQualification) {
    errors.qualifications = 'At least one captain qualification must be selected'
  }

  // Validate RHS captain expiry date if provided
  if (formData.rhs_captain_expiry) {
    const expiryDate = new Date(formData.rhs_captain_expiry as string)
    if (isNaN(expiryDate.getTime())) {
      errors.rhs_captain_expiry = 'Invalid expiry date'
    } else if (expiryDate < new Date()) {
      errors.rhs_captain_expiry = 'Expiry date cannot be in the past'
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/* ============================================================================
 * EXAMPLE 10: Status dashboard
 * ========================================================================== */

export function getQualificationStatusDashboard(pilots: PilotRow[]) {
  const activePilots = pilots.filter((p) => p.is_active)

  return {
    overview: {
      totalActivePilots: activePilots.length,
      lineCaptains: activePilots.filter((p) => isLineCaptain(p.captain_qualifications)).length,
      trainingCaptains: activePilots.filter((p) => isTrainingCaptain(p.captain_qualifications)).length,
      examiners: activePilots.filter((p) => isExaminer(p.captain_qualifications)).length,
    },
    rhsStatus: {
      valid: activePilots.filter((p) => isRHSCaptainValid(p.captain_qualifications)).length,
      expiring30Days: activePilots.filter((p) => hasExpiringQualifications(p.captain_qualifications, 30)).length,
      expiring7Days: activePilots.filter((p) => hasExpiringQualifications(p.captain_qualifications, 7)).length,
      expired: activePilots.filter((p) => {
        const days = getDaysUntilRHSExpiry(p.captain_qualifications)
        return days !== null && days < 0
      }).length,
    },
    alerts: activePilots
      .flatMap((p) => getQualificationAlerts(p).map((alert) => ({ pilotId: p.id, pilotName: `${p.first_name} ${p.last_name}`, ...alert })))
      .sort((a, b) => {
        // Sort by severity: error > warning > info
        const severityOrder = { error: 0, warning: 1, info: 2 }
        return severityOrder[a.type] - severityOrder[b.type]
      }),
  }
}
