/**
 * Standardized Error Codes
 *
 * Provides consistent error codes across the application for better
 * error tracking and internationalization support.
 *
 * @version 1.0.0 - SECURITY: Standardized error handling
 * @updated 2025-11-04 - Phase 2C implementation
 * @author Maurice Rondeau
 */

/**
 * Error code enum
 */
export enum ErrorCode {
  // Authentication Errors (1000-1099)
  AUTH_INVALID_CREDENTIALS = 'AUTH_001',
  AUTH_SESSION_EXPIRED = 'AUTH_002',
  AUTH_UNAUTHORIZED = 'AUTH_003',
  AUTH_TOKEN_INVALID = 'AUTH_004',
  AUTH_ACCOUNT_LOCKED = 'AUTH_005',
  AUTH_EMAIL_NOT_VERIFIED = 'AUTH_006',

  // Authorization Errors (1100-1199)
  AUTHZ_FORBIDDEN = 'AUTHZ_001',
  AUTHZ_INSUFFICIENT_PERMISSIONS = 'AUTHZ_002',
  AUTHZ_RESOURCE_ACCESS_DENIED = 'AUTHZ_003',
  AUTHZ_ADMIN_ONLY = 'AUTHZ_004',

  // Validation Errors (1200-1299)
  VALIDATION_FAILED = 'VAL_001',
  VALIDATION_INVALID_INPUT = 'VAL_002',
  VALIDATION_REQUIRED_FIELD = 'VAL_003',
  VALIDATION_INVALID_FORMAT = 'VAL_004',
  VALIDATION_OUT_OF_RANGE = 'VAL_005',
  VALIDATION_PASSWORD_TOO_WEAK = 'VAL_006',
  VALIDATION_EMAIL_INVALID = 'VAL_007',

  // Database Errors (1300-1399)
  DB_CONNECTION_FAILED = 'DB_001',
  DB_QUERY_FAILED = 'DB_002',
  DB_CONSTRAINT_VIOLATION = 'DB_003',
  DB_FOREIGN_KEY_VIOLATION = 'DB_004',
  DB_UNIQUE_VIOLATION = 'DB_005',
  DB_TRANSACTION_FAILED = 'DB_006',

  // Resource Errors (1400-1499)
  RESOURCE_NOT_FOUND = 'RES_001',
  RESOURCE_ALREADY_EXISTS = 'RES_002',
  RESOURCE_CONFLICT = 'RES_003',
  RESOURCE_DELETED = 'RES_004',

  // Rate Limiting Errors (1500-1599)
  RATE_LIMIT_EXCEEDED = 'RATE_001',
  RATE_LIMIT_QUOTA_EXCEEDED = 'RATE_002',

  // CSRF Errors (1600-1699)
  CSRF_TOKEN_MISSING = 'CSRF_001',
  CSRF_TOKEN_INVALID = 'CSRF_002',
  CSRF_TOKEN_EXPIRED = 'CSRF_003',

  // File/Upload Errors (1700-1799)
  FILE_TOO_LARGE = 'FILE_001',
  FILE_INVALID_TYPE = 'FILE_002',
  FILE_UPLOAD_FAILED = 'FILE_003',

  // Business Logic Errors (1800-1899)
  BUSINESS_RULE_VIOLATION = 'BIZ_001',
  BUSINESS_INVALID_STATE = 'BIZ_002',
  BUSINESS_OPERATION_NOT_ALLOWED = 'BIZ_003',

  // External Service Errors (1900-1999)
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXT_001',
  EXTERNAL_SERVICE_TIMEOUT = 'EXT_002',
  EXTERNAL_SERVICE_ERROR = 'EXT_003',

  // General Errors (2000+)
  INTERNAL_SERVER_ERROR = 'ERR_001',
  SERVICE_UNAVAILABLE = 'ERR_002',
  NOT_IMPLEMENTED = 'ERR_003',
  UNKNOWN_ERROR = 'ERR_999',
}

/**
 * Error code metadata
 */
interface ErrorCodeMetadata {
  code: ErrorCode
  statusCode: number
  message: string
  userMessage: string // Safe message for end users
}

/**
 * Error code registry with metadata
 */
