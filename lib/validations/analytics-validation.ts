/**
 * Analytics Validation Schemas
 * Comprehensive Zod validation for analytics queries and filters
 *
 * @version 1.0.0
 * @since 2025-10-17
 */

import { z } from 'zod'

// ===================================
// ENUMS
// ===================================

export const AnalyticsPeriodEnum = z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], {
  message: 'Period must be one of: daily, weekly, monthly, quarterly, yearly',
})

export const AnalyticsMetricEnum = z.enum(
  [
    'pilot_count',
    'certification_compliance',
    'leave_requests',
    'retirement_rate',
    'expiry_rate',
    'crew_availability',
  ],
  {
    message:
      'Metric must be one of: pilot_count, certification_compliance, leave_requests, retirement_rate, expiry_rate, crew_availability',
  }
)

export const ChartTypeEnum = z.enum(['line', 'bar', 'pie', 'area', 'donut'], {
  message: 'Chart type must be one of: line, bar, pie, area, donut',
})

// ===================================
// DATE RANGE SCHEMAS
// ===================================

export const AnalyticsDateRangeSchema = z
  .object({
    startDate: z.string().datetime({ message: 'Start date must be a valid ISO datetime string' }),
    endDate: z.string().datetime({ message: 'End date must be a valid ISO datetime string' }),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      return end > start
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff <= 730 // Max 2 years
    },
    {
      message: 'Date range cannot exceed 2 years',
      path: ['endDate'],
    }
  )

export type AnalyticsDateRange = z.infer<typeof AnalyticsDateRangeSchema>

// ===================================
// PILOT ANALYTICS SCHEMAS
// ===================================

export const PilotAnalyticsFilterSchema = z.object({
  dateRange: AnalyticsDateRangeSchema.optional(),
  role: z.enum(['Captain', 'First Officer', 'all']).optional().default('all'),
  status: z.enum(['active', 'inactive', 'all']).optional().default('all'),
  groupBy: z.enum(['role', 'status', 'seniority', 'retirement']).optional(),
  includeRetirementProjection: z.boolean().optional().default(true),
  includeQualifications: z.boolean().optional().default(false),
})

export type PilotAnalyticsFilter = z.infer<typeof PilotAnalyticsFilterSchema>

// ===================================
// CERTIFICATION ANALYTICS SCHEMAS
// ===================================

export const CertificationAnalyticsFilterSchema = z.object({
  dateRange: AnalyticsDateRangeSchema.optional(),
  category: z.string().max(50, 'Category cannot exceed 50 characters').optional(),
  status: z.enum(['current', 'expiring', 'expired', 'all']).optional().default('all'),
  groupBy: z.enum(['category', 'status', 'pilot', 'expiry_month']).optional(),
  includeExpiryTrends: z.boolean().optional().default(true),
  monthsAhead: z
    .number()
    .int()
    .min(1, 'Months ahead must be at least 1')
    .max(24, 'Months ahead cannot exceed 24')
    .optional()
    .default(12),
})

export type CertificationAnalyticsFilter = z.infer<typeof CertificationAnalyticsFilterSchema>

// ===================================
// LEAVE ANALYTICS SCHEMAS
// ===================================

