/**
 * Type Definitions Index
 *
 * Central export point for all application-specific type definitions.
 * This provides a single import source for types across the application.
 *
 * @module types
 */

// Re-export Supabase generated types
export type { Database, Json } from './supabase'

// Re-export Pilot types
export type {
  CaptainQualifications,
  PilotRow,
  PilotInsert,
  PilotUpdate,
  PilotWithDetails,
  CaptainQualificationSummary,
  PilotRole,
  PilotStatus,
  SeniorityPilot,
  PilotWithCertificationCounts,
} from './pilot'

// Type aliases for common use cases
export type { Database as SupabaseDatabase } from './supabase'
