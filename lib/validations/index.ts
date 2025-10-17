/**
 * Validation Schemas Index
 * Central export point for all Zod validation schemas
 *
 * @version 1.0.0
 * @since 2025-10-17
 */

// Pilot validations
export * from './pilot-validation'

// Certification validations
export * from './certification-validation'

// Leave request validations
export * from './leave-validation'

// Dashboard validations
export * from './dashboard-validation'

// Analytics validations
export * from './analytics-validation'

/**
 * Usage Examples:
 *
 * 1. Pilot Creation:
 * ```typescript
 * import { PilotCreateSchema } from '@/lib/validations'
 *
 * const result = PilotCreateSchema.safeParse(formData)
 * if (!result.success) {
 *   console.error(result.error.flatten())
 * }
 * ```
 *
 * 2. Certification Creation:
 * ```typescript
 * import { CertificationCreateSchema } from '@/lib/validations'
 *
 * try {
 *   const validated = CertificationCreateSchema.parse(data)
 *   await createCertification(validated)
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     // Handle validation errors
 *   }
 * }
 * ```
 *
 * 3. Service Layer Integration:
 * ```typescript
 * import { PilotCreateSchema, type PilotCreate } from '@/lib/validations'
 *
 * export async function createPilot(data: unknown) {
 *   // Validate first
 *   const validated = PilotCreateSchema.parse(data)
 *
 *   // Now safely use validated data
 *   const supabase = await createClient()
 *   const { data: pilot, error } = await supabase
 *     .from('pilots')
 *     .insert(validated)
 *     .select()
 *     .single()
 *
 *   if (error) throw new Error(`Failed to create pilot: ${error.message}`)
 *   return pilot
 * }
 * ```
 */
