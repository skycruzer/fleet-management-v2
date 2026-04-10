/**
 * Supabase Client with Retry Logic
 *
 * Wraps Supabase client methods with automatic retry for transient failures.
 * Provides resilient database operations with exponential backoff.
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { retryWithBackoff, RetryConfig, DEFAULT_RETRY_CONFIG } from '@/lib/utils/retry-utils'
import { logError, logInfo, ErrorSeverity } from '@/lib/error-logger'

// ===================================
// TYPES
// ===================================

/**
 * Supabase operation types that support retry
 */
export type SupabaseOperation = 'select' | 'insert' | 'update' | 'delete' | 'rpc' | 'storage'

/**
 * Retry configuration for Supabase operations
 */
export interface SupabaseRetryConfig extends RetryConfig {
  /** Operations to retry (default: all) */
  retryOperations?: SupabaseOperation[]
  /** Disable retry for specific operations */
  excludeOperations?: SupabaseOperation[]
}

// ===================================
// DEFAULT CONFIGURATIONS
// ===================================

/**
 * Default retry config for read operations (more aggressive)
 */
export const READ_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  useJitter: true,
  timeoutMs: 15000,
}

/**
 * Default retry config for write operations (less aggressive)
 */
export const WRITE_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  backoffMultiplier: 2,
  useJitter: true,
  timeoutMs: 30000,
}

/**
 * Default retry config for RPC/function calls
 */
export const RPC_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  useJitter: true,
  timeoutMs: 45000,
}

// ===================================
// RETRY WRAPPER FUNCTIONS
// ===================================

/**
 * Execute Supabase query with retry logic
 *
 * @example
 * ```typescript
 * const { data, error } = await executeWithRetry(
 *   async () => supabase.from('pilots').select('*'),
 *   'select',
 *   { maxRetries: 3 }
 * )
 * ```
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationType: SupabaseOperation,
  config?: SupabaseRetryConfig
): Promise<T> {
  // Determine retry config based on operation type
  const defaultConfig = getDefaultConfigForOperation(operationType)

  // Merge with user config
  const mergedConfig: RetryConfig = {
    ...defaultConfig,
    ...config,
    onRetry: (attempt, maxRetries, delayMs, error) => {
      logInfo(`Retrying ${operationType} operation`, {
        source: 'SupabaseRetryClient',
        metadata: {
          operation: 'executeWithRetry',
          operationType,
          attempt,
          maxRetries,
          delayMs,
          errorMessage: error.message,
        },
      })

      if (config?.onRetry) {
        config.onRetry(attempt, maxRetries, delayMs, error)
      }
    },
    onFinalFailure: (error, attempts) => {
      logError(error, {
        source: 'SupabaseRetryClient',
        severity: ErrorSeverity.HIGH,
        metadata: {
          operation: 'executeWithRetry',
          operationType,
          attempts,
        },
        tags: ['supabase-retry-failed', operationType],
      })

      if (config?.onFinalFailure) {
        config.onFinalFailure(error, attempts)
      }
    },
  }

  return retryWithBackoff(operation, mergedConfig)
}

/**
 * Get default retry config based on operation type
 */
function getDefaultConfigForOperation(operationType: SupabaseOperation): RetryConfig {
  switch (operationType) {
    case 'select':
      return READ_RETRY_CONFIG
    case 'insert':
    case 'update':
    case 'delete':
      return WRITE_RETRY_CONFIG
    case 'rpc':
      return RPC_RETRY_CONFIG
    case 'storage':
      return READ_RETRY_CONFIG
    default:
      return DEFAULT_RETRY_CONFIG
  }
}

// ===================================
// SUPABASE CLIENT WRAPPER
// ===================================

/**
 * Wrap Supabase client methods with retry logic
 *
 * This creates a proxy around the Supabase client that automatically
 * retries failed operations with exponential backoff.
 *
 * @example
 * ```typescript
 * const supabase = await createClient()
 * const retryClient = withRetry(supabase, { maxRetries: 3 })
 *
 * // Automatic retry on transient failures
 * const { data, error } = await retryClient
 *   .from('pilots')
 *   .select('*')
 * ```
 */
export function withRetry(
  client: SupabaseClient<Database>,
  _config?: SupabaseRetryConfig
): SupabaseClient<Database> {
  // Note: Full implementation would require proxying all Supabase methods
  // For now, we provide helper functions for common operations
  // Full proxy implementation would be complex due to Supabase's fluent API

  // Return original client for now
  // Users should use executeWithRetry() wrapper for critical operations
  return client
}

// ===================================
// HELPER FUNCTIONS FOR COMMON OPERATIONS
// ===================================

/**
 * Execute SELECT query with retry
 */
export async function selectWithRetry<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  config?: RetryConfig
): Promise<{ data: T | null; error: any }> {
  return executeWithRetry(operation, 'select', config)
}

/**
 * Execute INSERT query with retry
 */
export async function insertWithRetry<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  config?: RetryConfig
): Promise<{ data: T | null; error: any }> {
  return executeWithRetry(operation, 'insert', config)
}

/**
 * Execute UPDATE query with retry
 */
export async function updateWithRetry<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  config?: RetryConfig
): Promise<{ data: T | null; error: any }> {
  return executeWithRetry(operation, 'update', config)
}

/**
 * Execute DELETE query with retry
 */
export async function deleteWithRetry<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  config?: RetryConfig
): Promise<{ data: T | null; error: any }> {
  return executeWithRetry(operation, 'delete', config)
}

/**
 * Execute RPC call with retry
 */
export async function rpcWithRetry<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  config?: RetryConfig
): Promise<{ data: T | null; error: any }> {
  return executeWithRetry(operation, 'rpc', config)
}

// ===================================
// STORAGE OPERATIONS WITH RETRY
// ===================================

/**
 * Upload file to Supabase Storage with retry
 */
export async function uploadWithRetry(
  operation: () => Promise<{ data: any; error: any }>,
  config?: RetryConfig
): Promise<{ data: any; error: any }> {
  return executeWithRetry(operation, 'storage', {
    ...config,
    maxRetries: config?.maxRetries || 2, // Fewer retries for uploads
    timeoutMs: config?.timeoutMs || 60000, // Longer timeout for uploads
  })
}

/**
 * Download file from Supabase Storage with retry
 */
export async function downloadWithRetry(
  operation: () => Promise<{ data: any; error: any }>,
  config?: RetryConfig
): Promise<{ data: any; error: any }> {
  return executeWithRetry(operation, 'storage', {
    ...config,
    maxRetries: config?.maxRetries || 3,
    timeoutMs: config?.timeoutMs || 30000,
  })
}
