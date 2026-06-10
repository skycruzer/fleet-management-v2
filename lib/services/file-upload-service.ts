/**
 * File Upload Service
 *
 * Developer: Maurice Rondeau
 * Date: February 2, 2026
 *
 * Service layer for handling file uploads to Supabase Storage.
 * Specifically designed for medical certificate uploads in sick leave requests.
 *
 * Security:
 * - Uses service role client to bypass RLS (pilot portal uses custom auth)
 * - Validates MIME type server-side (not just extension)
 * - Enforces 10MB size limit
 * - Generates signed URLs with 1-hour expiration
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  isValidMimeType,
  isValidFileSize,
  generateStoragePath,
  type AllowedMimeType,
} from '@/lib/validations/file-upload-schema'
import { logError, logWarning, ErrorSeverity } from '@/lib/error-logger'

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Storage bucket name for medical certificates
 */
export const MEDICAL_CERTIFICATES_BUCKET = 'medical-certificates'

/**
 * Storage bucket name for pilot documents (contracts, memos, qualifications)
 */
export const PILOT_DOCUMENTS_BUCKET = 'pilot-documents'

/**
 * Signed URL expiration time (1 hour in seconds)
 */
export const SIGNED_URL_EXPIRATION = 3600

// ============================================================================
// TYPES
// ============================================================================

export interface UploadResult {
  success: boolean
  path?: string
  url?: string
  error?: string
}

export interface FileUploadInput {
  file: Buffer | Uint8Array
  filename: string
  mimeType: string
  pilotId: string
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Upload a medical certificate to Supabase Storage
 *
 * @param input - File upload input including file buffer, metadata, and pilot ID
 * @returns Upload result with path and signed URL on success
 *
 * @example
 * ```typescript
 * const result = await uploadMedicalCertificate({
 *   file: fileBuffer,
 *   filename: 'medical-cert.pdf',
 *   mimeType: 'application/pdf',
 *   pilotId: 'uuid-of-pilot'
 * })
 *
 * if (result.success) {
 *   // Use result.url as the signed URL
 * }
 * ```
 */
export async function uploadMedicalCertificate(input: FileUploadInput): Promise<UploadResult> {
  return uploadFileToBucket(MEDICAL_CERTIFICATES_BUCKET, input)
}

/**
 * Upload a file to a storage bucket under the pilot's folder
 *
 * Generic version of the medical-certificate upload used by both the
 * medical-certificates and pilot-documents buckets. Same validation,
 * path convention ({pilotId}/{timestamp}-{filename}) and signed-URL flow.
 */
export async function uploadFileToBucket(
  bucket: string,
  input: FileUploadInput
): Promise<UploadResult> {
  try {
    const { file, filename, mimeType, pilotId } = input

    // Validate file size
    if (!isValidFileSize(file.length)) {
      return {
        success: false,
        error: `File size exceeds maximum of 10MB`,
      }
    }

    // Validate MIME type
    if (!isValidMimeType(mimeType)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload a PDF, Word (DOC/DOCX), JPG, or PNG file.',
      }
    }

    // Generate storage path
    const storagePath = generateStoragePath(pilotId, filename)

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createServiceRoleClient()

    // Upload file to storage
    const { data, error } = await supabase.storage.from(bucket).upload(storagePath, file, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false, // Don't overwrite existing files
    })

    if (error) {
      console.error('Storage upload error:', error)
      return {
        success: false,
        error: 'Failed to upload file. Please try again.',
      }
    }

    // Generate signed URL for immediate access
    const signedUrl = await getSignedUrlForBucket(bucket, data.path)

    if (!signedUrl) {
      // File uploaded but couldn't generate signed URL
      // This is recoverable - admin can still access via service role
      console.warn('File uploaded but signed URL generation failed:', data.path)
    }

    return {
      success: true,
      path: data.path,
      url: signedUrl || undefined,
    }
  } catch (error) {
    console.error('Upload file error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during upload.',
    }
  }
}

