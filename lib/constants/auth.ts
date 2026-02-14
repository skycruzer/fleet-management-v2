/**
 * Auth Constants
 * Author: Maurice Rondeau
 *
 * Single source of truth for authentication-related constants.
 * All services should import from here instead of defining locally.
 */

/**
 * Bcrypt salt rounds for password hashing.
 * Higher values are more secure but slower.
 * Value of 10 is the industry standard for web applications.
 */
export const BCRYPT_SALT_ROUNDS = 10
