/**
 * Supabase Client Exports
 * Barrel file to expose Supabase clients for different environments
 *
 * This fixes Turbopack path alias resolution issues in Vercel builds
 */

export { createClient as createBrowserClient } from './client'
export { createClient as createServerClient } from './server'

// Re-export types
export type { Database } from '@/types/supabase'