/**
 * Get a signed URL for a medical certificate
 *
 * @param path - Storage path of the file
 * @param expiresIn - URL expiration in seconds (default: 1 hour)
 * @returns Signed URL or null if generation fails
 *
 * @example
 * ```typescript
 * const url = await getMedicalCertificateSignedUrl('pilot-id/timestamp-cert.pdf')
 * if (url) {
 *   // URL is valid for 1 hour
 * }
 * ```
 */
export async function getMedicalCertificateSignedUrl(
  path: string,
  expiresIn: number = SIGNED_URL_EXPIRATION
): Promise<string | null> {
  return getSignedUrlForBucket(MEDICAL_CERTIFICATES_BUCKET, path, expiresIn)
}

/**
 * Get a signed URL for a file in any private bucket
 */
export async function getSignedUrlForBucket(
  bucket: string,
  path: string,
  expiresIn: number = SIGNED_URL_EXPIRATION
): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)

    if (error) {
      // Storage outage vs missing file: both return null today, but log
      // loud so triage can distinguish them. Without this, a Supabase
      // Storage outage looks identical to "no file uploaded."
      logError(new Error(error.message), {
        source: 'file-upload-service:getSignedUrlForBucket',
        severity: ErrorSeverity.MEDIUM,
        metadata: { bucket, path, operation: 'createSignedUrl' },
      })
      return null
    }

    return data.signedUrl
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      source: 'file-upload-service:getSignedUrlForBucket',
      severity: ErrorSeverity.MEDIUM,
      metadata: { bucket, path, operation: 'createSignedUrl', stage: 'catchall' },
    })
    return null
  }
}

/**
 * Delete a medical certificate from storage
 *
 * @param path - Storage path of the file to delete
 * @returns True if deletion succeeded, false otherwise
 *
 * @example
 * ```typescript
 * const deleted = await deleteMedicalCertificate('pilot-id/timestamp-cert.pdf')
 * if (deleted) {
 *   // File was successfully deleted
 * }
 * ```
 */
export async function deleteMedicalCertificate(path: string): Promise<boolean> {
  return deleteFileFromBucket(MEDICAL_CERTIFICATES_BUCKET, path)
}

/**
 * Delete a file from any storage bucket
 */
export async function deleteFileFromBucket(bucket: string, path: string): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient()

    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      logError(new Error(error.message), {
        source: 'file-upload-service:deleteFileFromBucket',
        severity: ErrorSeverity.MEDIUM,
        metadata: { bucket, path },
      })
      return false
    }

    return true
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      source: 'file-upload-service:deleteFileFromBucket',
      severity: ErrorSeverity.MEDIUM,
      metadata: { bucket, path, stage: 'catchall' },
    })
    return false
  }
}

/**
 * Check if a medical certificate exists
 *
 * @param path - Storage path of the file
 * @returns True if file exists, false otherwise
 */
export async function medicalCertificateExists(path: string): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient()

    // Extract folder path (pilot_id) from the full path
    const folderPath = path.substring(0, path.lastIndexOf('/'))
    const fileName = path.substring(path.lastIndexOf('/') + 1)

    const { data, error } = await supabase.storage
      .from(MEDICAL_CERTIFICATES_BUCKET)
      .list(folderPath, {
        limit: 1,
        search: fileName,
      })

    if (error) {
      logError(new Error(error.message), {
        source: 'file-upload-service:medicalCertificateExists',
        severity: ErrorSeverity.MEDIUM,
        metadata: { path, folderPath, fileName },
      })
      return false
    }

    return data.length > 0
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      source: 'file-upload-service:medicalCertificateExists',
      severity: ErrorSeverity.MEDIUM,
      metadata: { path, stage: 'catchall' },
    })
    return false
  }
}

/**
 * Extract storage path from a signed URL
 * Useful when we have the URL stored in database and need the path
 *
 * @param signedUrl - Signed URL from Supabase
 * @returns Storage path or null if extraction fails
 */
