import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogById } from '@/lib/services/audit-service'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'

/**
 * GET /api/audit/[id]
 *
 * Fetch a single audit log record by ID.
 * Returns full details including old/new data for diff view.
 *
 * @spec 001-missing-core-features (US4, T070)
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auditId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(auditId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid audit log ID format' },
        { status: 400 }
      )
    }

    // Fetch audit log
    const auditLog = await getAuditLogById(auditId)

    if (!auditLog) {
      return NextResponse.json({ success: false, error: 'Audit log not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: auditLog }, { status: 200 })
  } catch (error) {
    console.error('Audit log GET [id] error:', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message },
      { status: 500 }
    )
  }
}
