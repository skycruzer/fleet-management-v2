/**
 * Error Logger Service
 *
 * Centralized error logging and monitoring service.
 * Provides consistent error handling across the application.
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error context information
 */
export interface ErrorContext {
  /** Component or function where the error occurred */
  source?: string
  /** User ID if available */
  userId?: string
  /** Additional context data */
  metadata?: Record<string, unknown>
  /** Component stack trace (React error boundary) */
  componentStack?: string
  /** Whether error was caught by error boundary */
  errorBoundary?: boolean
  /** Timestamp of error */
  timestamp?: string
  /** Browser user agent */
  userAgent?: string
  /** Current URL */
  url?: string
  /** Error severity */
  severity?: ErrorSeverity
  /** Custom tags for categorization */
  tags?: string[]
}

/**
 * Structured error log entry
 */
interface ErrorLogEntry {
  message: string
  stack?: string
  context?: ErrorContext
  timestamp: string
  environment: string
}

/**
 * Log an error with context information
 *
 * @example
 * ```typescript
 * try {
 *   await fetchData()
 * } catch (error) {
 *   logError(error as Error, {
 *     source: 'DataFetchService',
 *     severity: ErrorSeverity.HIGH,
 *     metadata: { endpoint: '/api/pilots' }
 *   })
 * }
 * ```
 */
export function logError(error: Error, context?: ErrorContext): void {
  const errorEntry: ErrorLogEntry = {
    message: error.message,
    stack: error.stack,
    context: {
      ...context,
      timestamp: context?.timestamp || new Date().toISOString(),
      userAgent: context?.userAgent || getUserAgent(),
      url: context?.url || getCurrentUrl(),
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  }

  // Development: Log to console with rich formatting
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔴 Error: ${error.message}`)
    console.error('Error Object:', error)
    if (context?.source) {
      console.log('Source:', context.source)
    }
    if (context?.severity) {
      console.log('Severity:', context.severity)
    }
    if (context?.metadata) {
      console.log('Metadata:', context.metadata)
    }
    if (context?.tags) {
      console.log('Tags:', context.tags)
    }
    if (error.stack) {
      console.log('Stack Trace:', error.stack)
    }
    if (context?.componentStack) {
      console.log('Component Stack:', context.componentStack)
    }
    console.groupEnd()
  }

  // Production: Send to error monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with error monitoring service (e.g., Sentry, LogRocket)
    // Example:
    // Sentry.captureException(error, {
    //   level: mapSeverityToSentryLevel(context?.severity),
    //   tags: context?.tags,
    //   contexts: {
    //     custom: context?.metadata,
    //   },
    // })

    // Fallback: Store in local storage for debugging (temporary)
    storeErrorInLocalStorage(errorEntry)
  }

  // Optional: Send to custom logging endpoint
  if (process.env.NEXT_PUBLIC_ERROR_LOGGING_ENDPOINT) {
    sendToLoggingEndpoint(errorEntry).catch((err) => {
      // Fail silently to avoid infinite error loops
      console.warn('Failed to send error to logging endpoint:', err)
    })
  }
}

/**
 * Log a warning (non-critical error)
 */
export function logWarning(message: string, context?: ErrorContext): void {
  const warningError = new Error(message)
  logError(warningError, {
    ...context,
    severity: ErrorSeverity.LOW,
    tags: [...(context?.tags || []), 'warning'],
  })
}

/**
 * Log an info message with context
 */
export function logInfo(message: string, context?: Omit<ErrorContext, 'severity'>): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`ℹ️ Info: ${message}`, context)
  }
}

/**
 * Create a wrapped function that automatically logs errors
 *
 * @example
 * ```typescript
 * const safeFetchData = withErrorLogging(
 *   async () => fetchData(),
 *   { source: 'DataService', severity: ErrorSeverity.HIGH }
 * )
 * ```
 */
export function withErrorLogging<T extends (...args: any[]) => any>(
  fn: T,
  context?: ErrorContext
): (...args: Parameters<T>) => ReturnType<T> {
  return function wrappedFunction(...args: Parameters<T>): ReturnType<T> {
    try {
      const result = fn(...args)

      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          logError(error as Error, {
            ...context,
            source: context?.source || fn.name,
          })
          throw error
        }) as ReturnType<T>
      }

      return result
    } catch (error) {
      logError(error as Error, {
        ...context,
        source: context?.source || fn.name,
      })
      throw error
    }
  }
}

/**
 * Get browser user agent
 */
function getUserAgent(): string | undefined {
  if (typeof window !== 'undefined') {
    return window.navigator.userAgent
  }
  return undefined
}

/**
 * Get current URL
 */
function getCurrentUrl(): string | undefined {
  if (typeof window !== 'undefined') {
    return window.location.href
  }
  return undefined
}

/**
 * Store error in local storage (fallback for production debugging)
 */
function storeErrorInLocalStorage(errorEntry: ErrorLogEntry): void {
  try {
    if (typeof window === 'undefined') return

    const storageKey = 'fleet-management-errors'
    const existingErrors = localStorage.getItem(storageKey)
    const errors = existingErrors ? JSON.parse(existingErrors) : []

    // Keep only last 50 errors
    const updatedErrors = [...errors, errorEntry].slice(-50)

    localStorage.setItem(storageKey, JSON.stringify(updatedErrors))
  } catch (err) {
    // Fail silently
    console.warn('Failed to store error in localStorage:', err)
  }
}

/**
 * Send error to custom logging endpoint
 */
async function sendToLoggingEndpoint(errorEntry: ErrorLogEntry): Promise<void> {
  const endpoint = process.env.NEXT_PUBLIC_ERROR_LOGGING_ENDPOINT
  if (!endpoint) return

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorEntry),
    })
  } catch (error) {
    // Fail silently to avoid infinite loops
    throw error
  }
}

/**
 * Get stored errors from local storage (for debugging)
 */
export function getStoredErrors(): ErrorLogEntry[] {
  try {
    if (typeof window === 'undefined') return []

    const storageKey = 'fleet-management-errors'
    const existingErrors = localStorage.getItem(storageKey)
    return existingErrors ? JSON.parse(existingErrors) : []
  } catch (err) {
    console.warn('Failed to retrieve stored errors:', err)
    return []
  }
}

/**
 * Clear stored errors from local storage
 */
export function clearStoredErrors(): void {
  try {
    if (typeof window === 'undefined') return

    const storageKey = 'fleet-management-errors'
    localStorage.removeItem(storageKey)
  } catch (err) {
    console.warn('Failed to clear stored errors:', err)
  }
}

/**
 * Format error for display
 */
export function formatError(error: Error): string {
  return `${error.name}: ${error.message}`
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: Error): boolean {
  return (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('Failed to fetch') ||
    error.name === 'NetworkError'
  )
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: Error): boolean {
  return (
    error.message.includes('401') ||
    error.message.includes('403') ||
    error.message.includes('Unauthorized') ||
    error.message.includes('Authentication')
  )
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: Error): boolean {
  return (
    error.message.includes('validation') ||
    error.message.includes('invalid') ||
    error.name === 'ValidationError'
  )
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: Error): string {
  if (isNetworkError(error)) {
    return 'Network connection error. Please check your internet connection and try again.'
  }

  if (isAuthError(error)) {
    return 'Authentication error. Please log in again.'
  }

  if (isValidationError(error)) {
    return 'Validation error. Please check your input and try again.'
  }

  // Default message for production
  if (process.env.NODE_ENV === 'production') {
    return 'An unexpected error occurred. Please try again or contact support.'
  }

  // Development: Show actual error
  return error.message
}
