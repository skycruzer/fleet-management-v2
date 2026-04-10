/**
 * React Query Hooks - Main Export
 *
 * Centralized export for all custom React Query hooks.
 */

// Pilot hooks
export { usePilots, usePilot, useUpdatePilot, usePrefetchPilot } from './use-pilots'

// Certification hooks
export {
  useCertifications,
  useExpiringCertifications,
  useUpdateCertification,
} from './use-certifications'

// Dashboard hooks
export { useDashboardMetrics, useComplianceStats, useDashboard } from './use-dashboard'
