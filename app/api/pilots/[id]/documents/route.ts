/**
 * Pilot Documents API Route (admin-side)
 * GET:  List documents attached to a pilot
 * POST: Upload a document (multipart/form-data) — admin/manager only
 *
 * Security pipeline (CSRF → admin auth → rate limit → role check) via createAdminRoute.
 * Files are validated server-side via magic bytes (PDF, DOC, DOCX, JPG, PNG; 10MB).
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { authRateLimit } from '@/lib/rate-limit'
import { UserRole } from '@/lib/middleware/authorization-middleware'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { validateFileWithMagicBytes } from '@/lib/services/file-upload-service'
import { isValidFileSize } from '@/lib/validations/file-upload-schema'
import {
  listPilotDocuments,
  uploadPilotDocument,
  PILOT_DOCUMENT_TYPES,
  type PilotDocumentType,
} from '@/lib/services/pilot-document-service'

export const dynamic = 'force-dynamic'

export const GET = createAdminRoute(
  {
    operation: 'listPilotDocuments',
    endpoint: '/api/pilots/[id]/documents',
    rateLimit: false,
  },
  async ({ params }) => {
    const pilotId = params.id

    const result = await listPilotDocuments(pilotId)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })
  }
)

export const POST = createAdminRoute(
  {
    operation: 'uploadPilotDocument',
    endpoint: '/api/pilots/[id]/documents',
    rateLimit: { limiter: authRateLimit, by: 'user' },
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  async ({ request, params, admin }) => {
    const pilotId = params.id

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
      uploadedBy: admin.userId,
      uploadedByName: admin.email ?? undefined,
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
  }
)
