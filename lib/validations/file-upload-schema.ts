/**
 * File Upload Validation Schema
 *
 * Developer: Maurice Rondeau
 * Date: February 2, 2026
 *
 * Zod validation for file uploads including medical certificates.
 * Enforces file size limits and allowed MIME types.
 */

import { z } from 'zod'

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Maximum file size for display (human readable)
 */
export const MAX_FILE_SIZE_DISPLAY = '10MB'

/**
 * Allowed MIME types for medical certificates
 */
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const

/**
 * Allowed file extensions for display
 */
export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'] as const

/**
 * Accept string for file input elements
 */
export const ACCEPT_STRING = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates file size
 * @param size - File size in bytes
 * @returns True if file size is within limits
 */
export function isValidFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE
}

/**
 * Validates MIME type
 * @param mimeType - File MIME type
 * @returns True if MIME type is allowed
 */
export function isValidMimeType(mimeType: string): mimeType is AllowedMimeType {
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)
}

/**
 * Validates file extension
 * @param filename - File name
 * @returns True if extension is allowed
 */
export function isValidExtension(filename: string): boolean {
  const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'))
  return ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number])
}

/**
 * Get human-readable file size
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * Schema for validating file metadata (used in API routes)
 */
export const FileMetadataSchema = z.object({
  filename: z
    .string()
    .min(1, 'Filename is required')
    .refine(isValidExtension, {
      message: `File extension must be one of: ${ALLOWED_EXTENSIONS.join(', ')}`,
    }),
  mimeType: z.string().refine(isValidMimeType, {
    message: `File type must be one of: PDF, JPG, or PNG`,
  }),
  size: z
    .number()
    .positive('File size must be positive')
    .max(MAX_FILE_SIZE, `File size must not exceed ${MAX_FILE_SIZE_DISPLAY}`),
})

export type FileMetadata = z.infer<typeof FileMetadataSchema>

/**
 * Schema for file upload response
 */
export const FileUploadResponseSchema = z.object({
  success: z.boolean(),
  url: z.string().url().optional(),
  path: z.string().optional(),
  error: z.string().optional(),
})

export type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>

/**
 * Schema for validating upload request body
 */
export const UploadRequestSchema = z.object({
  pilotId: z.string().uuid('Invalid pilot ID'),
})

export type UploadRequest = z.infer<typeof UploadRequestSchema>

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates a File object on the client side
 * @param file - File object from input element
 * @returns Validation result with error messages
 */
export function validateFile(file: File): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(
      `File size (${formatFileSize(file.size)}) exceeds maximum of ${MAX_FILE_SIZE_DISPLAY}`
    )
  }

  if (file.size === 0) {
    errors.push('File is empty')
  }

  // Check MIME type
  if (!isValidMimeType(file.type)) {
    errors.push(
      `File type "${file.type || 'unknown'}" is not allowed. Please upload a PDF, JPG, or PNG file.`
    )
  }

  // Check extension as backup
  if (!isValidExtension(file.name)) {
    errors.push(
      `File extension is not allowed. Please upload a ${ALLOWED_EXTENSIONS.join(', ')} file.`
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Sanitizes filename for storage
 * Removes special characters and ensures safe filenames
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Get the extension
  const lastDot = filename.lastIndexOf('.')
  const extension = lastDot !== -1 ? filename.slice(lastDot).toLowerCase() : ''
  const baseName = lastDot !== -1 ? filename.slice(0, lastDot) : filename

  // Remove special characters, keep alphanumeric, hyphens, underscores
  const sanitized = baseName
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 50) // Limit length

  return `${sanitized || 'file'}${extension}`
}

/**
 * Generates a unique storage path for a file
 * @param pilotId - Pilot's UUID
 * @param filename - Original filename
 * @returns Storage path: {pilotId}/{timestamp}-{sanitizedFilename}
 */
export function generateStoragePath(pilotId: string, filename: string): string {
  const timestamp = Date.now()
  const sanitized = sanitizeFilename(filename)
  return `${pilotId}/${timestamp}-${sanitized}`
}
