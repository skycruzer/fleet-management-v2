import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogs, getAuditStats } from '@/lib/services/audit-service'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'

/**
 * GET /api/audit
 *
 * Fetch audit logs with filtering and pagination.
 * Admin-only endpoint for compliance tracking.
 *
 * Query parameters:
 * - userEmail: Filter by user email
 * - tableName: Filter by table name
 * - action: Filter by action (INSERT, UPDATE, DELETE, etc.)
 * - recordId: Filter by specific record ID
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 * - searchQuery: Search in descriptions
 * - page: Page number (default: 1)
 * - pageSize: Results per page (default: 20, max: 100)
 * - sortBy: Sort field (default: created_at)
 * - sortOrder: asc or desc (default: desc)
 * - stats: Return statistics instead of logs (stats=true)
 *
 * @spec 001-missing-core-features (US4, T069)
 */
export async function GET(_request: NextRequest) {
  try {
    const searchParams = _request.nextUrl.searchParams

    // Check if stats are requested
    const includeStats = searchParams.get('stats') === 'true'

    if (includeStats) {
      // Parse date range for stats
      const startDateStr = searchParams.get('startDate')
      const endDateStr = searchParams.get('endDate')

      const startDate = startDateStr ? new Date(startDateStr) : undefined
      const endDate = endDateStr ? new Date(endDateStr) : undefined

      const stats = await getAuditStats(startDate, endDate)

      return NextResponse.json({ success: true, data: stats }, { status: 200 })
    }

    // Build filters from query params
    const filters: any = {}

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

    const page = parseInt(searchParams.get('page') || '1')
    if (!isNaN(page) && page > 0) {
      filters.page = page
    }

    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    if (!isNaN(pageSize) && pageSize > 0 && pageSize <= 100) {
      filters.pageSize = pageSize
    }

    const sortBy = searchParams.get('sortBy')
    if (sortBy && ['created_at', 'user_email', 'table_name', 'action'].includes(sortBy)) {
      filters.sortBy = sortBy
    }

    const sortOrder = searchParams.get('sortOrder')
    if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
      filters.sortOrder = sortOrder
    }

    // Fetch audit logs
    const result = await getAuditLogs(filters)

    return NextResponse.json(
      {
        success: true,
        data: result.logs,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          totalCount: result.totalCount,
          totalPages: result.totalPages,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Audit logs GET error:', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message },
      { status: 500 }
    )
  }
}
