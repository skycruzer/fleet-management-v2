/**
 * Redis Session Storage Service
 * Developer: Maurice Rondeau
 *
 * Central session management module backed by Upstash Redis.
 * All three auth services (auth-service, session-service, admin-auth-service)
 * delegate to this module for session CRUD.
 *
 * Redis key structure:
 *   session:{token}          → JSON session data (TTL: 24h)
 *   user:sessions:{userId}   → Set of active tokens (for "revoke all")
 *
 * Fallback: If Redis is unavailable, falls back to DB query.
 * DB writes always happen for audit logging.
 */

import { Redis } from '@upstash/redis'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { logError, logWarning, ErrorSeverity } from '@/lib/error-logger'

// ============================================================================
// Constants
// ============================================================================

const SESSION_TTL_SECONDS = 24 * 60 * 60 // 24 hours
const EXTEND_THROTTLE_SECONDS = 60 // Only extend TTL once per 60s
const DEFAULT_COOKIE_NAME = 'fleet-session'

// ============================================================================
// Types
// ============================================================================

export interface RedisSessionData {
  sessionId: string // DB row ID for audit correlation
  userId: string
  role: 'admin' | 'manager' | 'pilot'
  email: string | null
  staffId: string
  name: string
  pilotId: string | null
  mustChangePassword: boolean
  createdAt: string // ISO
  expiresAt: string // ISO
  lastActivityAt: string // ISO
}

export interface RedisSessionResult {
  isValid: boolean
  data?: RedisSessionData
  error?: string
}

interface CreateSessionInput {
  userId: string
  role: 'admin' | 'manager' | 'pilot'
  email: string | null
  staffId: string
  name: string
  pilotId: string | null
  mustChangePassword: boolean
}

interface CreateSessionMetadata {
  ipAddress?: string
  userAgent?: string
  cookieName?: string
  /** DB table to write audit record to */
  dbTable?: string
  /** Column name for user ID in the DB table */
  dbUserIdColumn?: string
  /** Custom TTL in seconds (overrides default 24h; used for "remember me") */
  ttlSeconds?: number
}

// ============================================================================
// Redis Client (singleton)
// ============================================================================

let redisClient: Redis | null = null

function getRedisClient(): Redis | null {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      return null
    }

    redisClient = new Redis({ url, token })
  }

  return redisClient
}

// ============================================================================
// Token Generation
// ============================================================================

function generateSessionToken(): string {
  return randomBytes(32).toString('base64url')
}

// ============================================================================
// Redis Key Helpers
// ============================================================================

function sessionKey(token: string): string {
  return `session:${token}`
}

function userSessionsKey(userId: string): string {
  return `user:sessions:${userId}`
}

// ============================================================================
// CREATE SESSION
// ============================================================================

/**
 * Create a new session in Redis (primary) and DB (audit).
 * Sets the session cookie on the response.
 */
export async function createRedisSession(
  userData: CreateSessionInput,
  metadata: CreateSessionMetadata = {}
): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
  const cookieName = metadata.cookieName || DEFAULT_COOKIE_NAME
  const dbTable = metadata.dbTable || 'sessions'
  const dbUserIdColumn = metadata.dbUserIdColumn || 'user_id'
  const ttl = metadata.ttlSeconds || SESSION_TTL_SECONDS

  try {
    const sessionToken = generateSessionToken()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + ttl * 1000)

    // Write to DB first (audit log — must succeed)
    const supabase = createServiceRoleClient()
    const insertData: Record<string, unknown> = {
      session_token: sessionToken,
      [dbUserIdColumn]: userData.userId,
      expires_at: expiresAt.toISOString(),
      ip_address: metadata.ipAddress,
      user_agent: metadata.userAgent,
      is_active: true,
    }

    const { data: dbSession, error: dbError } = await supabase
      .from(dbTable as any)
      .insert(insertData as any)
      .select('id')
      .single()

    if (dbError) {
      console.error(`Failed to create session in ${dbTable}:`, dbError)
      return { success: false, error: 'Failed to create session' }
    }

    const sessionId = (dbSession as any)?.id || ''

    // Build Redis session data
    const sessionData: RedisSessionData = {
      sessionId,
      userId: userData.userId,
      role: userData.role,
      email: userData.email,
      staffId: userData.staffId,
      name: userData.name,
      pilotId: userData.pilotId,
      mustChangePassword: userData.mustChangePassword,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastActivityAt: now.toISOString(),
    }

    // Write to Redis (best-effort — fallback to DB if this fails)
    const redis = getRedisClient()
    if (redis) {
      try {
        const pipeline = redis.pipeline()
        pipeline.set(sessionKey(sessionToken), JSON.stringify(sessionData), {
          ex: ttl,
        })
        pipeline.sadd(userSessionsKey(userData.userId), sessionToken)
        pipeline.expire(userSessionsKey(userData.userId), ttl)
        await pipeline.exec()
      } catch {
        logWarning('Redis write failed during session creation, DB is still authoritative', {
          source: 'RedisSessionService',
          metadata: { operation: 'createRedisSession', userId: userData.userId },
        })
      }
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: ttl,
    })

    return { success: true, sessionToken }
  } catch (error) {
    console.error('Error creating Redis session:', error)
    return { success: false, error: 'Session creation error' }
  }
}

