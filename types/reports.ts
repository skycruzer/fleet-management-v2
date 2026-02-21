/**
 * Report Type Definitions
 * Author: Maurice Rondeau
 * Date: January 19, 2025
 *
 * Report types for 3-table architecture: RDO/SDO, Leave, All Requests, and Certifications
 * Phase 3.0: Updated for 3-table architecture
 */

export type ReportType =
  | 'rdo-sdo'
  | 'leave'
  | 'all-requests'
  | 'flight-requests'
  | 'certifications'
  | 'leave-bids'
  | 'pilot-info'
  | 'forecast'

export interface ReportFilters {
  dateRange?: {
    startDate: string
    endDate: string
  }
  rosterPeriod?: string
  rosterPeriods?: string[] // Multiple roster periods
  status?: string[]
  rank?: string[]
  pilotId?: string
  requestType?: string[] // Phase 3.0: Filter by request type (RDO, SDO, ANNUAL, SICK, etc.)
  checkType?: string
  checkTypes?: string[] // Multiple check types/categories
  categories?: string[] // Filter by certification category (Medical, Training, etc.)
  expiryThreshold?: number // days
  // Phase 2.3: Pagination support
  page?: number // Current page (1-indexed)
  pageSize?: number // Records per page (default: 50)
  // Pilot Info Report filters
  activeStatus?: 'active' | 'inactive' | 'all'
  qualifications?: string[] // 'line_captain', 'training_captain', 'examiner'
  licenceType?: ('ATPL' | 'CPL')[]
  // Leave Bids Report filters
  year?: number // Bid year filter
  // Forecast Report filters
  timeHorizon?: '2yr' | '5yr' | '10yr'
  forecastSections?: ('retirement' | 'succession' | 'shortage')[]
  // Phase 5.1: Grouping support for PDF exports and previews
  groupBy?: ('rosterPeriod' | 'rank' | 'category')[]
}

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
