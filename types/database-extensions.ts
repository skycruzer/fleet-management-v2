/**
 * Database Type Extensions
 * Author: Maurice Rondeau
 *
 * Convenience type exports and join types for Supabase database operations.
 * These types eliminate the need for `as any` in service layer code.
 */

import type { Database } from './supabase'

// ============================================================================
// Table Row Types (convenient aliases)
// ============================================================================

export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']

// Core entity types
export type Pilot = Tables['pilots']['Row']
export type PilotInsert = Tables['pilots']['Insert']
export type PilotUpdate = Tables['pilots']['Update']

export type PilotCheck = Tables['pilot_checks']['Row']
export type PilotCheckInsert = Tables['pilot_checks']['Insert']
export type PilotCheckUpdate = Tables['pilot_checks']['Update']

export type CheckType = Tables['check_types']['Row']
export type CheckTypeInsert = Tables['check_types']['Insert']
export type CheckTypeUpdate = Tables['check_types']['Update']

export type PilotRequest = Tables['pilot_requests']['Row']
export type PilotRequestInsert = Tables['pilot_requests']['Insert']
export type PilotRequestUpdate = Tables['pilot_requests']['Update']

export type LeaveBid = Tables['leave_bids']['Row']
export type LeaveBidInsert = Tables['leave_bids']['Insert']
export type LeaveBidUpdate = Tables['leave_bids']['Update']

// Auth-related types
export type AnUser = Tables['an_users']['Row']
export type AnUserInsert = Tables['an_users']['Insert']
export type AnUserUpdate = Tables['an_users']['Update']

export type PilotUser = Tables['pilot_users']['Row']
export type PilotUserInsert = Tables['pilot_users']['Insert']
export type PilotUserUpdate = Tables['pilot_users']['Update']

export type AccountLockout = Tables['account_lockouts']['Row']
export type AccountLockoutInsert = Tables['account_lockouts']['Insert']
export type AccountLockoutUpdate = Tables['account_lockouts']['Update']

export type FailedLoginAttempt = Tables['failed_login_attempts']['Row']
export type FailedLoginAttemptInsert = Tables['failed_login_attempts']['Insert']
export type FailedLoginAttemptUpdate = Tables['failed_login_attempts']['Update']

export type PasswordHistory = Tables['password_history']['Row']
export type PasswordHistoryInsert = Tables['password_history']['Insert']
export type PasswordHistoryUpdate = Tables['password_history']['Update']

export type PilotSession = Tables['pilot_sessions']['Row']
export type PilotSessionInsert = Tables['pilot_sessions']['Insert']
export type PilotSessionUpdate = Tables['pilot_sessions']['Update']

export type AdminSession = Tables['admin_sessions']['Row']
export type AdminSessionInsert = Tables['admin_sessions']['Insert']
export type AdminSessionUpdate = Tables['admin_sessions']['Update']

export type AuditLog = Tables['audit_logs']['Row']
export type AuditLogInsert = Tables['audit_logs']['Insert']
export type AuditLogUpdate = Tables['audit_logs']['Update']

// ============================================================================
// Common Join Types (eliminates `as any` for Supabase joins)
// ============================================================================

/**
 * Certification (pilot_check) with pilot information
 */
export type CertificationWithPilot = PilotCheck & {
  pilots: Pick<Pilot, 'id' | 'first_name' | 'last_name' | 'employee_id' | 'role'> | null
}

/**
 * Certification with check type information
 */
export type CertificationWithCheckType = PilotCheck & {
  check_types: Pick<CheckType, 'id' | 'check_code' | 'check_description' | 'category'> | null
}

/**
 * Full certification with both pilot and check type
 */
export type CertificationFull = PilotCheck & {
  pilots: Pick<Pilot, 'id' | 'first_name' | 'last_name' | 'employee_id' | 'role'> | null
  check_types: Pick<CheckType, 'id' | 'check_code' | 'check_description' | 'category'> | null
}

/**
 * Pilot request with pilot information
 */
export type PilotRequestWithPilot = PilotRequest & {
  pilots: Pick<Pilot, 'id' | 'first_name' | 'last_name' | 'employee_id' | 'role'> | null
}

/**
 * Leave bid with pilot information
 */
export type LeaveBidWithPilot = LeaveBid & {
  pilots: Pick<
    Pilot,
    'id' | 'first_name' | 'last_name' | 'employee_id' | 'role' | 'seniority_number'
  > | null
}

/**
 * Pilot user with linked pilot profile
 */
export type PilotUserWithPilot = PilotUser & {
  pilots: Pilot | null
}

/**
 * Pilot session with pilot user info
 */
export type PilotSessionWithUser = PilotSession & {
  pilot_users: Pick<PilotUser, 'id' | 'email' | 'first_name' | 'last_name'> | null
}

// ============================================================================
// Settings Value Types (JSON column types)
// ============================================================================

/**
 * Pilot requirements setting value type
 */
export type PilotRequirementsSetting = {
  minimum_captains_per_hull: number
  minimum_first_officers_per_hull: number
  number_of_aircraft: number
}

// ============================================================================
// Materialized Views (not in generated types)
// ============================================================================

/**
 * Pilot dashboard metrics materialized view row type
 * This view is not captured by Supabase type generation
 */
export type PilotDashboardMetricsView = {
  total_pilots: number
  active_pilots: number
  inactive_pilots: number
  total_captains: number
  total_first_officers: number
  total_certifications: number
  expired_certifications: number
  expiring_certifications: number
  current_certifications: number
  compliance_rate: number
  pending_leave_requests: number
  approved_leave_requests: number
  total_leave_requests: number
  last_refreshed: string
}

// ============================================================================
// RPC Return Types (for stored procedures/functions)
// ============================================================================

/**
 * Bulk delete certifications RPC return type
 */
export type BulkDeleteResult = {
  deleted_count: number
  requested_count: number
  message?: string
}

/**
 * Batch update certifications RPC return type
 */
export type BatchUpdateResult = {
  updated_count: number
  total_requested: number
  message?: string
}

/**
 * Create pilot with certifications RPC return type
 */
export type CreatePilotWithCertificationsResult = {
  pilot: Pilot
  certification_count: number
  message?: string
}

/**
 * Dashboard statistics RPC return type
 */
export type DashboardStats = {
  pilotCount: number
  activePilots: number
  certificationCount: number
  expiredCount: number
  expiringCount: number
  leaveRequestCount: number
  pendingLeaveCount: number
}

/**
 * Crew availability calculation result
 */
export type CrewAvailability = {
  date: string
  captainsAvailable: number
  firstOfficersAvailable: number
  totalAvailable: number
  minimumMet: boolean
}

/**
 * Leave eligibility check result
 */
export type LeaveEligibilityResult = {
  eligible: boolean
  reason: string | null
  captainsAvailable: number
  firstOfficersAvailable: number
  captainMinimum: number
  firstOfficerMinimum: number
}

// ============================================================================
// Enum Types (from database)
// ============================================================================

export type PilotRole = Enums['pilot_role']
export type LeaveType = Enums['leave_type']
export type RequestStatus = Enums['request_status']

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type helper for Supabase query result data
 */
export type QueryData<T> = T extends { data: infer D } ? D : never

/**
 * Make specific fields required
 */
export type RequireFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/**
 * Make specific fields optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
