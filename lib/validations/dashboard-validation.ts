/**
 * Dashboard Validation Schemas
 * Comprehensive Zod validation for dashboard filters and queries
 *
 * @version 1.0.0
 * @since 2025-10-17
 */

import { z } from 'zod'

// ===================================
// ENUMS
// ===================================

export const TimeRangeEnum = z.enum(['7d', '30d', '90d', '365d', 'all'], {
  message: 'Time range must be one of: 7d, 30d, 90d, 365d, all',
})

export const MetricTypeEnum = z.enum(
  ['pilots', 'certifications', 'leave', 'retirement', 'compliance'],
  {
    message: 'Metric type must be one of: pilots, certifications, leave, retirement, compliance',
  }
)

// ===================================
// DASHBOARD FILTER SCHEMAS
// ===================================

/**
 * Dashboard date range filter
 */
export const DashboardDateRangeSchema = z
  .object({
    startDate: z
      .string()
      .datetime({ message: 'Start date must be a valid ISO datetime string' })
      .optional(),
    endDate: z
      .string()
      .datetime({ message: 'End date must be a valid ISO datetime string' })
      .optional(),
    timeRange: TimeRangeEnum.optional(),
  })
  .refine(
    (data) => {
      // If both dates provided, end date must be after start date
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate)
        const end = new Date(data.endDate)
        return end >= start
      }
      return true
    },
    {
      message: 'End date must be after or equal to start date',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      // Cannot specify both custom dates and time range
      if ((data.startDate || data.endDate) && data.timeRange) {
        return false
      }
      return true
    },
    {
      message: 'Cannot specify both custom date range and preset time range',
      path: ['timeRange'],
    }
  )

export type DashboardDateRange = z.infer<typeof DashboardDateRangeSchema>

/**
 * Dashboard metrics filter
 */
export const DashboardMetricsFilterSchema = z.object({
  metrics: z.array(MetricTypeEnum).optional(),
  includePerformance: z.boolean().optional().default(true),
  includeAlerts: z.boolean().optional().default(true),
})

export type DashboardMetricsFilter = z.infer<typeof DashboardMetricsFilterSchema>

/**
 * Dashboard pilot filter
 */
export const DashboardPilotFilterSchema = z.object({
  role: z.enum(['Captain', 'First Officer', 'all']).optional(),
  status: z.enum(['active', 'inactive', 'all']).optional().default('active'),
  includeRetirement: z.boolean().optional().default(true),
})

export type DashboardPilotFilter = z.infer<typeof DashboardPilotFilterSchema>

/**
 * Dashboard certification filter
 */
export const DashboardCertificationFilterSchema = z.object({
  status: z.enum(['current', 'expiring', 'expired', 'all']).optional().default('all'),
  daysAhead: z
    .number()
    .int()
    .min(1, 'Days ahead must be at least 1')
    .max(365, 'Days ahead cannot exceed 365')
    .optional()
    .default(30),
  category: z.string().max(50, 'Category cannot exceed 50 characters').optional(),
})

export type DashboardCertificationFilter = z.infer<typeof DashboardCertificationFilterSchema>

/**
 * Dashboard leave filter
 */
export const DashboardLeaveFilterSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'DENIED', 'all']).optional().default('all'),
  rosterPeriod: z
    .string()
    .regex(
      /^RP(1[0-3]|[1-9])\/\d{4}$/,
      'Roster period must be in format "RP1/2025" through "RP13/2025"'
    )
    .optional(),
  includeCurrentMonth: z.boolean().optional().default(true),
})

export type DashboardLeaveFilter = z.infer<typeof DashboardLeaveFilterSchema>

/**
 * Comprehensive dashboard filter (combines all filters)
 */
export const ComprehensiveDashboardFilterSchema = z.object({
  dateRange: DashboardDateRangeSchema.optional(),
  pilots: DashboardPilotFilterSchema.optional(),
  certifications: DashboardCertificationFilterSchema.optional(),
  leave: DashboardLeaveFilterSchema.optional(),
  refreshCache: z.boolean().optional().default(false),
})

export type ComprehensiveDashboardFilter = z.infer<typeof ComprehensiveDashboardFilterSchema>

// ===================================
// ALERT FILTER SCHEMAS
// ===================================

export const AlertSeverityEnum = z.enum(['critical', 'warning', 'notice', 'all'], {
  message: 'Alert severity must be one of: critical, warning, notice, all',
})

export const AlertTypeEnum = z.enum(
  ['expired_cert', 'expiring_cert', 'retirement', 'missing_cert', 'leave_conflict', 'all'],
  {
    message:
      'Alert type must be one of: expired_cert, expiring_cert, retirement, missing_cert, leave_conflict, all',
  }
)

export const DashboardAlertFilterSchema = z.object({
  severity: AlertSeverityEnum.optional().default('all'),
  type: AlertTypeEnum.optional().default('all'),
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(10),
})

export type DashboardAlertFilter = z.infer<typeof DashboardAlertFilterSchema>

// ===================================
// RETIREMENT FILTER SCHEMA
// ===================================

export const RetirementFilterSchema = z.object({
  yearsAhead: z
    .number()
    .int()
    .min(1, 'Years ahead must be at least 1')
    .max(10, 'Years ahead cannot exceed 10')
    .optional()
    .default(5),
  includeOverdue: z.boolean().optional().default(true),
  role: z.enum(['Captain', 'First Officer', 'all']).optional().default('all'),
})

export type RetirementFilter = z.infer<typeof RetirementFilterSchema>

// ===================================
// ACTIVITY FEED FILTER SCHEMA
// ===================================

export const ActivityFeedFilterSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit cannot exceed 50')
    .optional()
    .default(10),
  types: z
    .array(z.enum(['pilot_update', 'cert_update', 'leave_request', 'leave_approval', 'all']))
    .optional()
    .default(['all']),
  since: z
    .string()
    .datetime({ message: 'Since date must be a valid ISO datetime string' })
    .optional(),
})

export type ActivityFeedFilter = z.infer<typeof ActivityFeedFilterSchema>
