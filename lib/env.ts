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

  NEXT_PUBLIC_APP_NAME: z
    .string()
    .optional()
    .default('Fleet Management V2'),

  NEXT_PUBLIC_APP_VERSION: z
    .string()
    .optional()
    .default('0.1.0'),

  // Optional: Service Role Key (server-only)
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, 'SUPABASE_SERVICE_ROLE_KEY appears to be invalid (too short)')
    .optional(),
})

/**
 * Validates environment variables against the schema.
 *
 * @throws {z.ZodError} If validation fails, with detailed error messages
 * @returns Validated and type-safe environment variables
 */
function validateEnv() {
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

      // Exit process in production, throw in development for better DX
      if (process.env.NODE_ENV === 'production') {
        process.exit(1)
      }

      throw new Error('Environment validation failed. See console for details.')
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
