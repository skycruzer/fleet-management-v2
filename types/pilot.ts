/**
 * Pilot Type Definitions
 *
 * This file provides strict TypeScript types for pilot-related data,
 * particularly focusing on type safety for JSONB columns.
 *
 * @module types/pilot
 */

import type { Database } from './supabase'

/**
 * Captain Qualifications Type
 *
 * Represents the qualifications stored in the JSONB `captain_qualifications` column.
 * Provides compile-time type safety for captain qualification fields.
 */
export type CaptainQualifications = {
  /** Line Captain qualification status */
  line_captain?: boolean

  /** Training Captain (TRI) qualification status */
  training_captain?: boolean

  /** Examiner (TRE) qualification status */
  examiner?: boolean

  /** Right-hand seat captain qualification expiry date (ISO 8601 format) */
  rhs_captain_expiry?: string
}

/**
 * Pilot Row Type with Typed Qualifications
 *
 * Extends the base Supabase pilot row type with strongly-typed captain_qualifications.
 */
export type PilotRow = Omit<
  Database['public']['Tables']['pilots']['Row'],
  'captain_qualifications'
> & {
  captain_qualifications: CaptainQualifications | null
}

/**
 * Pilot Insert Type with Typed Qualifications
 *
 * Used for inserting new pilot records with type-safe qualifications.
 */
export type PilotInsert = Omit<
  Database['public']['Tables']['pilots']['Insert'],
  'captain_qualifications'
> & {
  captain_qualifications?: CaptainQualifications | null
}

/**
 * Pilot Update Type with Typed Qualifications
 *
 * Used for updating existing pilot records with type-safe qualifications.
 */
export type PilotUpdate = Omit<
  Database['public']['Tables']['pilots']['Update'],
  'captain_qualifications'
> & {
  captain_qualifications?: CaptainQualifications | null
}

/**
 * Pilot with Full Details
 *
 * Includes computed fields and relationships for displaying comprehensive pilot information.
 */
export type PilotWithDetails = PilotRow & {
  /** Full name (computed) */
  full_name?: string

  /** Display name (computed) */
  display_name?: string

  /** Years in service (computed) */
  years_in_service?: number

  /** Years to retirement (computed) */
  years_to_retirement?: number

  /** Age (computed) */
  age?: number

  /** Contract type details */
  contract_type_details?: {
    id: string
    name: string
    description: string | null
  }
}

/**
 * Captain Qualification Summary
 *
 * Provides a summary of captain qualifications with readable labels.
 */
export type CaptainQualificationSummary = {
  isLineCaptain: boolean
  isTrainingCaptain: boolean
  isExaminer: boolean
  rhsCaptainExpiry: Date | null
  rhsCaptainIsValid: boolean
  rhsCaptainDaysUntilExpiry: number | null
}

/**
 * Pilot Role Enum
 *
 * Re-export the pilot role enum for convenience.
 */
export type PilotRole = Database['public']['Enums']['pilot_role']

/**
 * Pilot Status Type
 *
 * Represents the operational status of a pilot.
 */
export type PilotStatus = 'active' | 'inactive' | 'on_leave' | 'suspended'

/**
 * Seniority-based Pilot
 *
 * Pilot data sorted by seniority for leave eligibility calculations.
 */
export type SeniorityPilot = PilotRow & {
  seniority_rank: number
}

/**
 * Pilot with Certification Counts
 *
 * Includes certification statistics for compliance tracking.
 */
export type PilotWithCertificationCounts = PilotRow & {
  total_certifications: number
  expired_certifications: number
  expiring_soon_certifications: number
  valid_certifications: number
  compliance_percentage: number
}