export function extractPathFromSignedUrl(signedUrl: string): string | null {
  try {
    const url = new URL(signedUrl)
    // Signed URLs have format: .../<bucket>/<path>?token=...
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/sign\/[^/]+\/(.+)/)
    if (pathMatch && pathMatch[1]) {
      return decodeURIComponent(pathMatch[1])
    }
    return null
  } catch (error) {
    // Don't crash if a malformed URL is passed in, but DO log so we can
    // see if we're consistently getting bad inputs.
    logWarning('extractPathFromSignedUrl: malformed URL', {
      source: 'file-upload-service:extractPathFromSignedUrl',
      metadata: {
        urlPreview: signedUrl.substring(0, 100),
        error: error instanceof Error ? error.message : String(error),
      },
    })
    return null
  }
}

/**
 * Validate MIME type by reading file magic bytes
 * More secure than trusting Content-Type header
 *
 * @param buffer - File buffer
 * @returns Detected MIME type or null if unknown
 */
export function detectMimeType(buffer: Buffer | Uint8Array): AllowedMimeType | null {
  // Convert to Uint8Array and get first 8 bytes for magic byte detection
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  const arr = bytes.length >= 8 ? bytes.subarray(0, 8) : bytes

  // PDF: %PDF (0x25 0x50 0x44 0x46)
  if (arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46) {
    return 'application/pdf'
  }

  // JPEG: FF D8 FF
  if (arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff) {
    return 'image/jpeg'
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    arr[0] === 0x89 &&
    arr[1] === 0x50 &&
    arr[2] === 0x4e &&
    arr[3] === 0x47 &&
    arr[4] === 0x0d &&
    arr[5] === 0x0a &&
    arr[6] === 0x1a &&
    arr[7] === 0x0a
  ) {
    return 'image/png'
  }

  // DOCX (OOXML): ZIP container, PK 03 04. Any OOXML/ZIP shares this header;
  // claimed-vs-detected matching in validateFileWithMagicBytes narrows it.
  if (arr[0] === 0x50 && arr[1] === 0x4b && arr[2] === 0x03 && arr[3] === 0x04) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }

  // Legacy DOC: OLE2 compound file, D0 CF 11 E0 A1 B1 1A E1
  if (
    arr[0] === 0xd0 &&
    arr[1] === 0xcf &&
    arr[2] === 0x11 &&
    arr[3] === 0xe0 &&
    arr[4] === 0xa1 &&
    arr[5] === 0xb1 &&
    arr[6] === 0x1a &&
    arr[7] === 0xe1
  ) {
    return 'application/msword'
  }

  return null
}

/**
 * Validate file with magic byte detection
 * More secure than relying on Content-Type header alone
 *
 * @param buffer - File buffer
 * @param claimedMimeType - MIME type claimed by client
 * @returns Validation result
 */
export function validateFileWithMagicBytes(
  buffer: Buffer | Uint8Array,
  claimedMimeType: string
): { isValid: boolean; detectedType: AllowedMimeType | null; error?: string } {
  const detectedType = detectMimeType(buffer)

  if (!detectedType) {
    return {
      isValid: false,
      detectedType: null,
      error:
        'Unable to detect file type. Please upload a valid PDF, Word (DOC/DOCX), JPG, or PNG file.',
    }
  }

  // Check if claimed type matches detected type
  // Allow some flexibility (e.g., image/jpg vs image/jpeg)
  const normalizedClaimed = claimedMimeType.toLowerCase().replace('image/jpg', 'image/jpeg')
  const normalizedDetected = detectedType.toLowerCase()

  if (normalizedClaimed !== normalizedDetected) {
    return {
      isValid: false,
      detectedType,
      error: `File content does not match declared type. Detected: ${detectedType}`,
    }
  }

  return {
    isValid: true,
    detectedType,
  }
}
