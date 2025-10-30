/**
 * Centralized Error Message Utility
 * Provides consistent, user-friendly error messages across the application
 *
 * @version 1.0.0
 * @since 2025-10-19
 * @related-todo 049-ready-p2-consistent-error-messages.md
 *
 * DESIGN PRINCIPLES:
 * 1. User-friendly: Clear, actionable language
 * 2. Consistent: Same pattern for similar errors
 * 3. Professional: Appropriate tone for aviation industry
 * 4. Actionable: Tell users what they can do next
 * 5. Context-aware: Specific to the operation that failed
 */

// ===================================
// ERROR MESSAGE CATEGORIES
// ===================================

/**
 * Error category types for classification
 */
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  NETWORK = 'network',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  SERVER = 'server',
  CLIENT = 'client',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// ===================================
// AUTHENTICATION ERROR MESSAGES
// ===================================

export const AUTH_ERRORS = {
  UNAUTHORIZED: {
    message: 'Authentication required. Please sign in to continue.',
    action: 'Sign in to your account',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.WARNING,
  },
  SESSION_EXPIRED: {
    message: 'Your session has expired. Please sign in again.',
    action: 'Sign in again',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.WARNING,
  },
  INVALID_CREDENTIALS: {
    message: 'Invalid email or password. Please check your credentials and try again.',
    action: 'Verify your email and password',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.ERROR,
  },
  FORBIDDEN: {
    message: 'You do not have permission to perform this action.',
    action: 'Contact your administrator for access',
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.WARNING,
  },
  CSRF_MISSING: {
    message: 'CSRF token is missing',
    action: 'Please refresh the page and try again',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.ERROR,
  },
  CSRF_INVALID: {
    message: 'CSRF token is invalid or expired',
    action: 'Please refresh the page and try again',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.ERROR,
  },
} as const

// ===================================
// VALIDATION ERROR MESSAGES
// ===================================

