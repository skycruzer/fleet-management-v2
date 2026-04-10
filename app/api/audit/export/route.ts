/**
 * Audit Trail Export API Route
 * GET /api/audit/export
 *
 * Exports audit trail data to CSV format
 * Supports filtering by entity type, entity ID, and date range
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { exportAuditTrailCSV } from '@/lib/services/audit-service'

/**
 * GET /api/audit/export
 * Export audit trail to CSV
 *
 * Query Parameters:
 * - entityType (required): Type of entity (leave_request, pilot_check, etc.)
 * - entityId (optional): Specific entity UUID
 * - startDate (optional): ISO date string for start of range
 * - endDate (optional): ISO date string for end of range
 * - tableName (optional): Database table name
 * - operation (optional): Operation type (INSERT, UPDATE, DELETE)
 * - userId (optional): User UUID who performed the action
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 })
    }

    // Get user role to verify permissions
    const supabase = createAdminClient()
    const { data: userData, error: userError } = await supabase
      .from('an_users')
      .select('role')
      .eq('id', auth.userId!)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only Admin and Manager roles can export audit trails
    if (!['Admin', 'Manager'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to export audit trails' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const tableName = searchParams.get('tableName')
    const operation = searchParams.get('operation')
    const userId = searchParams.get('userId')

    // Validate required parameters
    if (!entityType) {
      return NextResponse.json({ error: 'entityType parameter is required' }, { status: 400 })
    }

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

    // Build filters object
    const filters = {
      entityType,
      entityId: entityId || undefined,
      startDate,
      endDate,
      tableName: tableName || undefined,
      operation: operation || undefined,
      userId: userId || undefined,
    }

    // Call service to generate CSV
    const csvData = await exportAuditTrailCSV(filters)

    // Set headers for CSV download
    const headers = new Headers()
    headers.set('Content-Type', 'text/csv; charset=utf-8')
    headers.set(
      'Content-Disposition',
      `attachment; filename="audit-trail-${entityType}-${new Date().toISOString().split('T')[0]}.csv"`
    )
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')

    return new NextResponse(csvData, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Audit export error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export audit trail' },
      { status: 500 }
    )
  }
}