// ============================================================================
// VALIDATE SESSION
// ============================================================================

/**
 * Validate session: read cookie → Redis GET → return user data.
 * Falls back to DB if Redis misses. Re-populates Redis on DB hit.
 */
export async function validateRedisSession(
  cookieName: string = DEFAULT_COOKIE_NAME,
  dbTable: string = 'sessions',
  dbUserIdColumn: string = 'user_id'
): Promise<RedisSessionResult> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(cookieName)?.value

    if (!sessionToken) {
      return { isValid: false, error: 'No session token found' }
    }

    // Try Redis first
    const redis = getRedisClient()
    if (redis) {
      try {
        const raw = await redis.get<string>(sessionKey(sessionToken))
        if (raw) {
          let sessionData: RedisSessionData
          try {
            sessionData =
              typeof raw === 'string' ? JSON.parse(raw) : (raw as unknown as RedisSessionData)
          } catch {
            console.error(
              'Failed to parse Redis session JSON:',
              (typeof raw === 'string' ? raw : '').substring(0, 100)
            )
            await redis.del(sessionKey(sessionToken))
            return { isValid: false, error: 'Corrupt session data' }
          }

          // Check expiry
          if (new Date(sessionData.expiresAt) < new Date()) {
            // Expired — clean up
            await redis.del(sessionKey(sessionToken))
            return { isValid: false, error: 'Session expired' }
          }

          // Throttled activity update
          await extendRedisSession(sessionToken, sessionData)

          return { isValid: true, data: sessionData }
        }
      } catch {
        logWarning('Redis read failed during session validation, falling back to DB', {
          source: 'RedisSessionService',
          metadata: { operation: 'validateRedisSession', cookieName },
        })
      }
    }

    // Fallback: query DB
    return await validateSessionFromDb(sessionToken, dbTable, dbUserIdColumn)
  } catch (error) {
    console.error('Session validation error:', error)
    return { isValid: false, error: 'Session validation error' }
  }
}

/**
 * DB fallback for session validation.
 * If found, re-populates Redis for subsequent requests.
 */
async function validateSessionFromDb(
  sessionToken: string,
  dbTable: string,
  dbUserIdColumn: string
): Promise<RedisSessionResult> {
  try {
    const supabase = createServiceRoleClient()

    // Find active session
    const { data: session, error: sessionError } = await supabase
      .from(dbTable as any)
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single()

    if (sessionError || !session) {
      return { isValid: false, error: 'Session not found' }
    }

    const sessionData = session as any

    // Check expiry
    if (new Date(sessionData.expires_at) < new Date()) {
      await supabase
        .from(dbTable as any)
        .update({ is_active: false } as any)
        .eq('id', sessionData.id)
      return { isValid: false, error: 'Session expired' }
    }

    // Get user data based on which table we are querying
    const userId = sessionData[dbUserIdColumn]
    let userData: any = null

    // Note: the legacy `dbTable === 'sessions'` branch (which queried a
    // non-existent `users` table) was removed when auth-service.ts was
    // deleted. Only `admin_sessions` and `pilot_sessions` are valid.
    if (dbTable === 'admin_sessions') {
      const { data, error } = await supabase
        .from('an_users')
        .select('id, email, name, role')
        .eq('id', userId)
        .single()

      if (!error && data) {
        userData = {
          id: data.id,
          staff_id: data.email,
          email: data.email,
          name: data.name,
          role: data.role === 'admin' ? 'admin' : 'manager',
          is_active: true,
          must_change_password: false,
          pilot_id: null,
        }
      }
    } else if (dbTable === 'pilot_sessions') {
      const { data, error } = await supabase
        .from('pilot_users')
        .select('id, email, first_name, last_name, employee_id')
        .eq('id', userId)
        .single()

      if (!error && data) {
        userData = {
          id: data.id,
          staff_id: data.employee_id || data.email,
          email: data.email,
          name: `${data.first_name} ${data.last_name}`,
          role: 'pilot' as const,
          is_active: true,
          must_change_password: false,
          pilot_id: data.id,
        }
      }
    }

    if (!userData) {
      return { isValid: false, error: 'User not found' }
    }

    if (userData.is_active === false) {
      return { isValid: false, error: 'Account is disabled' }
    }

    // Build RedisSessionData
    const redisData: RedisSessionData = {
      sessionId: sessionData.id,
      userId: userData.id,
      role: userData.role,
      email: userData.email,
      staffId: userData.staff_id,
      name: userData.name,
      pilotId: userData.pilot_id,
      mustChangePassword: userData.must_change_password ?? false,
      createdAt: sessionData.created_at,
      expiresAt: sessionData.expires_at,
      lastActivityAt: sessionData.last_activity_at || sessionData.created_at,
    }

    // Re-populate Redis for future requests
    const redis = getRedisClient()
    if (redis) {
      try {
        const remainingTtl = Math.max(
          1,
          Math.floor((new Date(sessionData.expires_at).getTime() - Date.now()) / 1000)
        )
        const pipeline = redis.pipeline()
        pipeline.set(sessionKey(sessionToken), JSON.stringify(redisData), {
          ex: remainingTtl,
        })
        pipeline.sadd(userSessionsKey(userData.id), sessionToken)
        pipeline.expire(userSessionsKey(userData.id), remainingTtl)
        await pipeline.exec()
      } catch {
        // Non-critical — next request will try again
      }
    }

    // Update last activity in DB
    await supabase
      .from(dbTable as any)
      .update({ last_activity_at: new Date().toISOString() } as any)
      .eq('id', sessionData.id)

    return { isValid: true, data: redisData }
  } catch (error) {
    console.error('DB session validation error:', error)
    return { isValid: false, error: 'Session validation error' }
  }
}

