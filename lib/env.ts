import { z } from 'zod'

/**
 * Environment Variable Validation Schema
 *
 * Validates all required environment variables at application startup.
 * Provides clear error messages when environment variables are missing or invalid.
 *
 * @see https://github.com/colinhacks/zod
 */

const envSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_URL is required')
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
    .startsWith('https://', 'NEXT_PUBLIC_SUPABASE_URL must use HTTPS'),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
    .min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)'),

  // App Configuration (optional with defaults)
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL')
    .optional()
    .default('http://localhost:3000'),

  NEXT_PUBLIC_APP_NAME: z.string().optional().default('Fleet Management V2'),

  NEXT_PUBLIC_APP_VERSION: z.string().optional().default('0.1.0'),

  // Optional: Service Role Key (server-only)
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, 'SUPABASE_SERVICE_ROLE_KEY appears to be invalid (too short)')
    .optional(),
})

/**
 * Validates environment variables against the schema.
 * Skips validation during build phase and on client side.
 * Validates strictly at runtime to ensure proper configuration.
 *
 * @throws {z.ZodError} If validation fails at runtime, with detailed error messages
 * @returns Validated and type-safe environment variables
 */
function validateEnv() {
  // Skip validation on client side - client only has access to NEXT_PUBLIC_* vars
  if (typeof window !== 'undefined') {
    return process.env as unknown as z.infer<typeof envSchema>
  }

  // Skip validation during build phase - env vars may not be available yet
  // They will be available at runtime in production
  if (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-export'
  ) {
    return process.env as unknown as z.infer<typeof envSchema>
  }

  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((err: z.ZodIssue) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n')

      console.error(
        '\n❌ Environment Variable Validation Failed\n\n' +
          'The following environment variables are missing or invalid:\n\n' +
          errorMessages +
          '\n\n' +
          'Please check your .env.local file and ensure all required variables are set.\n' +
          'See .env.example for reference.\n'
      )

      // Throw error in all environments for proper error handling
      // This allows container orchestrators to implement backoff strategies
      // and error monitoring tools to capture the failure before termination
      throw new Error(
        'Environment validation failed. Missing or invalid environment variables. ' +
          'Check console output for details.'
      )
    }
    throw error
  }
}

/**
 * Validated environment variables with type safety.
 *
 * Usage:
 * ```typescript
 * import { env } from '@/lib/env'
 *
 * const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
 * const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 * ```
 */
export const env = validateEnv()

/**
 * Type-safe environment variable object.
 * Inferred from the Zod schema.
 */
export type Env = z.infer<typeof envSchema>
