/**
 * Error Logging Utility
 * Centralized logging system for client and server errors
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogContext {
  userId?: string
  pilotId?: string
  route?: string
  action?: string
  component?: string
  [key: string]: any
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  error?: Error
  context?: LogContext
  stack?: string
  userAgent?: string
  url?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isClient = typeof window !== 'undefined'

  /**
   * Log debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, undefined, context)
    }
  }

  /**
   * Log informational message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, undefined, context)
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, undefined, context)
  }

  /**
   * Log error
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : undefined
    this.log('error', message, errorObj, context)
  }

  /**
   * Log fatal error (critical system failures)
   */
  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : undefined
    this.log('fatal', message, errorObj, context)

    // In production, you might want to send fatal errors to an external service
    if (!this.isDevelopment && this.isClient) {
      this.sendToExternalService({ level: 'fatal', message, error: errorObj, context })
    }
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, error?: Error, context?: LogContext): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      error,
      context,
      stack: error?.stack,
    }

    // Add client-specific info
    if (this.isClient) {
      logEntry.userAgent = navigator.userAgent
      logEntry.url = window.location.href
    }

    // Console logging with appropriate method
    this.consoleLog(level, logEntry)

    // In production, send to logging service
    if (!this.isDevelopment) {
      this.persistLog(logEntry)
    }
  }

  /**
   * Console logging with color coding
   */
  private consoleLog(level: LogLevel, entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`

    switch (level) {
      case 'debug':
        console.debug(prefix, entry.message, entry.context || '')
        break
      case 'info':
        console.info(prefix, entry.message, entry.context || '')
        break
      case 'warn':
        console.warn(prefix, entry.message, entry.context || '')
        break
      case 'error':
      case 'fatal':
        console.error(prefix, entry.message, entry.error || entry.context || '')
        if (entry.stack) {
          console.error('Stack trace:', entry.stack)
        }
        break
    }
  }

  /**
   * Persist log to storage/service
   */
  private persistLog(entry: LogEntry): void {
    try {
      // Store in sessionStorage for client-side logs
      if (this.isClient) {
        this.storeClientLog(entry)
      }

      // Future: Send to external logging service (Sentry, LogRocket, etc.)
      // this.sendToExternalService(entry)
    } catch (error) {
      // Fail silently to avoid infinite loops
      console.error('Failed to persist log:', error)
    }
  }

  /**
   * Store client-side logs in sessionStorage
   */
  private storeClientLog(entry: LogEntry): void {
    try {
      const logs = this.getStoredLogs()
      logs.push(entry)

      // Keep only last 100 logs
      const recentLogs = logs.slice(-100)

      sessionStorage.setItem('app_logs', JSON.stringify(recentLogs))
    } catch (error) {
      // SessionStorage might be full or unavailable
      console.error('Failed to store log:', error)
    }
  }

  /**
   * Get stored client-side logs
   */
  getStoredLogs(): LogEntry[] {
    try {
      const logs = sessionStorage.getItem('app_logs')
      return logs ? JSON.parse(logs) : []
    } catch {
      return []
    }
  }

  /**
   * Clear stored logs
   */
  clearLogs(): void {
    try {
      sessionStorage.removeItem('app_logs')
    } catch (error) {
      console.error('Failed to clear logs:', error)
    }
  }

  /**
   * Download logs as JSON file
   */
  downloadLogs(): void {
    if (!this.isClient) return

    try {
      const logs = this.getStoredLogs()
      const blob = new Blob([JSON.stringify(logs, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `logs_${new Date().toISOString()}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download logs:', error)
    }
  }

  /**
   * Send log to external service (placeholder)
   */
  private sendToExternalService(_entry: Partial<LogEntry>): void {
    // Future implementation:
    // - Sentry
    // - LogRocket
    // - DataDog
    // - CloudWatch
    // - Custom logging API
    // Example Sentry integration:
    // if (window.Sentry) {
    //   window.Sentry.captureException(entry.error, {
    //     level: entry.level,
    //     extra: entry.context,
    //   })
    // }
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience functions
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context)

export const logInfo = (message: string, context?: LogContext) => logger.info(message, context)

export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context)

export const logError = (message: string, error?: Error | unknown, context?: LogContext) =>
  logger.error(message, error, context)

export const logFatal = (message: string, error?: Error | unknown, context?: LogContext) =>
  logger.fatal(message, error, context)

/**
 * Log API request
 */
export function logApiRequest(method: string, url: string, context?: LogContext): void {
  logger.debug(`API Request: ${method} ${url}`, {
    ...context,
    method,
    url,
  })
}

/**
 * Log API response
 */
export function logApiResponse(
  method: string,
  url: string,
  status: number,
  duration?: number,
  context?: LogContext
): void {
  const message = `API Response: ${method} ${url} - ${status}`
  const logContext = {
    ...context,
    method,
    url,
    status,
    duration,
  }

  if (status >= 500) {
    logger.error(message, undefined, logContext)
  } else if (status >= 400) {
    logger.warn(message, logContext)
  } else {
    logger.debug(message, logContext)
  }
}

/**
 * Log user action
 */
export function logUserAction(action: string, context?: LogContext): void {
  logger.info(`User Action: ${action}`, {
    ...context,
    action,
  })
}

/**
 * Log page view
 */
export function logPageView(route: string, context?: LogContext): void {
  logger.info(`Page View: ${route}`, {
    ...context,
    route,
  })
}

/**
 * Log performance metric
 */
export function logPerformance(
  metric: string,
  value: number,
  unit: 'ms' | 's' | 'MB' = 'ms',
  context?: LogContext
): void {
  logger.debug(`Performance: ${metric} = ${value}${unit}`, {
    ...context,
    metric,
    value,
    unit,
  })
}

/**
 * Catch and log unhandled errors (client-side only)
 */
export function setupGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return

  // Unhandled errors
  window.addEventListener('error', (event) => {
    logger.error('Unhandled Error', event.error, {
      component: 'global',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', event.reason, {
      component: 'global',
      promise: String(event.promise),
    })
  })
}
