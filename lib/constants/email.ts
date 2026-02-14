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

export const DEFAULT_FROM_EMAIL = 'Fleet Management <noreply@fleetmanagement.com>'
export const DEFAULT_SUPPORT_EMAIL = 'support@fleetmanagement.com'
export const DEFAULT_FLEET_MANAGER_EMAIL = 'fleet.manager@fleetmanagement.com'
