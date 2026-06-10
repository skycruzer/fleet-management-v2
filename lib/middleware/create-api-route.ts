/**
 * API Route Factory
 *
 * Single entry point for the standard API route security pipeline documented
 * in CLAUDE.md. A route declares its requirements once; the factory enforces
 * the order and makes it impossible to skip a step:
 *
 * 1. Per-IP rate limit (default; runs before auth so abuse is cheap to reject)
 * 2. CSRF validation (mutation methods only)
 * 3. Authentication (admin dual-auth or pilot session)
 * 4. Per-user rate limit (when `rateLimit.by === 'user'` — needs the userId)
 * 5. Role check (admin routes passing `roles`)
 * 6. Zod body validation (when `schema` is given)
 * 7. Handler
 * 8. On 2xx: `invalidateCache()` + `revalidatePath()` for each declared path
 *
 * Errors thrown anywhere in the pipeline are sanitized via `sanitizeError`.
 *
 * Usage:
 * ```typescript
 * export const POST = createAdminRoute(
 *   {
 *     operation: 'reviewLeaveBid',
 *     endpoint: '/api/admin/leave-bids/review',
 *     roles: [UserRole.ADMIN, UserRole.MANAGER],
 *     schema: ReviewBidSchema,
 *     revalidate: ['/dashboard/admin/leave-bids'],
 *   },
 *   async ({ body, admin }) => {
 *     // business logic only — return a NextResponse
 *   }
 * )
 * ```
 *
 * Developer: Maurice Rondeau
 *
 * @version 1.0.0
 * @since 2026-06-10
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import type { z } from 'zod'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getCurrentPilot, type PilotUser } from '@/lib/auth/pilot-helpers'
import { requireRole, type UserRole } from '@/lib/middleware/authorization-middleware'
import { readRateLimit, mutationRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { getClientIp } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import {
  unauthorizedResponse,
  validationErrorResponse,
  forbiddenResponse,
} from '@/lib/utils/api-response-helper'

/**
 * Minimal structural interface satisfied by both real Upstash limiters and
 * the development mock in rate-limit-middleware.ts / lib/rate-limit.ts.
 */
export interface RateLimiterLike {
  limit(identifier: string): Promise<{
    success: boolean
    limit?: number
    remaining?: number
    reset?: number
  }>
}

/**
 * Rate limiting strategy for a route.
 * - omitted: method-based per-IP limit (GET → read, mutations → mutation)
 * - `false`: no rate limiting (e.g. portal GETs where shared office IPs
 *   would pool into one bucket — see lib/rate-limit.ts prefix note)
 * - `{ limiter, by: 'ip' }`: custom limiter keyed by client IP, before auth
 * - `{ limiter, by: 'user' }`: custom limiter keyed by user ID, after auth
 */
export type RateLimitOption = false | { limiter: RateLimiterLike; by: 'ip' | 'user' }

interface CommonRouteOptions<TBody> {
  /** Operation name for error logging (e.g. 'reviewLeaveBid') */
  operation: string
  /** Endpoint path for error logging (e.g. '/api/admin/leave-bids/review') */
  endpoint: string
  /** Zod schema for the JSON request body; omit for routes without a body */
  schema?: z.ZodType<TBody>
  rateLimit?: RateLimitOption
  /** Paths passed to revalidatePath() after a successful (2xx) response */
  revalidate?: string[] | ((ctx: { params: Record<string, string> }) => string[])
  /** Domain cache invalidation hook (e.g. invalidateLeaveCaches), run before revalidate */
  invalidateCache?: () => Promise<unknown>
}

export interface AdminRouteOptions<TBody> extends CommonRouteOptions<TBody> {
  /** Roles enforced via requireRole(); omit when getAuthenticatedAdmin() suffices */
  roles?: UserRole[]
  /** Custom 403 message replacing requireRole's default error (always status 403) */
  forbiddenMessage?: string
}

export type PilotRouteOptions<TBody> = CommonRouteOptions<TBody>

