/**
 * Log Sanitization Utility
 *
 * Removes sensitive data from logs to prevent credential/PII leakage
 *
 * Developer: Maurice Rondeau
 *
 * @version 1.0.0
 * @created 2025-10-27
 */

/**
 * List of sensitive field names to redact
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'password_hash',
  'confirmPassword',
  'confirm_password',
  'oldPassword',
  'old_password',
  'newPassword',
  'new_password',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'apiKey',
  'api_key',
  'secret',
  'secretKey',
  'secret_key',
  'privateKey',
  'private_key',
  'sessionToken',
  'session_token',
  'csrfToken',
  'csrf_token',
  'authorization',
  'cookie',
  'set-cookie',
]

/**
 * Patterns to detect and redact
 */
const PATTERNS = {
  // Email addresses
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

  // UUIDs
  uuid: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,

  // JWT tokens (basic detection)
  jwt: /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g,

  // API keys (common formats)
  apiKey: /(?:api[_-]?key|apikey|key)["\s:=]+([a-zA-Z0-9_\-]{20,})/gi,

  // Credit card numbers (basic)
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,

  // Social Security Numbers (US)
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
}

/**
 * Sanitize a string by removing/redacting sensitive patterns
 */
export function sanitizeString(
  str: string,
  options?: {
    preserveEmails?: boolean
    preserveUUIDs?: boolean
  }
): string {
  if (typeof str !== 'string') return str

  let sanitized = str

  // Redact email addresses (unless preserved)
  if (!options?.preserveEmails) {
    sanitized = sanitized.replace(PATTERNS.email, (match) => {
      const [username, domain] = match.split('@')
      return `${username.substring(0, 2)}***@${domain}`
    })
  }

  // Redact UUIDs (unless preserved)
  if (!options?.preserveUUIDs) {
    sanitized = sanitized.replace(PATTERNS.uuid, (match) => {
      return `${match.substring(0, 8)}...${match.substring(match.length - 4)}`
    })
  }

  // Redact JWT tokens
  sanitized = sanitized.replace(PATTERNS.jwt, '[REDACTED_JWT]')

  // Redact API keys
  sanitized = sanitized.replace(PATTERNS.apiKey, '$1[REDACTED_API_KEY]')

  // Redact credit cards
  sanitized = sanitized.replace(PATTERNS.creditCard, '[REDACTED_CC]')

  // Redact SSNs
  sanitized = sanitized.replace(PATTERNS.ssn, '[REDACTED_SSN]')

  return sanitized
}

/**
 * Sanitize an object by redacting sensitive fields and patterns
 */
export function sanitizeObject<T = any>(
  obj: T,
  options?: {
    preserveEmails?: boolean
    preserveUUIDs?: boolean
    maxDepth?: number
    currentDepth?: number
  }
): T {
  if (obj === null || obj === undefined) return obj

  const maxDepth = options?.maxDepth ?? 10
  const currentDepth = options?.currentDepth ?? 0

  // Prevent infinite recursion
  if (currentDepth >= maxDepth) {
    return '[MAX_DEPTH_REACHED]' as unknown as T
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      sanitizeObject(item, { ...options, currentDepth: currentDepth + 1 })
    ) as unknown as T
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return sanitizeString(obj, options) as unknown as T
    }
    return obj
  }

  // Handle Error objects specially
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: sanitizeString(obj.message, options),
      stack: sanitizeString(obj.stack || '', options),
    } as unknown as T
  }

  // Handle objects
  const sanitized: any = {}

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()

    // Check if field is sensitive
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]'
      continue
    }

    // Recursively sanitize nested objects/arrays
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, { ...options, currentDepth: currentDepth + 1 })
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value, options)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized as T
}

/**
 * Sanitize log arguments before logging
 *
 * @example
 * console.log(...sanitizeLogArgs('User login:', user, error))
 */
export function sanitizeLogArgs(...args: any[]): any[] {
  return args.map((arg) => {
    if (typeof arg === 'string') {
      return sanitizeString(arg)
    }
    if (typeof arg === 'object' && arg !== null) {
      return sanitizeObject(arg)
    }
    return arg
  })
}

/**
 * Safe logger wrapper that automatically sanitizes all arguments
 */
export const safeLog = {
  log: (...args: any[]) => console.log(...sanitizeLogArgs(...args)),
  error: (...args: any[]) => console.error(...sanitizeLogArgs(...args)),
  warn: (...args: any[]) => console.warn(...sanitizeLogArgs(...args)),
  info: (...args: any[]) => console.info(...sanitizeLogArgs(...args)),
  debug: (...args: any[]) => console.debug(...sanitizeLogArgs(...args)),
}

/**
 * Create a sanitized logger for a specific context
 *
 * @example
 * const logger = createSafeLogger('AuthService')
 * logger.info('User logged in:', user)
 */
export function createSafeLogger(context: string) {
  return {
    log: (...args: any[]) => console.log(`[${context}]`, ...sanitizeLogArgs(...args)),
    error: (...args: any[]) => console.error(`[${context}]`, ...sanitizeLogArgs(...args)),
    warn: (...args: any[]) => console.warn(`[${context}]`, ...sanitizeLogArgs(...args)),
    info: (...args: any[]) => console.info(`[${context}]`, ...sanitizeLogArgs(...args)),
    debug: (...args: any[]) => console.debug(`[${context}]`, ...sanitizeLogArgs(...args)),
  }
}

/**
 * Sanitize an HTTP request for logging
 */
export function sanitizeRequest(request: Request): Record<string, any> {
  const headers: Record<string, string> = {}

  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase()
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      headers[key] = '[REDACTED]'
    } else {
      headers[key] = sanitizeString(value)
    }
  })

  return {
    method: request.method,
    url: sanitizeString(request.url),
    headers,
  }
}

/**
 * Sanitize response data for logging
 */
export function sanitizeResponse(response: any): any {
  return sanitizeObject(response, { preserveUUIDs: true })
}
