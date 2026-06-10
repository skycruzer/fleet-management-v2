/**
 * Link Documents to Leave Request API Route (pilot portal)
 *
 * POST: After a leave request is created, link previously uploaded
 * documents (pilot_documents rows) to it so reviewers see all attachments.
 *
 * Security: CSRF → pilot session → rate limit (withRateLimit). Ownership is
 * double-guarded in the service: the request must belong to the session
 * pilot, and only the pilot's own unlinked documents can be linked.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { linkDocumentsToRequest } from '@/lib/services/pilot-document-service'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

const LinkDocumentsSchema = z.object({
  request_id: z.string().uuid('Invalid request ID'),
  document_ids: z.array(z.string().uuid('Invalid document ID')).min(1).max(10),
})

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const pilot = await getCurrentPilot()
    if (!pilot || !pilot.pilot_id) {
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
  } catch (error) {
    const sanitized = sanitizeError(error, {
      operation: 'linkDocumentsToRequest',
      endpoint: '/api/portal/leave-requests/link-documents',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})
