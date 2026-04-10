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

// Re-export database extension types (convenience aliases and join types)
export type {
  // Table row types
  Tables,
  Enums,
  Pilot,
  PilotCheck,
  CheckType,
  AnUser,
  PilotUser,
  AccountLockout,
  FailedLoginAttempt,
  PasswordHistory,
  PilotSession,
  AdminSession,
  AuditLog,
  LeaveBid,
  // Join types
  CertificationWithPilot,
  CertificationWithCheckType,
  CertificationFull,
  PilotRequestWithPilot,
  LeaveBidWithPilot,
  PilotUserWithPilot,
  PilotSessionWithUser,
  // Settings value types
  PilotRequirementsSetting,
  // Materialized views
  PilotDashboardMetricsView,
  // RPC types
  BulkDeleteResult,
  BatchUpdateResult,
  CreatePilotWithCertificationsResult,
  DashboardStats,
  CrewAvailability,
  LeaveEligibilityResult,
  // Enum types
  LeaveType,
  RequestStatus,
  // Utility types
  QueryData,
  RequireFields,
  OptionalFields,
} from './database-extensions'

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
