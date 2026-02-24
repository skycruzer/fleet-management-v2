// Maurice Rondeau — Published Roster Validation Schema

import { z } from 'zod'

export const MAX_ROSTER_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_ROSTER_MIME_TYPE = 'application/pdf'

export const PublishedRosterUploadSchema = z.object({
  rosterPeriodCode: z
    .string()
    .regex(/^RP\d{2}\/\d{4}$/, 'Invalid roster period code format (e.g., RP02/2026)'),
})

export function validateRosterFile(file: File): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (file.size > MAX_ROSTER_FILE_SIZE) {
    errors.push(`File size exceeds ${MAX_ROSTER_FILE_SIZE / (1024 * 1024)}MB limit`)
  }

  if (file.type !== ALLOWED_ROSTER_MIME_TYPE) {
    errors.push('Only PDF files are accepted')
  }

  const ext = file.name.toLowerCase().split('.').pop()
  if (ext !== 'pdf') {
    errors.push('File must have a .pdf extension')
  }

  return { isValid: errors.length === 0, errors }
}

export function sanitizeRosterFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 100)
}