export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: (fieldName: string) => ({
    message: `${fieldName} is required. Please provide a value.`,
    action: `Enter a valid ${fieldName.toLowerCase()}`,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  }),
  INVALID_FORMAT: (fieldName: string) => ({
    message: `${fieldName} format is invalid. Please check your input.`,
    action: `Enter ${fieldName.toLowerCase()} in the correct format`,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  }),
  INVALID_DATE: {
    message: 'Invalid date format. Please select a valid date.',
    action: 'Use the date picker to select a date',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  DATE_RANGE: {
    message: 'End date must be after start date. Please check your date range.',
    action: 'Adjust your date selection',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  INVALID_EMAIL: {
    message: 'Invalid email address format. Please check your email.',
    action: 'Enter a valid email address (e.g., pilot@airniugini.com)',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  OUT_OF_RANGE: (fieldName: string, min: number, max: number) => ({
    message: `${fieldName} must be between ${min} and ${max}.`,
    action: `Enter a value between ${min} and ${max}`,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  }),
} as const

// ===================================
// DATABASE ERROR MESSAGES
// ===================================

export const DATABASE_ERRORS = {
  FETCH_FAILED: (resource: string) => ({
    message: `Unable to load ${resource}. Please try again.`,
    action: 'Refresh the page or try again later',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
  }),
  CREATE_FAILED: (resource: string) => ({
    message: `Unable to create ${resource}. Please check your input and try again.`,
    action: 'Verify all required fields are filled correctly',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
  }),
  UPDATE_FAILED: (resource: string) => ({
    message: `Unable to update ${resource}. Please try again.`,
    action: 'Refresh the page and try again',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
  }),
  DELETE_FAILED: (resource: string) => ({
    message: `Unable to delete ${resource}. This record may be referenced by other data.`,
    action: 'Contact support if this issue persists',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
  }),
  NOT_FOUND: (resource: string) => ({
    message: `${resource} not found. It may have been deleted or moved.`,
    action: 'Return to the main list and try again',
    category: ErrorCategory.NOT_FOUND,
    severity: ErrorSeverity.WARNING,
  }),
  DUPLICATE_ENTRY: (resource: string) => ({
    message: `This ${resource} already exists. Please check your existing records.`,
    action: 'Review existing records or modify your input',
    category: ErrorCategory.CONFLICT,
    severity: ErrorSeverity.WARNING,
  }),
} as const

// ===================================
// NETWORK ERROR MESSAGES
// ===================================

export const NETWORK_ERRORS = {
  CONNECTION_FAILED: {
    message: 'Network connection failed. Please check your internet connection.',
    action: 'Check your network connection and try again',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.ERROR,
  },
  TIMEOUT: {
    message: 'Request timed out. The server is taking too long to respond.',
    action: 'Try again or contact support if the issue persists',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.ERROR,
  },
  SERVER_ERROR: {
    message: 'Server error occurred. Our team has been notified.',
    action: 'Please try again in a few minutes',
    category: ErrorCategory.SERVER,
    severity: ErrorSeverity.ERROR,
  },
} as const

// ===================================
// PILOT-SPECIFIC ERROR MESSAGES
// ===================================

export const PILOT_ERRORS = {
  FETCH_FAILED: DATABASE_ERRORS.FETCH_FAILED('pilot data'),
  CREATE_FAILED: DATABASE_ERRORS.CREATE_FAILED('pilot'),
  UPDATE_FAILED: DATABASE_ERRORS.UPDATE_FAILED('pilot'),
  DELETE_FAILED: DATABASE_ERRORS.DELETE_FAILED('pilot'),
  NOT_FOUND: DATABASE_ERRORS.NOT_FOUND('Pilot'),
  DUPLICATE_EMPLOYEE_ID: {
    message: 'A pilot with this employee ID already exists. Please use a unique employee ID.',
    action: 'Check existing pilot records or contact HR',
    category: ErrorCategory.CONFLICT,
    severity: ErrorSeverity.WARNING,
  },
  INVALID_SENIORITY: {
    message: 'Invalid seniority number. Please ensure the seniority number is unique.',
    action: 'Review existing seniority assignments',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
} as const

// ===================================
// CERTIFICATION ERROR MESSAGES
// ===================================

export const CERTIFICATION_ERRORS = {
  FETCH_FAILED: DATABASE_ERRORS.FETCH_FAILED('certification data'),
  CREATE_FAILED: DATABASE_ERRORS.CREATE_FAILED('certification'),
  UPDATE_FAILED: DATABASE_ERRORS.UPDATE_FAILED('certification'),
  DELETE_FAILED: DATABASE_ERRORS.DELETE_FAILED('certification'),
  NOT_FOUND: DATABASE_ERRORS.NOT_FOUND('Certification'),
  DUPLICATE_CERTIFICATION: {
    message:
      'This certification already exists for this pilot. Please check existing certifications.',
    action: "Review the pilot's current certifications",
    category: ErrorCategory.CONFLICT,
    severity: ErrorSeverity.WARNING,
  },
  EXPIRED_CERTIFICATION: {
    message: 'This certification has expired. Please update or renew the certification.',
    action: 'Update the expiry date or create a new certification record',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  BULK_UPDATE_FAILED: {
    message: 'Unable to update multiple certifications. Some updates may have failed.',
    action: 'Review the certification list and try updating individual records',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
  },
} as const

// ===================================
// LEAVE REQUEST ERROR MESSAGES
// ===================================

export const LEAVE_ERRORS = {
  FETCH_FAILED: DATABASE_ERRORS.FETCH_FAILED('leave request data'),
  CREATE_FAILED: DATABASE_ERRORS.CREATE_FAILED('leave request'),
  UPDATE_FAILED: DATABASE_ERRORS.UPDATE_FAILED('leave request'),
  DELETE_FAILED: DATABASE_ERRORS.DELETE_FAILED('leave request'),
  NOT_FOUND: DATABASE_ERRORS.NOT_FOUND('Leave request'),
  DUPLICATE_REQUEST: {
    message: 'A leave request for these dates already exists. Please check your existing requests.',
    action: 'View your existing leave requests or contact your supervisor',
    category: ErrorCategory.CONFLICT,
    severity: ErrorSeverity.WARNING,
  },
  INSUFFICIENT_CREW: {
    message: 'Unable to approve this leave request. Minimum crew requirements would not be met.',
    action: 'Contact your supervisor to discuss alternative dates',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  PAST_DATE: {
    message: 'Cannot create leave request for past dates. Please select future dates.',
    action: 'Select dates in the future',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  INVALID_ROSTER_PERIOD: {
    message: 'Invalid roster period. Leave requests must align with roster period boundaries.',
    action: 'Ensure dates align with the roster period (28-day cycles)',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
} as const

// ===================================
// FLIGHT REQUEST ERROR MESSAGES
// ===================================

export const FLIGHT_ERRORS = {
  FETCH_FAILED: DATABASE_ERRORS.FETCH_FAILED('flight request data'),
  CREATE_FAILED: DATABASE_ERRORS.CREATE_FAILED('flight request'),
  UPDATE_FAILED: DATABASE_ERRORS.UPDATE_FAILED('flight request'),
  DELETE_FAILED: DATABASE_ERRORS.DELETE_FAILED('flight request'),
  NOT_FOUND: DATABASE_ERRORS.NOT_FOUND('Flight request'),
  DUPLICATE_REQUEST: {
    message:
      'A flight request for this date and type already exists. Please check your existing requests.',
    action: 'View your existing flight requests or select a different date',
    category: ErrorCategory.CONFLICT,
    severity: ErrorSeverity.WARNING,
  },
  INVALID_DATE_RANGE: {
    message: 'End date must be on or after start date. Please check your date range.',
    action: 'Adjust your date selection',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  PAST_START_DATE: {
    message: 'Start date cannot be in the past. Please select a future date.',
    action: 'Select a start date in the future',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  REVIEW_MISSING_COMMENTS: {
    message: 'Comments are required when denying a flight request.',
    action: 'Provide a reason for denial',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
} as const

// ===================================
// FEEDBACK ERROR MESSAGES
// ===================================

export const FEEDBACK_ERRORS = {
  FETCH_FAILED: DATABASE_ERRORS.FETCH_FAILED('feedback data'),
  CREATE_FAILED: DATABASE_ERRORS.CREATE_FAILED('feedback post'),
  UPDATE_FAILED: DATABASE_ERRORS.UPDATE_FAILED('feedback post'),
  DELETE_FAILED: DATABASE_ERRORS.DELETE_FAILED('feedback post'),
  NOT_FOUND: DATABASE_ERRORS.NOT_FOUND('Feedback post'),
  COMMENT_CREATE_FAILED: DATABASE_ERRORS.CREATE_FAILED('comment'),
  COMMENT_UPDATE_FAILED: DATABASE_ERRORS.UPDATE_FAILED('comment'),
  COMMENT_DELETE_FAILED: DATABASE_ERRORS.DELETE_FAILED('comment'),
  COMMENT_NOT_FOUND: DATABASE_ERRORS.NOT_FOUND('Comment'),
  ALREADY_VOTED: {
    message: 'You have already voted on this post.',
    action: 'Remove your vote first to change it',
    category: ErrorCategory.CONFLICT,
    severity: ErrorSeverity.INFO,
  },
  VOTE_FAILED: {
    message: 'Unable to register your vote. Please try again.',
    action: 'Refresh the page and try again',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
  },
  UNAUTHORIZED_EDIT: {
    message: 'You can only edit your own posts and comments.',
    action: 'Contact a moderator if you need to make changes',
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.WARNING,
  },
  MODERATION_FAILED: {
    message: 'Unable to perform moderation action. Please try again.',
    action: 'Verify you have moderator permissions',
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.ERROR,
  },
  HIDE_REQUIRES_REASON: {
    message: 'A reason is recommended when hiding a post.',
    action: 'Provide a reason for transparency',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  CATEGORY_NOT_FOUND: DATABASE_ERRORS.NOT_FOUND('Feedback category'),
  INVALID_CATEGORY: {
    message: 'Invalid feedback category. Please select a valid category.',
    action: 'Choose from the available categories',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  RESPONSE_FAILED: {
    message: 'Unable to add admin response to feedback. Please try again.',
    action: 'Verify your admin permissions and retry',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
  },
  EXPORT_FAILED: {
    message: 'Unable to export feedback data. Please try again.',
    action: 'Check your permissions and retry',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
  },
} as const

// ===================================
// TASK MANAGEMENT ERROR MESSAGES
// ===================================

export const TASK_ERRORS = {
  FETCH_FAILED: DATABASE_ERRORS.FETCH_FAILED('task data'),
  CREATE_FAILED: DATABASE_ERRORS.CREATE_FAILED('task'),
  UPDATE_FAILED: DATABASE_ERRORS.UPDATE_FAILED('task'),
  DELETE_FAILED: DATABASE_ERRORS.DELETE_FAILED('task'),
  NOT_FOUND: DATABASE_ERRORS.NOT_FOUND('Task'),
  INVALID_STATUS: {
    message: 'Invalid task status. Please select a valid status.',
    action: 'Choose from TODO, IN_PROGRESS, DONE, or CANCELLED',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  INVALID_PRIORITY: {
    message: 'Invalid task priority. Please select a valid priority level.',
    action: 'Choose from LOW, MEDIUM, HIGH, or URGENT',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  INVALID_ASSIGNMENT: {
    message: 'Cannot assign task to this user. User may not exist or be inactive.',
    action: 'Select a valid active user',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  KANBAN_MOVE_FAILED: {
    message: 'Unable to move task on the board. Please try again.',
    action: 'Refresh the page and try again',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
  },
} as const

// ===================================
// DISCIPLINARY MATTER ERROR MESSAGES
// ===================================

export const DISCIPLINARY_ERRORS = {
  FETCH_FAILED: DATABASE_ERRORS.FETCH_FAILED('disciplinary matter data'),
  CREATE_FAILED: DATABASE_ERRORS.CREATE_FAILED('disciplinary matter'),
  UPDATE_FAILED: DATABASE_ERRORS.UPDATE_FAILED('disciplinary matter'),
  DELETE_FAILED: DATABASE_ERRORS.DELETE_FAILED('disciplinary matter'),
  NOT_FOUND: DATABASE_ERRORS.NOT_FOUND('Disciplinary matter'),
  ACTION_LOG_FAILED: {
    message: 'Unable to log disciplinary action. Please try again.',
    action: 'Verify all required information is provided',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
  },
  RESOLUTION_REQUIRED: {
    message: 'Resolution is required when marking matter as RESOLVED or CLOSED.',
    action: 'Provide a resolution summary before closing',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  INVALID_SEVERITY: {
    message: 'Invalid severity level. Please select a valid severity.',
    action: 'Choose from LOW, MEDIUM, HIGH, or CRITICAL',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  INVALID_MATTER_TYPE: {
    message: 'Invalid matter type. Please select a valid matter type.',
    action: 'Choose from available matter types',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  UNAUTHORIZED_ACCESS: {
    message: 'You do not have permission to view this disciplinary matter.',
    action: 'Contact HR or your supervisor for access',
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.WARNING,
  },
} as const

// ===================================
// PILOT PORTAL ERROR MESSAGES
// ===================================

export const PORTAL_ERRORS = {
  REGISTRATION_FAILED: {
    message: 'Unable to submit registration. Please check your information and try again.',
    action: 'Verify all required fields are filled correctly',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
  },
  DUPLICATE_REGISTRATION: {
    message: 'A registration with this email address already exists.',
    action: 'Contact support if you need assistance',
    category: ErrorCategory.CONFLICT,
    severity: ErrorSeverity.WARNING,
  },
  APPROVAL_FAILED: {
    message: 'Unable to process registration approval. Please try again.',
    action: 'Verify all required information is provided',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
  },
  DENIAL_REASON_REQUIRED: {
    message: 'A denial reason is required when denying a registration.',
    action: 'Provide a clear explanation for the denial',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  NOTIFICATION_FAILED: {
    message: 'Unable to send notification. The operation was completed but notification failed.',
    action: 'Check notifications manually',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.WARNING,
  },
  NOTIFICATION_UPDATE_FAILED: {
    message: 'Unable to mark notification as read. Please try again.',
    action: 'Refresh the page and try again',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
  },
  LOGIN_FAILED: {
    message: 'Login failed. Please check your email and password.',
    action: 'Verify your credentials or reset your password',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.ERROR,
  },
  LOGOUT_FAILED: {
    message: 'Logout failed. Please try again.',
    action: 'Refresh the page and try logging out again',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.ERROR,
  },
  PASSWORD_MISMATCH: {
    message: 'Passwords do not match. Please ensure both password fields are identical.',
    action: 'Re-enter your password in both fields',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  WEAK_PASSWORD: {
    message: 'Password does not meet security requirements.',
    action: 'Use at least 8 characters with uppercase, lowercase, number, and special character',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  INVALID_RANK: {
    message: 'Invalid rank selection. Please select either Captain or First Officer.',
    action: 'Choose a valid rank',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
  REGISTRATION_PENDING: {
    message: 'Your registration is pending approval. Please check back later.',
    action: 'Contact support if you have questions',
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.INFO,
  },
  REGISTRATION_DENIED: {
    message: 'Your registration was denied. Please contact support for assistance.',
    action: 'Contact HR or support team',
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.WARNING,
  },
} as const

// ===================================
// USER MANAGEMENT ERROR MESSAGES
// ===================================

export const USER_ERRORS = {
  FETCH_FAILED: DATABASE_ERRORS.FETCH_FAILED('user data'),
  CREATE_FAILED: DATABASE_ERRORS.CREATE_FAILED('user'),
  UPDATE_FAILED: DATABASE_ERRORS.UPDATE_FAILED('user'),
  DELETE_FAILED: DATABASE_ERRORS.DELETE_FAILED('user'),
  NOT_FOUND: DATABASE_ERRORS.NOT_FOUND('User'),
  DUPLICATE_EMAIL: {
    message: 'A user with this email address already exists. Please use a different email.',
    action: 'Use a different email address or contact support',
    category: ErrorCategory.CONFLICT,
    severity: ErrorSeverity.WARNING,
  },
} as const

// ===================================
// ANALYTICS ERROR MESSAGES
// ===================================

export const ANALYTICS_ERRORS = {
  FETCH_FAILED: DATABASE_ERRORS.FETCH_FAILED('analytics data'),
  CALCULATION_FAILED: {
    message: 'Unable to calculate analytics. Some data may be incomplete.',
    action: 'Try refreshing the page or contact support',
    category: ErrorCategory.SERVER,
    severity: ErrorSeverity.WARNING,
  },
} as const

// ===================================
// PDF GENERATION ERROR MESSAGES
// ===================================

export const PDF_ERRORS = {
  GENERATION_FAILED: (reportType: string) => ({
    message: `Unable to generate ${reportType} report. Please try again.`,
    action: 'Check your data and try again, or contact support',
    category: ErrorCategory.SERVER,
    severity: ErrorSeverity.ERROR,
  }),
  DATA_INCOMPLETE: {
    message: 'Insufficient data to generate report. Please ensure all required data is available.',
    action: 'Verify all required data is present',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
  },
} as const

// ===================================
// HELPER TYPES AND INTERFACES
// ===================================

/**
 * Error message structure
 */
export interface ErrorMessage {
  message: string
  action?: string
  category: ErrorCategory
  severity: ErrorSeverity
}

/**
 * Extended error with context
 */
export interface ContextualError extends ErrorMessage {
  timestamp: string
  source?: string
  metadata?: Record<string, unknown>
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Format error for API responses
 */
export function formatApiError(error: ErrorMessage, statusCode: number = 500) {
  return {
    success: false,
    error: error.message,
    action: error.action,
    category: error.category,
    severity: error.severity,
    statusCode,
  }
}

/**
 * Format error for user display (toast, alert, etc.)
 */
export function formatUserError(error: ErrorMessage): string {
  if (error.action) {
    return `${error.message}\n\n${error.action}.`
  }
  return error.message
}

/**
 * Create a contextual error with metadata
 */
export function createContextualError(
  error: ErrorMessage,
  source?: string,
  metadata?: Record<string, unknown>
): ContextualError {
  return {
    ...error,
    timestamp: new Date().toISOString(),
    source,
    metadata,
  }
}

/**
 * Get generic error message based on HTTP status code
 */
export function getErrorByStatusCode(statusCode: number): ErrorMessage {
  switch (statusCode) {
    case 400:
      return {
        message: 'Invalid request. Please check your input and try again.',
        action: 'Verify all fields are filled correctly',
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.WARNING,
      }
    case 401:
      return AUTH_ERRORS.UNAUTHORIZED
    case 403:
      return AUTH_ERRORS.FORBIDDEN
    case 404:
      return {
        message: 'The requested resource was not found.',
        action: 'Return to the previous page',
        category: ErrorCategory.NOT_FOUND,
        severity: ErrorSeverity.WARNING,
      }
    case 409:
      return {
        message: 'This record already exists. Please check your input.',
        action: 'Review existing records',
        category: ErrorCategory.CONFLICT,
        severity: ErrorSeverity.WARNING,
      }
    case 500:
      return NETWORK_ERRORS.SERVER_ERROR
    case 503:
      return {
        message: 'Service temporarily unavailable. Please try again shortly.',
        action: 'Try again in a few minutes',
        category: ErrorCategory.SERVER,
        severity: ErrorSeverity.ERROR,
      }
    default:
      return {
        message: 'An unexpected error occurred. Please try again.',
        action: 'Contact support if the issue persists',
        category: ErrorCategory.SERVER,
        severity: ErrorSeverity.ERROR,
      }
  }
}

/**
 * Combine multiple error messages for batch operations
 */
export function combineErrors(errors: ErrorMessage[]): ErrorMessage {
  const uniqueMessages = [...new Set(errors.map((e) => e.message))]
  const highestSeverity = errors.reduce((prev, curr) => {
    const severityOrder = {
      [ErrorSeverity.INFO]: 0,
      [ErrorSeverity.WARNING]: 1,
      [ErrorSeverity.ERROR]: 2,
      [ErrorSeverity.CRITICAL]: 3,
    }
    return severityOrder[curr.severity] > severityOrder[prev.severity] ? curr : prev
  })

  return {
    message:
      uniqueMessages.length === 1
        ? uniqueMessages[0]
        : `Multiple errors occurred: ${uniqueMessages.join('; ')}`,
    action: 'Review individual errors and try again',
    category: highestSeverity.category,
    severity: highestSeverity.severity,
  }
}

/**
 * Check if error message is retryable based on category and severity
 */
export function isErrorMessageRetryable(error: ErrorMessage): boolean {
  const retryableCategories = [ErrorCategory.NETWORK, ErrorCategory.SERVER]
  return retryableCategories.includes(error.category)
}

/**
 * Get user-friendly error title based on severity
 */
export function getErrorTitle(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.INFO:
      return 'Information'
    case ErrorSeverity.WARNING:
      return 'Warning'
    case ErrorSeverity.ERROR:
      return 'Error'
    case ErrorSeverity.CRITICAL:
      return 'Critical Error'
    default:
      return 'Error'
  }
}

// ===================================
// EXPORTS
// ===================================

/**
 * Centralized error messages object for easy access
 */
export const ERROR_MESSAGES = {
  AUTH: AUTH_ERRORS,
  VALIDATION: VALIDATION_ERRORS,
  DATABASE: DATABASE_ERRORS,
  NETWORK: NETWORK_ERRORS,
  PILOT: PILOT_ERRORS,
  CERTIFICATION: CERTIFICATION_ERRORS,
  LEAVE: LEAVE_ERRORS,
  FLIGHT: FLIGHT_ERRORS,
  FEEDBACK: FEEDBACK_ERRORS,
  TASK: TASK_ERRORS,
  DISCIPLINARY: DISCIPLINARY_ERRORS,
  PORTAL: PORTAL_ERRORS,
  USER: USER_ERRORS,
  ANALYTICS: ANALYTICS_ERRORS,
  PDF: PDF_ERRORS,
} as const

/**
 * Type for error message keys
 */
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES
