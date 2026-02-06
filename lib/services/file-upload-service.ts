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

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Storage bucket name for medical certificates
 */
export const MEDICAL_CERTIFICATES_BUCKET = 'medical-certificates'

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
        error: 'Invalid file type. Please upload a PDF, JPG, or PNG file.',
      }
    }

    // Generate storage path
    const storagePath = generateStoragePath(pilotId, filename)

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createServiceRoleClient()

    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(MEDICAL_CERTIFICATES_BUCKET)
      .upload(storagePath, file, {
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
    const signedUrl = await getMedicalCertificateSignedUrl(data.path)

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
    console.error('Upload medical certificate error:', error)
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
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase.storage
      .from(MEDICAL_CERTIFICATES_BUCKET)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Signed URL generation error:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Get signed URL error:', error)
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
  try {
    const supabase = createServiceRoleClient()

    const { error } = await supabase.storage.from(MEDICAL_CERTIFICATES_BUCKET).remove([path])

    if (error) {
      console.error('Storage delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete medical certificate error:', error)
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
      console.error('Storage list error:', error)
      return false
    }

    return data.length > 0
  } catch (error) {
    console.error('Check file exists error:', error)
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
  } catch {
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
      error: 'Unable to detect file type. Please upload a valid PDF, JPG, or PNG file.',
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
