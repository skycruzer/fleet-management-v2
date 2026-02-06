/**
 * Medical Certificate Upload API Route
 *
 * Developer: Maurice Rondeau
 * Date: February 2, 2026
 *
 * Handles medical certificate uploads for sick leave requests.
 * - POST: Upload a medical certificate file
 *
 * Security:
 * - Validates pilot session via custom auth
 * - Server-side file type validation using magic bytes
 * - Size limit: 10MB
 * - Rate limited: 20 requests/minute
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import {
  uploadMedicalCertificate,
  validateFileWithMagicBytes,
} from '@/lib/services/file-upload-service'
import { isValidFileSize } from '@/lib/validations/file-upload-schema'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * POST - Upload Medical Certificate
 *
 * Accepts multipart/form-data with a single file field named 'file'.
 * Returns signed URL on success.
 */
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // Authenticate pilot
    const pilot = await getCurrentPilot()
    if (!pilot || !pilot.pilot_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Please log in to upload files.',
        },
        { status: 401 }
      )
    }

    // Parse multipart form data
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format. Expected multipart/form-data.',
        },
        { status: 400 }
      )
    }

    // Get the file from the form
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided. Please select a file to upload.',
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (!isValidFileSize(file.size)) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds maximum of 10MB. Your file is ${Math.round(file.size / 1024 / 1024)}MB.`,
        },
        { status: 400 }
      )
    }

    // Convert file to buffer for server-side validation
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Validate file type using magic bytes (more secure than trusting Content-Type)
    const magicValidation = validateFileWithMagicBytes(buffer, file.type)
    if (!magicValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error:
            magicValidation.error || 'Invalid file type. Please upload a PDF, JPG, or PNG file.',
        },
        { status: 400 }
      )
    }

    // Upload to Supabase Storage
    const uploadResult = await uploadMedicalCertificate({
      file: buffer,
      filename: file.name,
      mimeType: magicValidation.detectedType || file.type,
      pilotId: pilot.pilot_id,
    })

    if (!uploadResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: uploadResult.error || 'Failed to upload file. Please try again.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        path: uploadResult.path,
        url: uploadResult.url,
      },
      message: 'Medical certificate uploaded successfully',
    })
  } catch (error) {
    console.error('Medical certificate upload error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'uploadMedicalCertificate',
      endpoint: '/api/portal/upload/medical-certificate',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})