/** Admin identity with authentication already proven (userId is non-null) */
export interface AuthenticatedAdmin {
  userId: string
  email: string | null
  role: string | null
  source: 'supabase' | 'admin-session'
}

export interface AdminRouteContext<TBody> {
  request: NextRequest
  params: Record<string, string>
  body: TBody
  admin: AuthenticatedAdmin
}

export interface PilotRouteContext<TBody> {
  request: NextRequest
  params: Record<string, string>
  body: TBody
  pilot: PilotUser
}

/**
 * Next.js generates route param types as `string | string[] | undefined`,
 * so the exported handler must accept that shape; awaited params are
 * narrowed to Record<string, string> before reaching the route handler.
 */
type NextRouteContext = { params: Promise<Record<string, string | string[] | undefined>> }
type RouteHandler = (request: NextRequest, context: NextRouteContext) => Promise<NextResponse>

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function defaultLimiter(method: string): RateLimiterLike {
  return MUTATION_METHODS.has(method) ? mutationRateLimit : readRateLimit
}

/**
 * Per-IP rate limit check. Fails open on Redis errors (matching withRateLimit)
 * and returns headers to attach to the eventual response.
 */
async function applyIpRateLimit(
  request: NextRequest,
  limiter: RateLimiterLike
): Promise<{ error: NextResponse } | { headers: Record<string, string> }> {
  try {
    const { success, limit, remaining, reset } = await limiter.limit(getClientIp(request))

    const headers: Record<string, string> = {}
    if (limit !== undefined) headers['X-RateLimit-Limit'] = String(limit)
    if (remaining !== undefined) headers['X-RateLimit-Remaining'] = String(remaining)
    if (reset !== undefined) headers['X-RateLimit-Reset'] = new Date(reset).toISOString()

    if (!success) {
      return {
        error: NextResponse.json(
          {
            success: false,
            error: 'Too many requests',
            message: 'Too many requests. Please try again later.',
            code: 429,
          },
          {
            status: 429,
            headers: {
              ...headers,
              'Retry-After': reset ? Math.ceil((reset - Date.now()) / 1000).toString() : '60',
            },
          }
        ),
      }
    }

    return { headers }
  } catch (error) {
    // Redis outage must not take mutations down with it
    console.error('Rate limiting error:', error)
    return { headers: {} }
  }
}

function parseBody<TBody>(
  schema: z.ZodType<TBody> | undefined,
  raw: unknown
): { body: TBody } | { error: NextResponse } {
  if (!schema) {
    return { body: undefined as TBody }
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return {
      error: validationErrorResponse(
        parsed.error.issues[0]?.message ?? 'Invalid request body',
        parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }))
      ),
    }
  }

  return { body: parsed.data }
}

async function readJsonBody(
  request: NextRequest
): Promise<{ raw: unknown } | { error: NextResponse }> {
  try {
    return { raw: await request.json() }
  } catch {
    return { error: validationErrorResponse('Invalid JSON request body', []) }
  }
}

async function finalizeSuccess<TBody>(
  response: NextResponse,
  options: CommonRouteOptions<TBody>,
  params: Record<string, string>
): Promise<void> {
  if (!response.ok) return

  if (options.invalidateCache) {
    await options.invalidateCache()
  }

  const paths =
    typeof options.revalidate === 'function'
      ? options.revalidate({ params })
      : (options.revalidate ?? [])

  for (const path of paths) {
    revalidatePath(path)
  }
}

function attachHeaders(response: NextResponse, headers: Record<string, string>): NextResponse {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
  return response
}

function errorResponseFor(error: unknown, operation: string, endpoint: string): NextResponse {
  const sanitized = sanitizeError(error, { operation, endpoint })
  return NextResponse.json(sanitized, { status: sanitized.statusCode || 500 })
}

/**
 * Create an admin API route handler (Supabase Auth → admin-session fallback).
 */