export const LeaveAnalyticsFilterSchema = z.object({
  dateRange: AnalyticsDateRangeSchema.optional(),
  requestType: z
    .enum(['RDO', 'SDO', 'ANNUAL', 'SICK', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE', 'all'])
    .optional()
    .default('all'),
  status: z.enum(['PENDING', 'APPROVED', 'DENIED', 'all']).optional().default('all'),
  role: z.enum(['Captain', 'First Officer', 'all']).optional().default('all'),
  groupBy: z.enum(['type', 'status', 'roster_period', 'month']).optional(),
  includeApprovalRate: z.boolean().optional().default(true),
  includeCrewAvailability: z.boolean().optional().default(true),
})

export type LeaveAnalyticsFilter = z.infer<typeof LeaveAnalyticsFilterSchema>

// ===================================
// TREND ANALYSIS SCHEMAS
// ===================================

export const TrendAnalysisSchema = z.object({
  metric: AnalyticsMetricEnum,
  period: AnalyticsPeriodEnum,
  dateRange: AnalyticsDateRangeSchema,
  compareWithPrevious: z.boolean().optional().default(true),
  showProjection: z.boolean().optional().default(false),
})

export type TrendAnalysis = z.infer<typeof TrendAnalysisSchema>

// ===================================
// COMPARISON ANALYSIS SCHEMAS
// ===================================

export const ComparisonAnalysisSchema = z.object({
  metric: AnalyticsMetricEnum,
  compareBy: z.enum(['role', 'status', 'category', 'roster_period']),
  dateRange: AnalyticsDateRangeSchema.optional(),
  chartType: ChartTypeEnum.optional().default('bar'),
})

export type ComparisonAnalysis = z.infer<typeof ComparisonAnalysisSchema>

// ===================================
// KPI SCHEMAS
// ===================================

export const KPITargetSchema = z.object({
  metric: AnalyticsMetricEnum,
  target: z.number().min(0, 'Target must be non-negative'),
  unit: z.enum(['percentage', 'count', 'days', 'rate']),
})

export type KPITarget = z.infer<typeof KPITargetSchema>

export const KPIAnalysisSchema = z.object({
  kpis: z.array(KPITargetSchema).min(1, 'At least one KPI is required'),
  dateRange: AnalyticsDateRangeSchema,
  includeHistorical: z.boolean().optional().default(true),
  historicalPeriods: z
    .number()
    .int()
    .min(1)
    .max(12)
    .optional()
    .default(6)
    .describe('Number of historical periods to include'),
})

export type KPIAnalysis = z.infer<typeof KPIAnalysisSchema>

// ===================================
// COMPLIANCE ANALYTICS SCHEMAS
// ===================================

export const ComplianceAnalyticsFilterSchema = z.object({
  dateRange: AnalyticsDateRangeSchema.optional(),
  category: z.string().max(50, 'Category cannot exceed 50 characters').optional(),
  role: z.enum(['Captain', 'First Officer', 'all']).optional().default('all'),
  thresholds: z
    .object({
      critical: z
        .number()
        .int()
        .min(0)
        .max(100)
        .optional()
        .default(0)
        .describe('Expired certifications threshold'),
      warning: z
        .number()
        .int()
        .min(0)
        .max(100)
        .optional()
        .default(30)
        .describe('Expiring within days threshold'),
      target: z
        .number()
        .int()
        .min(0)
        .max(100)
        .optional()
        .default(95)
        .describe('Target compliance percentage'),
    })
    .optional(),
  includeBreakdown: z.boolean().optional().default(true),
})

export type ComplianceAnalyticsFilter = z.infer<typeof ComplianceAnalyticsFilterSchema>

// ===================================
// RETIREMENT PROJECTION SCHEMAS
// ===================================

export const RetirementProjectionSchema = z.object({
  yearsAhead: z
    .number()
    .int()
    .min(1, 'Years ahead must be at least 1')
    .max(15, 'Years ahead cannot exceed 15')
    .optional()
    .default(10),
  role: z.enum(['Captain', 'First Officer', 'all']).optional().default('all'),
  groupBy: z.enum(['year', 'quarter', 'role']).optional().default('year'),
  includeReplacementPlan: z.boolean().optional().default(false),
})

export type RetirementProjection = z.infer<typeof RetirementProjectionSchema>

// ===================================
// EXPORT SCHEMAS
// ===================================

export const AnalyticsExportSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx', 'pdf']),
  filters: z
    .union([
      PilotAnalyticsFilterSchema,
      CertificationAnalyticsFilterSchema,
      LeaveAnalyticsFilterSchema,
      ComplianceAnalyticsFilterSchema,
    ])
    .optional(),
  includeCharts: z.boolean().optional().default(false),
  includeRawData: z.boolean().optional().default(true),
})

export type AnalyticsExport = z.infer<typeof AnalyticsExportSchema>

// ===================================
// CUSTOM REPORT SCHEMAS
// ===================================

export const CustomReportSchema = z.object({
  name: z.string().min(1).max(100, 'Report name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  metrics: z.array(AnalyticsMetricEnum).min(1, 'At least one metric is required'),
  filters: z.record(z.string(), z.any()).optional(),
  dateRange: AnalyticsDateRangeSchema,
  chartType: ChartTypeEnum.optional(),
  schedule: z
    .object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      enabled: z.boolean(),
    })
    .optional(),
})

export type CustomReport = z.infer<typeof CustomReportSchema>
