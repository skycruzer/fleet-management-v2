/**
 * Pilot Documents API Route (admin-side)
 * GET:  List documents attached to a pilot
 * POST: Upload a document (multipart/form-data) — admin/manager only
 *
 * Security pipeline: CSRF → admin auth → rate limit → role check → service.
 * Files are validated server-side via magic bytes (PDF, DOC, DOCX, JPG, PNG; 10MB).
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { requireRole, UserRole } from '@/lib/middleware/authorization-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { validateFileWithMagicBytes } from '@/lib/services/file-upload-service'
import { isValidFileSize } from '@/lib/validations/file-upload-schema'
import {
  listPilotDocuments,
  uploadPilotDocument,
  PILOT_DOCUMENT_TYPES,
  type PilotDocumentType,
} from '@/lib/services/pilot-document-service'
import { unauthorizedResponse } from '@/lib/utils/api-response-helper'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) return unauthorizedResponse()

    const { id: pilotId } = await context.params

    const result = await listPilotDocuments(pilotId)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    const sanitized = sanitizeError(error, {
      operation: 'listPilotDocuments',
      endpoint: '/api/pilots/[id]/documents',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
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

    const { id: pilotId } = await context.params

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request format. Expected multipart/form-data.' },
        { status: 400 }
      )
    }

    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'No file provided. Please select a file to upload.' },
        { status: 400 }
      )
    }

    if (!isValidFileSize(file.size)) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds maximum of 10MB. Your file is ${Math.round(file.size / 1024 / 1024)}MB.`,
        },
        { status: 400 }
      )
    }

    const rawType = String(formData.get('documentType') || 'OTHER')
    const documentType: PilotDocumentType = (PILOT_DOCUMENT_TYPES as readonly string[]).includes(
      rawType
    )
      ? (rawType as PilotDocumentType)
      : 'OTHER'
    const title = formData.get('title') ? String(formData.get('title')) : undefined

    const buffer = new Uint8Array(await file.arrayBuffer())

    const magicValidation = validateFileWithMagicBytes(buffer, file.type)
    if (!magicValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error:
            magicValidation.error ||
            'Invalid file type. Please upload a PDF, Word (DOC/DOCX), JPG, or PNG file.',
        },
        { status: 400 }
      )
    }

    const result = await uploadPilotDocument({
      pilotId,
      file: buffer,
      filename: file.name,
      mimeType: magicValidation.detectedType || file.type,
      documentType,
      title,
      uploadedBy: auth.userId ?? undefined,
      uploadedByName: auth.email ?? undefined,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    revalidatePath(`/dashboard/pilots/${pilotId}`)

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Document uploaded successfully',
    })
  } catch (error) {
    const sanitized = sanitizeError(error, {
      operation: 'uploadPilotDocument',
      endpoint: '/api/pilots/[id]/documents',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
