/**
 * BaseService Abstract Class
 * Author: Maurice Rondeau (Sprint 1.3 - Nov 2025)
 * Version: 1.0.0
 *
 * Base class for all service layer operations providing:
 * - Consistent error handling
 * - Logging integration
 * - ServiceResponse pattern enforcement
 * - Common utility methods
 *
 * Usage:
 * ```typescript
 * export class PilotService extends BaseService {
 *   protected serviceName = 'PilotService'
 *
 *   async getPilot(id: string): Promise<ServiceResponse<Pilot>> {
 *     return this.executeWithErrorHandling(async () => {
 *       const pilot = await this.supabase.from('pilots').select('*').eq('id', id).single()
 *       return ServiceResponse.success(pilot.data)
 *     })
 *   }
 * }
 * ```
 */

import { ServiceResponse } from '@/lib/types/service-response'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logError, logInfo, ErrorSeverity } from '@/lib/error-logger'

/**
 * Base Service Class
 * All service classes should extend this for consistent behavior
 */
export abstract class BaseService {
  /**
   * Service name for logging (override in child classes)
   */
  protected abstract serviceName: string

  /**
   * Supabase client instance
   */
  protected supabase: SupabaseClient | null = null

  /**
   * Initialize Supabase client (lazy loading)
   */
  protected async getSupabase(): Promise<SupabaseClient> {
    if (!this.supabase) {
      this.supabase = createAdminClient()
    }
    return this.supabase
  }

  /**
   * Execute operation with automatic error handling
   * Wraps operations in try-catch and returns ServiceResponse
   */
  protected async executeWithErrorHandling<T>(
    operation: () => Promise<ServiceResponse<T>>,
    context?: string
  ): Promise<ServiceResponse<T>> {
    try {
      return await operation()
    } catch (error) {
      return this.handleError<T>(error, context)
    }
  }

  /**
   * Handle errors and convert to ServiceResponse
   */
  protected handleError<T>(error: unknown, context?: string): ServiceResponse<T> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    // Log error for debugging
    this.logError(errorMessage, {
      context,
      error,
    })

    // Return error response
    return ServiceResponse.error(errorMessage, error)
  }

  /**
   * Handle validation errors
   */
  protected handleValidationError<T>(
    message: string,
    errors: Array<{ field: string; message: string }>
  ): ServiceResponse<T> {
    this.logWarning('Validation error', { message, errors })
    return ServiceResponse.validationError(message, errors)
  }

  /**
   * Handle not found errors
   */
  protected handleNotFound<T>(message: string, context?: string): ServiceResponse<T> {
    this.logWarning('Resource not found', { message, context })
    return ServiceResponse.notFound(message)
  }

  /**
   * Handle unauthorized access
   */
  protected handleUnauthorized<T>(message?: string, context?: string): ServiceResponse<T> {
    this.logWarning('Unauthorized access attempt', { message, context })
    return ServiceResponse.unauthorized(message)
  }

  /**
   * Handle forbidden access (authenticated but insufficient permissions)
   */
  protected handleForbidden<T>(message?: string, context?: string): ServiceResponse<T> {
    this.logWarning('Forbidden access attempt', { message, context })
    return ServiceResponse.forbidden(message)
  }

  /**
   * Handle duplicate/conflict errors
   */
  protected handleConflict<T>(message: string, context?: string): ServiceResponse<T> {
    this.logWarning('Conflict error', { message, context })
    return ServiceResponse.conflict(message)
  }

  /**
   * Validate required fields
   */
  protected validateRequired(
    data: Record<string, unknown>,
    requiredFields: string[]
  ): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = []

    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push({
          field,
          message: `${field} is required`,
        })
      }
    }

    return errors
  }

  /**
   * Check if user is authenticated
   */
  protected async requireAuthentication<T>(): Promise<ServiceResponse<T> | null> {
    const supabase = await this.getSupabase()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return this.handleUnauthorized('Authentication required')
    }

    return null // No error
  }

  /**
   * Check if user has specific role
   */
  protected async requireRole<T>(
    requiredRole: 'admin' | 'manager',
    userId: string
  ): Promise<ServiceResponse<T> | null> {
    const supabase = await this.getSupabase()

    const { data: adminUser } = await supabase
      .from('an_users')
      .select('role')
      .eq('id', userId)
      .single()

    if (requiredRole === 'admin' && adminUser?.role !== 'admin') {
      return this.handleForbidden('Admin access required')
    }

    if (
      requiredRole === 'manager' &&
      adminUser?.role !== 'admin' &&
      adminUser?.role !== 'manager'
    ) {
      return this.handleForbidden('Manager access required')
    }

    return null // No error
  }

  /**
   * Log informational message
   */
  protected logInfo(message: string, metadata?: Record<string, unknown>): void {
    logInfo(message, {
      source: this.serviceName,
      metadata,
    })
  }

  /**
   * Log warning message
   */
  protected logWarning(message: string, metadata?: Record<string, unknown>): void {
    logError(new Error(message), {
      source: this.serviceName,
      severity: ErrorSeverity.LOW,
      metadata,
    })
  }

  /**
   * Log error message
   */
  protected logError(message: string, metadata?: Record<string, unknown>): void {
    logError(new Error(message), {
      source: this.serviceName,
      severity: ErrorSeverity.HIGH,
      metadata,
    })
  }

  /**
   * Log critical error message
   */
  protected logCritical(message: string, metadata?: Record<string, unknown>): void {
    logError(new Error(message), {
      source: this.serviceName,
      severity: ErrorSeverity.CRITICAL,
      metadata,
    })
  }

  /**
   * Create pagination metadata
   */
  protected createPaginationMetadata(
    total: number,
    page: number,
    pageSize: number
  ): Record<string, unknown> {
    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: page * pageSize < total,
      hasPreviousPage: page > 1,
    }
  }

  /**
   * Safe JSON parse with error handling
   */
  protected safeJsonParse<T>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json) as T
    } catch (error) {
      this.logWarning('Failed to parse JSON', { json, error })
      return defaultValue
    }
  }
}

/**
 * Example service extending BaseService
 *
 * @example
 * ```typescript
 * export class PilotService extends BaseService {
 *   protected serviceName = 'PilotService'
 *
 *   async getPilot(id: string): Promise<ServiceResponse<Pilot>> {
 *     // Check authentication
 *     const authError = await this.requireAuthentication<Pilot>()
 *     if (authError) return authError
 *
 *     // Execute operation with error handling
 *     return this.executeWithErrorHandling(async () => {
 *       const supabase = await this.getSupabase()
 *       const { data, error } = await supabase
 *         .from('pilots')
 *         .select('*')
 *         .eq('id', id)
 *         .single()
 *
 *       if (error) throw error
 *       if (!data) return this.handleNotFound('Pilot not found')
 *
 *       this.logInfo('Pilot retrieved successfully', { pilotId: id })
 *       return ServiceResponse.success(data)
 *     }, 'getPilot')
 *   }
 * }
 * ```
 */
