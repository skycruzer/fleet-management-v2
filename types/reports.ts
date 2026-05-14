/**
 * Report Type Definitions
 * Author: Maurice Rondeau
 * Date: January 19, 2025
 *
 * Report types for 3-table architecture: RDO/SDO, Leave, All Requests, and Certifications
 * Phase 3.0: Updated for 3-table architecture
 */

import type { ReportFilters } from '@/lib/validations/reports-schema'

// ReportFilters is derived from the Zod schema (single source of truth).
// Adding a form field that the schema doesn't accept becomes a TS error here
// instead of being silently stripped at runtime.
export type { ReportFilters } from '@/lib/validations/reports-schema'

export type ReportType =
  | 'rdo-sdo'
  | 'leave'
  | 'all-requests'
  | 'flight-requests'
  | 'certifications'
  | 'leave-bids'
  | 'pilot-info'
  | 'forecast'

export interface PaginationMeta {
  currentPage: number
  pageSize: number
  totalRecords: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ReportData {
  title: string
  description: string
  generatedAt: string
  generatedBy: string
  filters: ReportFilters
  data: any[]
  summary?: Record<string, any>
  // Phase 2.3: Pagination metadata
  pagination?: PaginationMeta
}

export interface ReportPreviewResponse {
  success: boolean
  report: ReportData
  error?: string
}

export interface ReportEmailRequest {
  reportType: ReportType
  filters: ReportFilters
  recipients: string[]
  subject?: string
  message?: string
}

export interface ReportEmailResponse {
  success: boolean
  messageId?: string
  error?: string
}