// ============================================================================
// EXTEND SESSION (throttled)
// ============================================================================

/**
 * Update lastActivityAt and reset TTL, throttled to once per 60 seconds.
 */
async function extendRedisSession(token: string, sessionData: RedisSessionData): Promise<void> {
  const lastActivity = new Date(sessionData.lastActivityAt)
  const secondsSinceLastActivity = (Date.now() - lastActivity.getTime()) / 1000

  if (secondsSinceLastActivity < EXTEND_THROTTLE_SECONDS) {
    return // Too recent, skip
  }

  const redis = getRedisClient()
  if (!redis) return

  try {
    const updatedData: RedisSessionData = {
      ...sessionData,
      lastActivityAt: new Date().toISOString(),
    }

    const remainingTtl = Math.max(
      1,
      Math.floor((new Date(sessionData.expiresAt).getTime() - Date.now()) / 1000)
    )

    await redis.set(sessionKey(token), JSON.stringify(updatedData), {
      ex: remainingTtl,
    })
  } catch {
    // Non-critical — session is still valid
  }
}

// ============================================================================
// DESTROY SESSION
// ============================================================================

/**
 * Result for session destruction: structured so callers can detect partial
 * failures (e.g., logout success at the cookie layer but sessions still live
 * server-side). cookieCleared=true should be the only consumer-visible
 * "logged out" signal; redisCleared/dbDeactivated are HIGH-severity logged
 * and should be inspected by security-sensitive flows (password reset).
 */
export interface SessionDestroyResult {
  cookieCleared: boolean
  redisCleared: boolean
  dbDeactivated: boolean
  failures: string[]
}

/**
 * Destroy a single session: delete from Redis + mark inactive in DB + clear cookie.
 *
 * Returns a structured result. Callers that need security guarantees (logout,
 * password reset) should check `redisCleared` and `dbDeactivated`; otherwise
 * `cookieCleared` is sufficient for UX purposes.
 */