export function createAdminRoute<TBody = undefined>(
  options: AdminRouteOptions<TBody>,
  handler: (ctx: AdminRouteContext<TBody>) => Promise<NextResponse>
): RouteHandler {
  return async (request, context) => {
    try {
      let rateHeaders: Record<string, string> = {}
      const rateLimit = options.rateLimit

      if (rateLimit !== false && rateLimit?.by !== 'user') {
        const limiter = rateLimit?.limiter ?? defaultLimiter(request.method)
        const result = await applyIpRateLimit(request, limiter)
        if ('error' in result) return result.error
        rateHeaders = result.headers
      }

      const csrfError = await validateCsrf(request)
      if (csrfError) return csrfError

      const auth = await getAuthenticatedAdmin()
      if (!auth.authenticated || !auth.userId || !auth.source) {
        return unauthorizedResponse('Unauthorized - Please log in')
      }

      if (rateLimit && rateLimit.by === 'user') {
        const { success } = await rateLimit.limiter.limit(auth.userId)
        if (!success) {
          return NextResponse.json(
            { success: false, error: 'Too many requests. Please try again later.' },
            { status: 429 }
          )
        }
      }

      if (options.roles?.length) {
        const roleCheck = await requireRole(request, options.roles)
        if (!roleCheck.authorized) {
          if (options.forbiddenMessage) {
            return forbiddenResponse(options.forbiddenMessage)
          }
          return NextResponse.json(
            { success: false, error: roleCheck.error || 'Insufficient permissions' },
            { status: roleCheck.statusCode || 403 }
          )
        }
      }

      const params = ((await context?.params) ?? {}) as Record<string, string>

      let body = undefined as TBody
      if (options.schema) {
        const json = await readJsonBody(request)
        if ('error' in json) return json.error
        const parsed = parseBody(options.schema, json.raw)
        if ('error' in parsed) return parsed.error
        body = parsed.body
      }

      const response = await handler({
        request,
        params,
        body,
        admin: {
          userId: auth.userId,
          email: auth.email,
          role: auth.role,
          source: auth.source,
        },
      })

      await finalizeSuccess(response, options, params)
      return attachHeaders(response, rateHeaders)
    } catch (error) {
      return errorResponseFor(error, options.operation, options.endpoint)
    }
  }
}

/**
 * Create a pilot portal API route handler (Redis session → Supabase Auth fallback).
 */
export function createPilotRoute<TBody = undefined>(
  options: PilotRouteOptions<TBody>,
  handler: (ctx: PilotRouteContext<TBody>) => Promise<NextResponse>
): RouteHandler {
  return async (request, context) => {
    try {
      let rateHeaders: Record<string, string> = {}
      const rateLimit = options.rateLimit

      if (rateLimit !== false && rateLimit?.by !== 'user') {
        const limiter = rateLimit?.limiter ?? defaultLimiter(request.method)
        const result = await applyIpRateLimit(request, limiter)
        if ('error' in result) return result.error
        rateHeaders = result.headers
      }

      const csrfError = await validateCsrf(request)
      if (csrfError) return csrfError

      const pilot = await getCurrentPilot()
      if (!pilot) {
        return unauthorizedResponse('Pilot authentication required')
      }

      if (rateLimit && rateLimit.by === 'user') {
        const { success } = await rateLimit.limiter.limit(pilot.id)
        if (!success) {
          return NextResponse.json(
            { success: false, error: 'Too many requests. Please try again later.' },
            { status: 429 }
          )
        }
      }

      const params = ((await context?.params) ?? {}) as Record<string, string>

      let body = undefined as TBody
      if (options.schema) {
        const json = await readJsonBody(request)
        if ('error' in json) return json.error
        const parsed = parseBody(options.schema, json.raw)
        if ('error' in parsed) return parsed.error
        body = parsed.body
      }

      const response = await handler({ request, params, body, pilot })

      await finalizeSuccess(response, options, params)
      return attachHeaders(response, rateHeaders)
    } catch (error) {
      return errorResponseFor(error, options.operation, options.endpoint)
    }
  }
}
