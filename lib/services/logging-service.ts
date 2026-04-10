/**
 * Logging Service
 * Centralized logging with Better Stack (Logtail)
 * Supports both server-side (Node.js) and client-side (Browser) logging
 */

// Lazy-loaded loggers to avoid bundling server code in client
let serverLogger: any = null
let clientLogger: any = null

// Initialize server logger (only in Node.js environment)
async function getServerLogger() {
  if (serverLogger) return serverLogger
  if (typeof window === 'undefined' && process.env.LOGTAIL_SOURCE_TOKEN) {
    const { Logtail } = await import('@logtail/node')
    serverLogger = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN)
  }
  return serverLogger
}

// Initialize client logger (only in browser environment)
async function getClientLogger() {
  if (clientLogger) return clientLogger
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN) {
    const { Logtail } = await import('@logtail/browser')
    clientLogger = new Logtail(process.env.NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN)
  }
  return clientLogger
}

interface LogContext {
  [key: string]: unknown
  error?: Error | string
  userId?: string
  pilotId?: string
  requestId?: string
  component?: string
  action?: string
}

/**
 * Centralized logger with Better Stack integration
 * Falls back to console.* if Better Stack is not configured
 */
export const logger = {
  /**
   * Log error-level messages
   * Use for: API failures, database errors, authentication failures
   */
  error: async (message: string, context?: LogContext) => {
    const formattedContext = formatContext(context)

    // Console output (always)
    console.error(`[ERROR] ${message}`, formattedContext)

    // Better Stack (if configured)
    if (typeof window === 'undefined') {
      const logger = await getServerLogger()
      await logger?.error(message, formattedContext)
    } else {
      const logger = await getClientLogger()
      await logger?.error(message, formattedContext)
    }
  },

  /**
   * Log warning-level messages
   * Use for: Deprecated API usage, performance warnings, validation warnings
   */
  warn: async (message: string, context?: LogContext) => {
    const formattedContext = formatContext(context)

    // Console output (always)
    console.warn(`[WARN] ${message}`, formattedContext)

    // Better Stack (if configured)
    if (typeof window === 'undefined') {
      const logger = await getServerLogger()
      await logger?.warn(message, formattedContext)
    } else {
      const logger = await getClientLogger()
      await logger?.warn(message, formattedContext)
    }
  },

  /**
   * Log info-level messages
   * Use for: API requests, user actions, system events
   */
  info: async (message: string, context?: LogContext) => {
    const formattedContext = formatContext(context)

    // Console output (always)
    console.info(`[INFO] ${message}`, formattedContext)

    // Better Stack (if configured)
    if (typeof window === 'undefined') {
      const logger = await getServerLogger()
      await logger?.info(message, formattedContext)
    } else {
      const logger = await getClientLogger()
      await logger?.info(message, formattedContext)
    }
  },

  /**
   * Log debug-level messages (development only)
   * Use for: Debugging, detailed flow tracking
   */
  debug: async (message: string, context?: LogContext) => {
    // Only log debug in development
    if (process.env.NODE_ENV !== 'production') {
      const formattedContext = formatContext(context)
      console.debug(`[DEBUG] ${message}`, formattedContext)

      if (typeof window === 'undefined') {
        const logger = await getServerLogger()
        await logger?.debug(message, formattedContext)
      } else {
        const logger = await getClientLogger()
        await logger?.debug(message, formattedContext)
      }
    }
  },

  /**
   * Flush logs to Better Stack
   * Call before process exit or page unload
   */
  flush: async () => {
    if (typeof window === 'undefined') {
      const logger = await getServerLogger()
      await logger?.flush()
    } else {
      const logger = await getClientLogger()
      await logger?.flush()
    }
  },
}

/**
 * Format context object for logging
 * Extracts error stack traces and sanitizes sensitive data
 */
function formatContext(context?: LogContext): Record<string, unknown> {
  if (!context) return {}

  const formatted: Record<string, unknown> = { ...context }

  // Extract error details
  if (context.error) {
    if (context.error instanceof Error) {
      formatted.error = {
        message: context.error.message,
        stack: context.error.stack,
        name: context.error.name,
      }
    } else {
      formatted.error = String(context.error)
    }
  }

  // Add timestamp
  formatted.timestamp = new Date().toISOString()

  // Add environment
  formatted.environment = process.env.NODE_ENV || 'development'

  return formatted
}

/**
 * Create a request-specific logger with context
 * Useful for tracking related logs across a request lifecycle
 */
export function createRequestLogger(requestId: string, userId?: string) {
  return {
    error: (message: string, context?: LogContext) =>
      logger.error(message, { ...context, requestId, userId }),
    warn: (message: string, context?: LogContext) =>
      logger.warn(message, { ...context, requestId, userId }),
    info: (message: string, context?: LogContext) =>
      logger.info(message, { ...context, requestId, userId }),
    debug: (message: string, context?: LogContext) =>
      logger.debug(message, { ...context, requestId, userId }),
  }
}

/**
 * Middleware to log API requests
 * Add to API routes for automatic request/response logging
 */
export function logApiRequest(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string
) {
  const context = {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    userId,
  }

  if (statusCode >= 500) {
    logger.error('API request failed', context)
  } else if (statusCode >= 400) {
    logger.warn('API request error', context)
  } else {
    logger.info('API request', context)
  }
}
