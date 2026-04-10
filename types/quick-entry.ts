/**
 * Quick Entry Form Types
 *
 * TypeScript type definitions for the admin quick entry form.
 *
 * @author Maurice Rondeau
 */

export type RequestCategory = 'LEAVE' | 'FLIGHT' | 'LEAVE_BID'

export type SubmissionChannel = 'EMAIL' | 'PHONE' | 'ORACLE'

export type LeaveType =
  | 'RDO'
  | 'SDO'
  | 'ANNUAL'
  | 'SICK'
  | 'LSL'
  | 'LWOP'
  | 'MATERNITY'
  | 'COMPASSIONATE'

export type FlightType = 'FLIGHT_REQUEST' | 'RDO' | 'SDO' | 'OFFICE_DAY'

export type RequestStatus = 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'DENIED'

export type DeadlineStatus = 'on-time' | 'late' | 'past-deadline'

/**
 * Pilot summary for dropdown selection
 */
export interface PilotSummary {
  id: string
  first_name: string
  middle_name?: string | null
  last_name: string
  employee_id: string
  role: 'Captain' | 'First Officer'
}

/**
 * Conflict detection result
 */
export interface ConflictDetectionResult {
  hasConflict: boolean
  conflicts: Array<{
    id: string
    type: string
    startDate: string
    endDate: string
    status: RequestStatus
    rosterPeriod?: string
  }>
  message?: string
}

/**
 * Deadline status information
 */
export interface DeadlineStatusInfo {
  status: DeadlineStatus
  daysRemaining: number
  label: string
  severity: 'default' | 'warning' | 'destructive'
}

/**
 * Quick entry request payload (for API)
 */
export interface QuickEntryPayload {
  pilot_id: string
  request_category: RequestCategory
  request_type: LeaveType | FlightType
  start_date: string
  end_date: string | null
  reason?: string | null
  request_date: string
  request_method: SubmissionChannel
  source_reference?: string | null
  notes?: string | null
  is_late_request: boolean
  roster_period?: string
}

/**
 * Quick entry API response
 */
export interface QuickEntryResponse {
  success: boolean
  data?: {
    id: string
    request_type: string
    status: RequestStatus
    created_at: string
    roster_period?: string
  }
  error?: string
  message?: string
}

/**
 * Form step configuration
 */
export interface FormStep {
  step: number
  title: string
  description: string
  icon: string
  fields: string[]
}

/**
 * Form validation result
 */
export interface FormValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
  }>
}
