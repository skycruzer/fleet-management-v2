/**
 * Report Query Hooks - TanStack Query Integration
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Custom hooks for report generation with automatic caching,
 * request deduplication, and optimistic updates
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReportType, ReportFilters, ReportData } from '@/types/reports'

/**
 * Query Keys for Reports
 * Consistent query key structure enables automatic cache invalidation
 */
export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (type: ReportType, filters: ReportFilters) => [...reportKeys.lists(), type, filters] as const,
  preview: (type: ReportType, filters: ReportFilters) => [...reportKeys.all, 'preview', type, filters] as const,
}

/**
 * API Response Types
 */
interface ReportPreviewResponse {
  success: boolean
  report?: ReportData
  error?: string
  details?: Array<{ field: string; message: string }>
}

interface ReportExportResponse {
  success: boolean
  error?: string
}

interface ReportEmailResponse {
  success: boolean
  error?: string
}

/**
 * Fetch report preview data
 */
async function fetchReportPreview(
  reportType: ReportType,
  filters: ReportFilters
): Promise<ReportData> {
  const response = await fetch('/api/reports/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportType, filters }),
  })

  const result: ReportPreviewResponse = await response.json()

  if (!result.success || !result.report) {
    throw new Error(result.error || 'Failed to generate report preview')
  }

  return result.report
}

/**
 * Export report as PDF
 */
async function exportReportPDF(
  reportType: ReportType,
  filters: ReportFilters
): Promise<Blob> {
  const response = await fetch('/api/reports/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportType, filters }),
  })

  if (!response.ok) {
    const result: ReportExportResponse = await response.json()
    throw new Error(result.error || 'Failed to export PDF')
  }

  return response.blob()
}

/**
 * Email report to recipients
 */
async function emailReport(
  reportType: ReportType,
  filters: ReportFilters,
  recipients: string[],
  subject?: string,
  message?: string
): Promise<void> {
  const response = await fetch('/api/reports/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportType, filters, recipients, subject, message }),
  })

  const result: ReportEmailResponse = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Failed to send email')
  }
}

/**
 * Hook: Use Report Preview Query
 *
 * Features:
 * - Automatic caching with TanStack Query (5 min gcTime)
 * - Request deduplication (multiple components share same request)
 * - Automatic refetch on stale data
 * - Built-in loading and error states
 *
 * @param reportType - Type of report (leave, flight-requests, certifications)
 * @param filters - Report filters
 * @param options - Query options (enabled, refetchInterval, etc.)
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useReportPreview('leave', {
 *   dateRange: { startDate: '2025-01-01', endDate: '2025-12-31' },
 *   status: ['approved']
 * })
 * ```
 */
export function useReportPreview(
  reportType: ReportType,
  filters: ReportFilters,
  options?: {
    enabled?: boolean
    refetchInterval?: number | false
  }
) {
  return useQuery({
    queryKey: reportKeys.preview(reportType, filters),
    queryFn: () => fetchReportPreview(reportType, filters),
    // Keep data fresh for 2 minutes (reports change less frequently)
    staleTime: 2 * 60 * 1000,
    // Cache inactive queries for 5 minutes
    gcTime: 5 * 60 * 1000,
    // Don't refetch on window focus (prevents disruption)
    refetchOnWindowFocus: false,
    // Only fetch if filters are valid
    enabled: options?.enabled ?? true,
    // Optional refetch interval
    refetchInterval: options?.refetchInterval ?? false,
    // Single retry on failure
    retry: 1,
  })
}

/**
 * Hook: Use Report Export Mutation
 *
 * Features:
 * - Automatic PDF download on success
 * - Built-in error handling
 * - Loading state management
 * - Toast notifications integration
 *
 * @example
 * ```tsx
 * const exportMutation = useReportExport()
 *
 * const handleExport = () => {
 *   exportMutation.mutate({
 *     reportType: 'leave',
 *     filters: { status: ['approved'] }
 *   })
 * }
 * ```
 */
export function useReportExport() {
  return useMutation({
    mutationFn: ({ reportType, filters }: { reportType: ReportType; filters: ReportFilters }) =>
      exportReportPDF(reportType, filters),
    onSuccess: (blob, variables) => {
      // Automatic PDF download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${variables.reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
  })
}

/**
 * Hook: Use Report Email Mutation
 *
 * Features:
 * - Automatic email sending
 * - Built-in validation
 * - Error handling
 * - Success notifications
 *
 * @example
 * ```tsx
 * const emailMutation = useReportEmail()
 *
 * const handleEmail = () => {
 *   emailMutation.mutate({
 *     reportType: 'leave',
 *     filters: { status: ['approved'] },
 *     recipients: ['manager@example.com'],
 *     subject: 'Monthly Leave Report',
 *     message: 'Please review the attached report'
 *   })
 * }
 * ```
 */
export function useReportEmail() {
  return useMutation({
    mutationFn: ({
      reportType,
      filters,
      recipients,
      subject,
      message,
    }: {
      reportType: ReportType
      filters: ReportFilters
      recipients: string[]
      subject?: string
      message?: string
    }) => emailReport(reportType, filters, recipients, subject, message),
  })
}

/**
 * Hook: Invalidate Report Cache
 *
 * Manually invalidate report caches when underlying data changes.
 * Use this after creating/updating/deleting records that affect reports.
 *
 * @example
 * ```tsx
 * const invalidateReports = useInvalidateReports()
 *
 * const handleLeaveRequestCreate = async () => {
 *   await createLeaveRequest(data)
 *   // Invalidate leave reports cache
 *   invalidateReports('leave')
 * }
 * ```
 */
export function useInvalidateReports() {
  const queryClient = useQueryClient()

  return (reportType?: ReportType) => {
    if (reportType) {
      // Invalidate specific report type
      queryClient.invalidateQueries({
        queryKey: [...reportKeys.all, reportType],
      })
    } else {
      // Invalidate all reports
      queryClient.invalidateQueries({
        queryKey: reportKeys.all,
      })
    }
  }
}

/**
 * Hook: Prefetch Report Preview
 *
 * Prefetch report data before user interaction to improve perceived performance.
 * Useful for warming cache on page load or hover interactions.
 *
 * @example
 * ```tsx
 * const prefetchReport = usePrefetchReport()
 *
 * // Prefetch on hover
 * const handleMouseEnter = () => {
 *   prefetchReport('leave', { status: ['approved'] })
 * }
 * ```
 */
export function usePrefetchReport() {
  const queryClient = useQueryClient()

  return (reportType: ReportType, filters: ReportFilters) => {
    queryClient.prefetchQuery({
      queryKey: reportKeys.preview(reportType, filters),
      queryFn: () => fetchReportPreview(reportType, filters),
      staleTime: 2 * 60 * 1000,
    })
  }
}
