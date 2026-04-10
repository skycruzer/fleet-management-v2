/**
 * Request Query Parameters Validation Schema
 *
 * Zod validation for /api/requests query params and body.
 * Replaces manual parsing with type-safe validation.
 *
 * @author Maurice Rondeau
 * @version 1.0.0
 */

import { z } from 'zod'
import type {
  RequestCategory,
  WorkflowStatus,
  SubmissionChannel,
  RequestType,
  PilotRank,
} from '@/lib/services/unified-request-service'

/**
 * Request category enum - matches database CHECK constraint
 */
export const RequestCategoryEnum = z.enum(['LEAVE', 'FLIGHT', 'LEAVE_BID'])

/**
 * Workflow status enum - matches database CHECK constraint
 */
export const WorkflowStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'IN_REVIEW',
  'APPROVED',
  'DENIED',
  'WITHDRAWN',
])

/**
 * Submission channel enum - matches database CHECK constraint
 */
export const SubmissionChannelEnum = z.enum([
  'PILOT_PORTAL',
  'EMAIL',
  'PHONE',
  'ORACLE',
  'ADMIN_PORTAL',
])

/**
 * Request type enum - matches RequestType union in unified-request-service
 */
export const RequestTypeEnum = z.enum([
  // Leave types
  'ANNUAL',
  'SICK',
  'LSL',
  'LWOP',
  'MATERNITY',
  'COMPASSIONATE',
  // Flight types
  'RDO',
  'SDO',
  'FLIGHT_REQUEST',
  'SCHEDULE_CHANGE',
])

/**
 * Rank enum - matches database values
 */
export const RankEnum = z.enum(['Captain', 'First Officer'])

/**
 * Helper to parse comma-separated string into array
 */
function parseCommaSeparated(value: string | null): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * ISO date string validation
 */
const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in format YYYY-MM-DD')

/**
 * Validated request query parameters type
 */
export interface ValidatedQueryParams {
  roster_period?: string
  pilot_id?: string
  status?: WorkflowStatus[]
  category?: RequestCategory[]
  channel?: SubmissionChannel[]
  start_date_from?: string
  start_date_to?: string
  is_late?: boolean
  is_past_deadline?: boolean
}

/**
 * Helper to parse and validate query params from URLSearchParams
 */
export function parseRequestQueryParams(searchParams: URLSearchParams): {
  success: boolean
  data?: ValidatedQueryParams
  errors?: Array<{ path: string[]; message: string }>
} {
  const errors: Array<{ path: string[]; message: string }> = []
  const result: ValidatedQueryParams = {}

  // Roster period - optional string
  const rosterPeriod = searchParams.get('roster_period')
  if (rosterPeriod) {
    result.roster_period = rosterPeriod
  }

  // Pilot ID - optional UUID
  const pilotId = searchParams.get('pilot_id')
  if (pilotId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(pilotId)) {
      errors.push({ path: ['pilot_id'], message: 'Invalid pilot ID format (must be UUID)' })
    } else {
      result.pilot_id = pilotId
    }
  }

  // Status filter (comma-separated)
  const statusParam = searchParams.get('status')
  if (statusParam) {
    const statuses = parseCommaSeparated(statusParam)
    const validStatuses: WorkflowStatus[] = []
    const validValues = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'DENIED', 'WITHDRAWN']
    for (const s of statuses) {
      if (validValues.includes(s)) {
        validStatuses.push(s as WorkflowStatus)
      } else {
        errors.push({ path: ['status'], message: `Invalid status: ${s}` })
      }
    }
    if (validStatuses.length > 0) {
      result.status = validStatuses
    }
  }

  // Category filter (comma-separated)
  const categoryParam = searchParams.get('category')
  if (categoryParam) {
    const categories = parseCommaSeparated(categoryParam)
    const validCategories: RequestCategory[] = []
    const validValues = ['LEAVE', 'FLIGHT', 'LEAVE_BID']
    for (const c of categories) {
      if (validValues.includes(c)) {
        validCategories.push(c as RequestCategory)
      } else {
        errors.push({ path: ['category'], message: `Invalid category: ${c}` })
      }
    }
    if (validCategories.length > 0) {
      result.category = validCategories
    }
  }

  // Channel filter (comma-separated)
  const channelParam = searchParams.get('channel')
  if (channelParam) {
    const channels = parseCommaSeparated(channelParam)
    const validChannels: SubmissionChannel[] = []
    const validValues = ['PILOT_PORTAL', 'EMAIL', 'PHONE', 'ORACLE', 'ADMIN_PORTAL']
    for (const c of channels) {
      if (validValues.includes(c)) {
        validChannels.push(c as SubmissionChannel)
      } else {
        errors.push({ path: ['channel'], message: `Invalid channel: ${c}` })
      }
    }
    if (validChannels.length > 0) {
      result.channel = validChannels
    }
  }

  // Date range filters
  const startDateFrom = searchParams.get('start_date_from')
  if (startDateFrom) {
    const dateResult = IsoDateSchema.safeParse(startDateFrom)
    if (!dateResult.success) {
      errors.push({ path: ['start_date_from'], message: 'Date must be in format YYYY-MM-DD' })
    } else {
      result.start_date_from = startDateFrom
    }
  }

  const startDateTo = searchParams.get('start_date_to')
  if (startDateTo) {
    const dateResult = IsoDateSchema.safeParse(startDateTo)
    if (!dateResult.success) {
      errors.push({ path: ['start_date_to'], message: 'Date must be in format YYYY-MM-DD' })
    } else {
      result.start_date_to = startDateTo
    }
  }

  // Boolean filters
  const isLate = searchParams.get('is_late')
  if (isLate !== null) {
    if (isLate === 'true') {
      result.is_late = true
    } else if (isLate === 'false') {
      result.is_late = false
    } else {
      errors.push({ path: ['is_late'], message: 'Must be true or false' })
    }
  }

  const isPastDeadline = searchParams.get('is_past_deadline')
  if (isPastDeadline !== null) {
    if (isPastDeadline === 'true') {
      result.is_past_deadline = true
    } else if (isPastDeadline === 'false') {
      result.is_past_deadline = false
    } else {
      errors.push({ path: ['is_past_deadline'], message: 'Must be true or false' })
    }
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: result }
}

/**
 * POST /api/requests body schema
 */
export const CreateRequestBodySchema = z.object({
  pilot_id: z.string().uuid('Invalid pilot ID format'),
  pilot_user_id: z.string().uuid().optional(),
  employee_number: z.string().optional(),
  rank: RankEnum.optional(),
  name: z.string().optional(),
  request_category: RequestCategoryEnum,
  request_type: RequestTypeEnum,
  submission_channel: SubmissionChannelEnum.default('ADMIN_PORTAL'),
  start_date: IsoDateSchema,
  end_date: IsoDateSchema.optional(),
  flight_date: IsoDateSchema.optional(),
  reason: z.string().max(2000, 'Reason cannot exceed 2000 characters').optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  is_late_request: z.boolean().optional(),
  submitted_by_admin_id: z.string().uuid().optional(),
  source_reference: z.string().max(500, 'Source reference cannot exceed 500 characters').optional(),
  source_attachment_url: z.string().url('Invalid attachment URL').optional(),
})

export type CreateRequestBody = z.infer<typeof CreateRequestBodySchema>