export const ERROR_CODES: Record<ErrorCode, ErrorCodeMetadata> = {
  // Authentication Errors
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: {
    code: ErrorCode.AUTH_INVALID_CREDENTIALS,
    statusCode: 401,
    message: 'Invalid email or password',
    userMessage: 'Invalid credentials. Please check your email and password.',
  },
  [ErrorCode.AUTH_SESSION_EXPIRED]: {
    code: ErrorCode.AUTH_SESSION_EXPIRED,
    statusCode: 401,
    message: 'Session expired',
    userMessage: 'Your session has expired. Please log in again.',
  },
  [ErrorCode.AUTH_UNAUTHORIZED]: {
    code: ErrorCode.AUTH_UNAUTHORIZED,
    statusCode: 401,
    message: 'Unauthorized',
    userMessage: 'You must be logged in to perform this action.',
  },
  [ErrorCode.AUTH_TOKEN_INVALID]: {
    code: ErrorCode.AUTH_TOKEN_INVALID,
    statusCode: 401,
    message: 'Invalid authentication token',
    userMessage: 'Authentication failed. Please log in again.',
  },
  [ErrorCode.AUTH_ACCOUNT_LOCKED]: {
    code: ErrorCode.AUTH_ACCOUNT_LOCKED,
    statusCode: 423,
    message: 'Account temporarily locked',
    userMessage:
      'Your account is temporarily locked due to multiple failed login attempts. Please try again later.',
  },
  [ErrorCode.AUTH_EMAIL_NOT_VERIFIED]: {
    code: ErrorCode.AUTH_EMAIL_NOT_VERIFIED,
    statusCode: 403,
    message: 'Email not verified',
    userMessage: 'Please verify your email address before logging in.',
  },

  // Authorization Errors
  [ErrorCode.AUTHZ_FORBIDDEN]: {
    code: ErrorCode.AUTHZ_FORBIDDEN,
    statusCode: 403,
    message: 'Access forbidden',
    userMessage: 'You do not have permission to access this resource.',
  },
  [ErrorCode.AUTHZ_INSUFFICIENT_PERMISSIONS]: {
    code: ErrorCode.AUTHZ_INSUFFICIENT_PERMISSIONS,
    statusCode: 403,
    message: 'Insufficient permissions',
    userMessage: 'You do not have sufficient permissions for this action.',
  },
  [ErrorCode.AUTHZ_RESOURCE_ACCESS_DENIED]: {
    code: ErrorCode.AUTHZ_RESOURCE_ACCESS_DENIED,
    statusCode: 403,
    message: 'Resource access denied',
    userMessage: 'You cannot access this resource.',
  },
  [ErrorCode.AUTHZ_ADMIN_ONLY]: {
    code: ErrorCode.AUTHZ_ADMIN_ONLY,
    statusCode: 403,
    message: 'Admin access required',
    userMessage: 'This action requires administrator privileges.',
  },

  // Validation Errors
  [ErrorCode.VALIDATION_FAILED]: {
    code: ErrorCode.VALIDATION_FAILED,
    statusCode: 400,
    message: 'Validation failed',
    userMessage: 'Please check your input and try again.',
  },
  [ErrorCode.VALIDATION_INVALID_INPUT]: {
    code: ErrorCode.VALIDATION_INVALID_INPUT,
    statusCode: 400,
    message: 'Invalid input',
    userMessage: 'One or more fields contain invalid data.',
  },
  [ErrorCode.VALIDATION_REQUIRED_FIELD]: {
    code: ErrorCode.VALIDATION_REQUIRED_FIELD,
    statusCode: 400,
    message: 'Required field missing',
    userMessage: 'Please fill in all required fields.',
  },
  [ErrorCode.VALIDATION_INVALID_FORMAT]: {
    code: ErrorCode.VALIDATION_INVALID_FORMAT,
    statusCode: 400,
    message: 'Invalid format',
    userMessage: 'Please check the format of your input.',
  },
  [ErrorCode.VALIDATION_OUT_OF_RANGE]: {
    code: ErrorCode.VALIDATION_OUT_OF_RANGE,
    statusCode: 400,
    message: 'Value out of range',
    userMessage: 'Please enter a value within the allowed range.',
  },
  [ErrorCode.VALIDATION_PASSWORD_TOO_WEAK]: {
    code: ErrorCode.VALIDATION_PASSWORD_TOO_WEAK,
    statusCode: 400,
    message: 'Password does not meet requirements',
    userMessage:
      'Your password is too weak. Please use at least 12 characters with uppercase, lowercase, numbers, and special characters.',
  },
  [ErrorCode.VALIDATION_EMAIL_INVALID]: {
    code: ErrorCode.VALIDATION_EMAIL_INVALID,
    statusCode: 400,
    message: 'Invalid email address',
    userMessage: 'Please enter a valid email address.',
  },

  // Database Errors
  [ErrorCode.DB_CONNECTION_FAILED]: {
    code: ErrorCode.DB_CONNECTION_FAILED,
    statusCode: 500,
    message: 'Database connection failed',
    userMessage: 'Unable to connect to the database. Please try again later.',
  },
  [ErrorCode.DB_QUERY_FAILED]: {
    code: ErrorCode.DB_QUERY_FAILED,
    statusCode: 500,
    message: 'Database query failed',
    userMessage: 'A database error occurred. Please try again later.',
  },
  [ErrorCode.DB_CONSTRAINT_VIOLATION]: {
    code: ErrorCode.DB_CONSTRAINT_VIOLATION,
    statusCode: 400,
    message: 'Database constraint violation',
    userMessage: 'This operation violates a data constraint.',
  },
  [ErrorCode.DB_FOREIGN_KEY_VIOLATION]: {
    code: ErrorCode.DB_FOREIGN_KEY_VIOLATION,
    statusCode: 400,
    message: 'Foreign key constraint violation',
    userMessage: 'Cannot complete operation due to related data.',
  },
  [ErrorCode.DB_UNIQUE_VIOLATION]: {
    code: ErrorCode.DB_UNIQUE_VIOLATION,
    statusCode: 409,
    message: 'Unique constraint violation',
    userMessage: 'This record already exists.',
  },
  [ErrorCode.DB_TRANSACTION_FAILED]: {
    code: ErrorCode.DB_TRANSACTION_FAILED,
    statusCode: 500,
    message: 'Database transaction failed',
    userMessage: 'The operation could not be completed. Please try again.',
  },

  // Resource Errors
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    code: ErrorCode.RESOURCE_NOT_FOUND,
    statusCode: 404,
    message: 'Resource not found',
    userMessage: 'The requested resource was not found.',
  },
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: {
    code: ErrorCode.RESOURCE_ALREADY_EXISTS,
    statusCode: 409,
    message: 'Resource already exists',
    userMessage: 'This resource already exists.',
  },
  [ErrorCode.RESOURCE_CONFLICT]: {
    code: ErrorCode.RESOURCE_CONFLICT,
    statusCode: 409,
    message: 'Resource conflict',
    userMessage: 'A conflict occurred with existing data.',
  },
  [ErrorCode.RESOURCE_DELETED]: {
    code: ErrorCode.RESOURCE_DELETED,
    statusCode: 410,
    message: 'Resource has been deleted',
    userMessage: 'This resource has been deleted.',
  },

  // Rate Limiting Errors
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    code: ErrorCode.RATE_LIMIT_EXCEEDED,
    statusCode: 429,
    message: 'Rate limit exceeded',
    userMessage: 'Too many requests. Please try again later.',
  },
  [ErrorCode.RATE_LIMIT_QUOTA_EXCEEDED]: {
    code: ErrorCode.RATE_LIMIT_QUOTA_EXCEEDED,
    statusCode: 429,
    message: 'Quota exceeded',
    userMessage: 'You have exceeded your usage quota.',
  },

  // CSRF Errors
  [ErrorCode.CSRF_TOKEN_MISSING]: {
    code: ErrorCode.CSRF_TOKEN_MISSING,
    statusCode: 403,
    message: 'CSRF token missing',
    userMessage: 'Security token missing. Please refresh and try again.',
  },
  [ErrorCode.CSRF_TOKEN_INVALID]: {
    code: ErrorCode.CSRF_TOKEN_INVALID,
    statusCode: 403,
    message: 'CSRF token invalid',
    userMessage: 'Invalid security token. Please refresh and try again.',
  },
  [ErrorCode.CSRF_TOKEN_EXPIRED]: {
    code: ErrorCode.CSRF_TOKEN_EXPIRED,
    statusCode: 403,
    message: 'CSRF token expired',
    userMessage: 'Security token expired. Please refresh and try again.',
  },

  // File/Upload Errors
  [ErrorCode.FILE_TOO_LARGE]: {
    code: ErrorCode.FILE_TOO_LARGE,
    statusCode: 413,
    message: 'File too large',
    userMessage: 'The file you are trying to upload is too large.',
  },
  [ErrorCode.FILE_INVALID_TYPE]: {
    code: ErrorCode.FILE_INVALID_TYPE,
    statusCode: 400,
    message: 'Invalid file type',
    userMessage: 'This file type is not supported.',
  },
  [ErrorCode.FILE_UPLOAD_FAILED]: {
    code: ErrorCode.FILE_UPLOAD_FAILED,
    statusCode: 500,
    message: 'File upload failed',
    userMessage: 'Failed to upload file. Please try again.',
  },

  // Business Logic Errors
  [ErrorCode.BUSINESS_RULE_VIOLATION]: {
    code: ErrorCode.BUSINESS_RULE_VIOLATION,
    statusCode: 400,
    message: 'Business rule violation',
    userMessage: 'This operation violates a business rule.',
  },
  [ErrorCode.BUSINESS_INVALID_STATE]: {
    code: ErrorCode.BUSINESS_INVALID_STATE,
    statusCode: 400,
    message: 'Invalid state',
    userMessage: 'This operation cannot be performed in the current state.',
  },
  [ErrorCode.BUSINESS_OPERATION_NOT_ALLOWED]: {
    code: ErrorCode.BUSINESS_OPERATION_NOT_ALLOWED,
    statusCode: 403,
    message: 'Operation not allowed',
    userMessage: 'This operation is not allowed.',
  },

  // External Service Errors
  [ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: {
    code: ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
    statusCode: 503,
    message: 'External service unavailable',
    userMessage: 'An external service is currently unavailable. Please try again later.',
  },
  [ErrorCode.EXTERNAL_SERVICE_TIMEOUT]: {
    code: ErrorCode.EXTERNAL_SERVICE_TIMEOUT,
    statusCode: 504,
    message: 'External service timeout',
    userMessage: 'An external service timed out. Please try again.',
  },
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: {
    code: ErrorCode.EXTERNAL_SERVICE_ERROR,
    statusCode: 502,
    message: 'External service error',
    userMessage: 'An external service encountered an error.',
  },

  // General Errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    statusCode: 500,
    message: 'Internal server error',
    userMessage: 'An unexpected error occurred. Please try again later.',
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    code: ErrorCode.SERVICE_UNAVAILABLE,
    statusCode: 503,
    message: 'Service unavailable',
    userMessage: 'The service is temporarily unavailable. Please try again later.',
  },
  [ErrorCode.NOT_IMPLEMENTED]: {
    code: ErrorCode.NOT_IMPLEMENTED,
    statusCode: 501,
    message: 'Not implemented',
    userMessage: 'This feature is not yet implemented.',
  },
  [ErrorCode.UNKNOWN_ERROR]: {
    code: ErrorCode.UNKNOWN_ERROR,
    statusCode: 500,
    message: 'Unknown error',
    userMessage: 'An unexpected error occurred.',
  },
}

/**
 * Get error metadata by code
 */
export function getErrorMetadata(code: ErrorCode): ErrorCodeMetadata {
  return ERROR_CODES[code] || ERROR_CODES[ErrorCode.UNKNOWN_ERROR]
}

/**
 * Create standardized error response
 */
export interface StandardErrorResponse {
  success: false
  error: {
    code: ErrorCode
    message: string
    userMessage: string
    errorId?: string
    details?: unknown
  }
}

export function createStandardError(
  code: ErrorCode,
  errorId?: string,
  details?: unknown
): StandardErrorResponse {
  const metadata = getErrorMetadata(code)

  return {
    success: false,
    error: {
      code: metadata.code,
      message: metadata.message,
      userMessage: metadata.userMessage,
      errorId,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
    },
  }
}