export async function destroyRedisSession(
  cookieName: string = DEFAULT_COOKIE_NAME,
  dbTable: string = 'sessions'
): Promise<SessionDestroyResult> {
  const result: SessionDestroyResult = {
    cookieCleared: false,
    redisCleared: true, // optimistically true; flipped to false on failure
    dbDeactivated: true,
    failures: [],
  }

  let cookieStore: Awaited<ReturnType<typeof cookies>>
  try {
    cookieStore = await cookies()
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      source: 'redis-session-service:cookies()',
      severity: ErrorSeverity.HIGH,
    })
    result.failures.push('cookies-unavailable')
    result.redisCleared = false
    result.dbDeactivated = false
    return result
  }

  const sessionToken = cookieStore.get(cookieName)?.value

  if (sessionToken) {
    // Delete from Redis
    const redis = getRedisClient()
    if (redis) {
      try {
        const raw = await redis.get<string>(sessionKey(sessionToken))
        if (raw) {
          let sessionData: RedisSessionData | null = null
          try {
            sessionData =
              typeof raw === 'string' ? JSON.parse(raw) : (raw as unknown as RedisSessionData)
          } catch (parseErr) {
            logWarning('Failed to parse Redis session JSON', {
              source: 'redis-session-service:destroyRedisSession',
              metadata: {
                preview: (typeof raw === 'string' ? raw : '').substring(0, 100),
                error: parseErr instanceof Error ? parseErr.message : String(parseErr),
              },
            })
          }
          if (sessionData) {
            await redis.srem(userSessionsKey(sessionData.userId), sessionToken)
          }
        }
        await redis.del(sessionKey(sessionToken))
      } catch (redisErr) {
        result.redisCleared = false
        result.failures.push('redis-delete')
        logError(redisErr instanceof Error ? redisErr : new Error(String(redisErr)), {
          source: 'redis-session-service:destroyRedisSession:redis',
          severity: ErrorSeverity.HIGH,
          metadata: { dbTable },
        })
      }
    } else {
      // Redis unavailable — DB update below is the only authority.
      result.redisCleared = false
    }

    // Mark inactive in DB
    try {
      const supabase = createServiceRoleClient()
      const { error: dbErr } = await supabase
        .from(dbTable as any)
        .update({ is_active: false } as any)
        .eq('session_token', sessionToken)
      if (dbErr) {
        result.dbDeactivated = false
        result.failures.push('db-deactivate')
        logError(new Error(dbErr.message), {
          source: 'redis-session-service:destroyRedisSession:db',
          severity: ErrorSeverity.HIGH,
          metadata: { dbTable, code: dbErr.code },
        })
      }
    } catch (dbErr) {
      result.dbDeactivated = false
      result.failures.push('db-deactivate-throw')
      logError(dbErr instanceof Error ? dbErr : new Error(String(dbErr)), {
        source: 'redis-session-service:destroyRedisSession:db',
        severity: ErrorSeverity.HIGH,
        metadata: { dbTable },
      })
    }
  } else {
    // No session cookie present; nothing to revoke server-side
    result.redisCleared = true
    result.dbDeactivated = true
  }

  // Always try to clear cookie last
  try {
    cookieStore.delete(cookieName)
    result.cookieCleared = true
  } catch (cookieErr) {
    result.failures.push('cookie-clear')
    logError(cookieErr instanceof Error ? cookieErr : new Error(String(cookieErr)), {
      source: 'redis-session-service:destroyRedisSession:cookie',
      severity: ErrorSeverity.HIGH,
    })
  }

  return result
}

// ============================================================================
// DESTROY ALL USER SESSIONS
// ============================================================================

/**
 * Result for revoking all of a user's sessions.
 * Security-sensitive callers (password reset, lockout) MUST inspect this and
 * surface partial failures — silently dropping a Redis cleanup error means
 * a leaked session token still authenticates after a password reset.
 */
export interface RevokeAllResult {
  redisCleared: boolean
  dbDeactivated: boolean
  failures: string[]
}

/**
 * Revoke all sessions for a given user.
 * Uses Redis SMEMBERS to find all tokens, then deletes them.
 * Returns a structured result; security-sensitive flows must check it.
 */
export async function destroyAllUserSessions(
  userId: string,
  dbTable: string = 'sessions',
  dbUserIdColumn: string = 'user_id'
): Promise<RevokeAllResult> {
  const result: RevokeAllResult = {
    redisCleared: true,
    dbDeactivated: true,
    failures: [],
  }

  // Delete from Redis
  const redis = getRedisClient()
  if (redis) {
    try {
      const tokens = await redis.smembers(userSessionsKey(userId))
      if (tokens.length > 0) {
        const pipeline = redis.pipeline()
        for (const token of tokens) {
          pipeline.del(sessionKey(token))
        }
        pipeline.del(userSessionsKey(userId))
        await pipeline.exec()
      }
    } catch (redisErr) {
      result.redisCleared = false
      result.failures.push('redis-pipeline')
      logError(redisErr instanceof Error ? redisErr : new Error(String(redisErr)), {
        source: 'redis-session-service:destroyAllUserSessions:redis',
        severity: ErrorSeverity.HIGH,
        metadata: { userId, dbTable },
      })
    }
  } else {
    result.redisCleared = false
  }

  // Mark all sessions inactive in DB
  try {
    const supabase = createServiceRoleClient()
    const { error: dbErr } = await supabase
      .from(dbTable as any)
      .update({ is_active: false } as any)
      .eq(dbUserIdColumn, userId)
      .eq('is_active', true)
    if (dbErr) {
      result.dbDeactivated = false
      result.failures.push('db-deactivate')
      logError(new Error(dbErr.message), {
        source: 'redis-session-service:destroyAllUserSessions:db',
        severity: ErrorSeverity.HIGH,
        metadata: { userId, dbTable, code: dbErr.code },
      })
    }
  } catch (error) {
    result.dbDeactivated = false
    result.failures.push('db-deactivate-throw')
    logError(error instanceof Error ? error : new Error(String(error)), {
      source: 'redis-session-service:destroyAllUserSessions:db',
      severity: ErrorSeverity.HIGH,
      metadata: { userId, dbTable },
    })
  }

  return result
}
