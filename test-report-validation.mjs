/**
 * Test Report Validation
 * Simulates what the forms send to the API
 */

import { z } from 'zod'

// Copy of validation schema
const DateRangeSchema = z.object({
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
}).refine(
  (data) => {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    return start <= end
  },
  {
    message: 'Start date must be before or equal to end date',
    path: ['startDate'],
  }
).refine(
  (data) => {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff <= 365 * 2
  },
  {
    message: 'Date range cannot exceed 2 years',
    path: ['dateRange'],
  }
)

const ReportFiltersSchema = z.object({
  dateRange: DateRangeSchema.optional(),
  status: z.array(z.enum(['PENDING', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED'])).optional(),
  rank: z.array(z.enum(['Captain', 'First Officer'])).optional(),
  rosterPeriod: z.string().optional(),
  rosterPeriods: z.array(z.string()).optional(),
  checkTypes: z.array(z.string().uuid()).optional(),
  expiryThreshold: z.number().int().min(0).max(365).optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(200).optional(),
})

const ReportPreviewRequestSchema = z.object({
  reportType: z.enum(['leave', 'flight-requests', 'certifications']),
  filters: ReportFiltersSchema.optional(),
})

// Test cases
const testCases = [
  {
    name: 'Leave report with date range',
    payload: {
      reportType: 'leave',
      filters: {
        dateRange: {
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        },
        status: ['PENDING', 'APPROVED']
      }
    }
  },
  {
    name: 'Flight report with roster periods',
    payload: {
      reportType: 'flight-requests',
      filters: {
        rosterPeriods: ['RP1/2025', 'RP2/2025'],
        status: ['SUBMITTED']
      }
    }
  },
  {
    name: 'Certification report with no filters',
    payload: {
      reportType: 'certifications',
      filters: {}
    }
  },
  {
    name: 'Report with empty filters (undefined)',
    payload: {
      reportType: 'leave'
    }
  }
]

console.log('🧪 Testing Report Validation\n')

for (const testCase of testCases) {
  console.log(`Testing: ${testCase.name}`)
  const result = ReportPreviewRequestSchema.safeParse(testCase.payload)

  if (result.success) {
    console.log('✅ PASSED')
    console.log('Validated data:', JSON.stringify(result.data, null, 2))
  } else {
    console.log('❌ FAILED')
    console.log('Errors:', result.error.issues.map(err => ({
      path: err.path.join('.'),
      message: err.message
    })))
  }
  console.log('')
}
