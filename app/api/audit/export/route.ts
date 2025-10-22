import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogs, exportAuditLogsToCSV } from '@/lib/services/audit-service'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'

/**
 * GET /api/audit/export
 *
 * Export audit logs to CSV format.
 * Applies the same filters as the main audit logs endpoint.
 * Returns CSV file for download.
 *
 * Query parameters (same as /api/audit):
 * - userEmail, tableName, action, recordId
 * - startDate, endDate
 * - searchQuery
 * - Max 10,000 records per export
 *
 * @spec 001-missing-core-features (US4, T071)
 */
export async function GET(_request: NextRequest) {
  try {
    const searchParams = _request.nextUrl.searchParams

    // Build filters from query params
    const filters: any = {
      pageSize: 10000, // Max export limit
      page: 1,
    }

    const userEmail = searchParams.get('userEmail')
    if (userEmail) {
      filters.userEmail = userEmail
    }

    const tableName = searchParams.get('tableName')
    if (tableName) {
      filters.tableName = tableName
    }

    const action = searchParams.get('action')
    if (action) {
      filters.action = action
    }

    const recordId = searchParams.get('recordId')
    if (recordId) {
      filters.recordId = recordId
    }

    const startDateStr = searchParams.get('startDate')
    if (startDateStr) {
      filters.startDate = new Date(startDateStr)
    }

    const endDateStr = searchParams.get('endDate')
    if (endDateStr) {
      filters.endDate = new Date(endDateStr)
    }

    const searchQuery = searchParams.get('searchQuery')
    if (searchQuery) {
      filters.searchQuery = searchQuery
    }

    // Fetch audit logs
    const result = await getAuditLogs(filters)

    // Convert to CSV
    const csv = exportAuditLogsToCSV(result.logs)

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `audit-logs-${timestamp}.csv`

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Audit logs export error:', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message },
      { status: 500 }
    )
  }
}
