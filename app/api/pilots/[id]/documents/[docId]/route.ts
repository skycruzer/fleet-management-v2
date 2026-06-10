/**
 * Pilot Document API Route (admin-side, single document)
 * GET:    Return a short-lived signed URL for viewing/downloading
 * DELETE: Remove the document (storage + metadata) — admin/manager only
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { requireRole, UserRole } from '@/lib/middleware/authorization-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import {
  getPilotDocumentSignedUrl,
  deletePilotDocument,
} from '@/lib/services/pilot-document-service'
import { unauthorizedResponse } from '@/lib/utils/api-response-helper'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string; docId: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) return unauthorizedResponse()

    const { id: pilotId, docId } = await context.params

    const result = await getPilotDocumentSignedUrl(docId)
    if (!result.success || !result.data) {
      const status = result.errorCode === 'NOT_FOUND' ? 404 : 500
      return NextResponse.json({ success: false, error: result.error }, { status })
    }

    // Guard against cross-pilot document access via mismatched URL
    if (result.data.document.pilot_id !== pilotId) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { url: result.data.url, document: result.data.document },
    })
  } catch (error) {
    const sanitized = sanitizeError(error, {
      operation: 'getPilotDocumentSignedUrl',
      endpoint: '/api/pilots/[id]/documents/[docId]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) return unauthorizedResponse()

    const { success: rateLimitSuccess } = await authRateLimit.limit(auth.userId!)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const roleCheck = await requireRole(request, [UserRole.ADMIN, UserRole.MANAGER])
    if (!roleCheck.authorized) {
      return NextResponse.json(
        { success: false, error: roleCheck.error || 'Insufficient permissions' },
        { status: roleCheck.statusCode || 403 }
      )
    }

    const { id: pilotId, docId } = await context.params

    // Verify the document belongs to the pilot in the URL before deleting
    const lookup = await getPilotDocumentSignedUrl(docId)
    if (!lookup.success || !lookup.data || lookup.data.document.pilot_id !== pilotId) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 })
    }

    const result = await deletePilotDocument(docId)
    if (!result.success) {
      const status = result.errorCode === 'NOT_FOUND' ? 404 : 500
      return NextResponse.json({ success: false, error: result.error }, { status })
    }

    revalidatePath(`/dashboard/pilots/${pilotId}`)

    return NextResponse.json({ success: true, message: 'Document deleted' })
  } catch (error) {
    const sanitized = sanitizeError(error, {
      operation: 'deletePilotDocument',
      endpoint: '/api/pilots/[id]/documents/[docId]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
