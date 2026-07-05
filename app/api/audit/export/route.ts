/**
 * Audit Trail Export API Route
 * GET /api/audit/export
 *
 * Exports audit trail data to CSV format
 * Supports filtering by entity type, entity ID, and date range
 *
 * @version 2.0.0
 * @since 2025-10-25
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { exportAuditTrailCSV } from '@/lib/services/audit-service'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/audit/export
 * Export audit trail to CSV
 *
 * Query Parameters (all optional — an unfiltered export returns the full trail):
 * - tableName: Database table name (e.g. pilots, pilot_checks, pilot_requests)
 * - recordId: Specific record UUID
 * - action: Action type (INSERT, UPDATE, DELETE, RESTORE, SOFT_DELETE)
 * - userId: User UUID who performed the action
 * - startDate: ISO date string for start of range
 * - endDate: ISO date string for end of range
 */
export const GET = createAdminRoute(
  {
    operation: 'exportAuditTrail',
    endpoint: '/api/audit/export',
    rateLimit: false,
  },
  async ({ request, admin }) => {
    try {
      // Get user role to verify permissions
      const supabase = createAdminClient()
      const { data: userData, error: userError } = await supabase
        .from('an_users')
        .select('role')
        .eq('id', admin.userId)
        .single()

      if (userError || !userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Only Admin and Manager roles can export audit trails (an_users.role is lowercase)
      if (!['admin', 'manager'].includes(userData.role?.toLowerCase())) {
        return NextResponse.json(
          { error: 'Insufficient permissions to export audit trails' },
          { status: 403 }
        )
      }

      // Parse query parameters (matches the params the audit page forwards)
      const searchParams = request.nextUrl.searchParams
      const tableName = searchParams.get('tableName')
      // `entityId` is the legacy param name still sent by <ExportAuditButton>; it maps to record_id.
      const recordId = searchParams.get('recordId') ?? searchParams.get('entityId')
      const action = searchParams.get('action')
      const userId = searchParams.get('userId')
      const startDateStr = searchParams.get('startDate')
      const endDateStr = searchParams.get('endDate')

      // Parse dates if provided
      const startDate = startDateStr ? new Date(startDateStr) : undefined
      const endDate = endDateStr ? new Date(endDateStr) : undefined

      // Validate dates
      if (startDate && isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid startDate format. Use ISO 8601 format.' },
          { status: 400 }
        )
      }

      if (endDate && isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endDate format. Use ISO 8601 format.' },
          { status: 400 }
        )
      }

      // Build filters object (all optional — omitted filters export the full trail)
      const filters = {
        tableName: tableName || undefined,
        recordId: recordId || undefined,
        action: action || undefined,
        startDate,
        endDate,
        userId: userId || undefined,
      }

      // Call service to generate CSV
      const csvData = await exportAuditTrailCSV(filters)

      // Set headers for CSV download
      const filenameScope = tableName || action || 'all'
      const headers = new Headers()
      headers.set('Content-Type', 'text/csv; charset=utf-8')
      headers.set(
        'Content-Disposition',
        `attachment; filename="audit-trail-${filenameScope}-${new Date().toISOString().split('T')[0]}.csv"`
      )
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')

      return new NextResponse(csvData, {
        status: 200,
        headers,
      })
    } catch (error) {
      console.error('Audit export error:', error)

      const s = sanitizeError(error, {
        operation: 'exportAuditTrail',
        endpoint: '/api/audit/export',
      })
      return NextResponse.json({ error: s.error }, { status: s.statusCode || 500 })
    }
  }
)
