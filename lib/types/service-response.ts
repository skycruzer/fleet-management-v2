/**
 * ServiceResponse Type Definition
 * Author: Maurice Rondeau (Sprint 1.3 - Nov 2025)
 * Version: 1.0.0
 *
 * Standardized response type for all service layer operations.
 * Provides consistent error handling, success/failure states, and optional metadata.
 *
 * Usage:
 * ```typescript
 * async function getUser(id: string): Promise<ServiceResponse<User>> {
 *   try {
 *     const user = await database.getUser(id)
 *     return ServiceResponse.success(user)
 *   } catch (error) {
 *     return ServiceResponse.error('Failed to get user', error)
 *   }
 * }
 * ```
 */

/**
 * Service Response Interface
 * Generic type T represents the data returned on success
 */
export interface ServiceResponse<T = void> {
  /** Indicates if the operation was successful */
  success: boolean

  /** The data returned by the service (only present on success) */
  data?: T

  /** Error message (only present on failure) */
  error?: string

  /** Detailed error code for programmatic handling */
  errorCode?: string

  /** Additional metadata (timestamps, counts, etc.) */
  metadata?: Record<string, unknown>

  /** Validation errors (for form validation) */
  validationErrors?: Array<{
    field: string
    message: string
  }>
}

/**
 * Service Response Builder
 * Provides helper methods to construct ServiceResponse objects
 */
export class ServiceResponse {
  /**
   * Create a successful response with data
   */
  static success<T>(data: T, metadata?: Record<string, unknown>): ServiceResponse<T> {
    return {
      success: true,
      data,
      metadata,
    }
  }

  /**
   * Create a successful response without data (for mutations like delete)
   */
  static successWithoutData(metadata?: Record<string, unknown>): ServiceResponse<void> {
    return {
      success: true,
      metadata,
    }
  }

  /**
   * Create an error response
   */
  static error<T = void>(
    error: string,
    errorDetails?: Error | unknown,
    errorCode?: string
  ): ServiceResponse<T> {
    // Log error for debugging
    if (errorDetails) {
      console.error('ServiceResponse Error:', {
        message: error,
        errorCode,
        details: errorDetails instanceof Error ? errorDetails.message : errorDetails,
      })
    }

    return {
      success: false,
      error,
      errorCode,
    }
  }

  /**
   * Create a validation error response
   */
  static validationError<T = void>(
    message: string,
    errors: Array<{ field: string; message: string }>
  ): ServiceResponse<T> {
    return {
      success: false,
      error: message,
      errorCode: 'VALIDATION_ERROR',
      validationErrors: errors,
    }
  }

  /**
   * Create an unauthorized error response
   */
  static unauthorized<T = void>(message = 'Unauthorized'): ServiceResponse<T> {
    return {
      success: false,
      error: message,
      errorCode: 'UNAUTHORIZED',
    }
  }

  /**
   * Create a not found error response
   */
  static notFound<T = void>(message = 'Resource not found'): ServiceResponse<T> {
    return {
      success: false,
      error: message,
      errorCode: 'NOT_FOUND',
    }
  }

  /**
   * Create a forbidden error response
   */
  static forbidden<T = void>(message = 'Forbidden'): ServiceResponse<T> {
    return {
      success: false,
      error: message,
      errorCode: 'FORBIDDEN',
    }
  }

  /**
   * Create a conflict error response (e.g., duplicate record)
   */
  static conflict<T = void>(message: string): ServiceResponse<T> {
    return {
      success: false,
      error: message,
      errorCode: 'CONFLICT',
    }
  }

  /**
   * Create a rate limit error response
   */
  static rateLimitExceeded<T = void>(message = 'Too many requests'): ServiceResponse<T> {
    return {
      success: false,
      error: message,
      errorCode: 'RATE_LIMIT_EXCEEDED',
    }
  }
}

/**
 * Type guard to check if response is successful
 */
export function isSuccess<T>(
  response: ServiceResponse<T>
): response is ServiceResponse<T> & { data: T } {
  return response.success === true
}

/**
 * Type guard to check if response is an error
 */
export function isError<T>(
  response: ServiceResponse<T>
): response is ServiceResponse<T> & { error: string } {
  return response.success === false
}

/**
 * Extract data from successful response or throw error
 * Useful for operations that expect success
 */
export function unwrap<T>(response: ServiceResponse<T>): T {
  if (isSuccess(response)) {
    return response.data
  }
  throw new Error(response.error || 'Operation failed')
}

/**
 * Extract data from successful response or return default value
 */
export function unwrapOr<T>(response: ServiceResponse<T>, defaultValue: T): T {
  return isSuccess(response) ? response.data : defaultValue
}

/**
 * Map the data of a successful response
 */
export function map<T, U>(
  response: ServiceResponse<T>,
  mapper: (data: T) => U
): ServiceResponse<U> {
  if (isSuccess(response)) {
    return ServiceResponse.success(mapper(response.data))
  }
  return response as unknown as ServiceResponse<U>
}
