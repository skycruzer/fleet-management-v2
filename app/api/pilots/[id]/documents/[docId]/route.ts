/**
 * Pilot Document API Route (admin-side, single document)
 * GET:    Return a short-lived signed URL for viewing/downloading
 * DELETE: Remove the document (storage + metadata) — admin/manager only
 *
 * Security pipeline (CSRF → admin auth → rate limit → role check) via createAdminRoute.
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { authRateLimit } from '@/lib/rate-limit'
import { UserRole } from '@/lib/middleware/authorization-middleware'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { invalidatePilotCaches } from '@/lib/services/cache-invalidation-helper'
import {
  getPilotDocumentSignedUrl,
  deletePilotDocument,
} from '@/lib/services/pilot-document-service'

export const dynamic = 'force-dynamic'

export const GET = createAdminRoute(
  {
    operation: 'getPilotDocumentSignedUrl',
    endpoint: '/api/pilots/[id]/documents/[docId]',
    rateLimit: false,
  },
  async ({ params }) => {
    const pilotId = params.id
    const docId = params.docId

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
  }
)

export const DELETE = createAdminRoute(
  {
    operation: 'deletePilotDocument',
    endpoint: '/api/pilots/[id]/documents/[docId]',
    rateLimit: { limiter: authRateLimit, by: 'user' },
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  async ({ params }) => {
    const pilotId = params.id
    const docId = params.docId

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

    await invalidatePilotCaches(pilotId).catch((error) =>
      console.error('Cache invalidation failed (non-blocking):', error)
    )

    return NextResponse.json({ success: true, message: 'Document deleted' })
  }
)
