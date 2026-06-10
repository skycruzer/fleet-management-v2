/**
 * Link Documents to Leave Request API Route (pilot portal)
 *
 * POST: After a leave request is created, link previously uploaded
 * documents (pilot_documents rows) to it so reviewers see all attachments.
 *
 * Security: rate limit → CSRF → pilot session via createPilotRoute. Ownership
 * is double-guarded in the service: the request must belong to the session
 * pilot, and only the pilot's own unlinked documents can be linked.
 *
 * @updated 2026-06-10 - Migrated to createPilotRoute factory
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { linkDocumentsToRequest } from '@/lib/services/pilot-document-service'
import { createPilotRoute } from '@/lib/middleware/create-api-route'

const LinkDocumentsSchema = z.object({
  request_id: z.string().uuid('Invalid request ID'),
  document_ids: z.array(z.string().uuid('Invalid document ID')).min(1).max(10),
})

export const POST = createPilotRoute(
  {
    operation: 'linkDocumentsToRequest',
    endpoint: '/api/portal/leave-requests/link-documents',
  },
  async ({ request, pilot }) => {
    if (!pilot.pilot_id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = LinkDocumentsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid request body' },
        { status: 400 }
      )
    }

    const result = await linkDocumentsToRequest(
      parsed.data.document_ids,
      parsed.data.request_id,
      pilot.pilot_id
    )

    if (!result.success) {
      const status = result.errorCode === 'NOT_FOUND' ? 404 : 500
      return NextResponse.json({ success: false, error: result.error }, { status })
    }

    return NextResponse.json({ success: true, data: { linked: result.data } })
  }
)
