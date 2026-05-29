/**
 * Email Constants
 * Author: Maurice Rondeau
 *
 * Single source of truth for fallback email addresses used across the application.
 * Services should prefer environment variables, falling back to these defaults.
 *
 * Usage:
 * ```typescript
 * import { DEFAULT_FROM_EMAIL } from '@/lib/constants/email'
 * const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL
 * ```
 */

// Fallback sender. Must use a Resend-verified domain so sends don't 403 when
// RESEND_FROM_EMAIL is unset. pxb767office.app is the project's verified domain
// (see .env.example); keep this in sync with whatever domain is verified in Resend.
export const DEFAULT_FROM_EMAIL = 'Fleet Management <noreply@pxb767office.app>'
export const DEFAULT_SUPPORT_EMAIL = 'mrondeau@airniugini.com.pg'
export const DEFAULT_FLEET_MANAGER_EMAIL = 'fleet.manager@fleetmanagement.com'
