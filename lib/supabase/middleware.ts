import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'
import { env } from '@/lib/env'
import {
  loginRateLimit,
  authRateLimit,
  passwordResetRateLimit,
  getClientIp,
  createRateLimitResponse,
} from '@/lib/rate-limit'

export async function updateSession(request: NextRequest) {
  // ============================================================================
  // Rate Limiting for Authentication Endpoints
  // ============================================================================

  const pathname = request.nextUrl.pathname

  // Apply rate limiting to authentication endpoints
  if (pathname.startsWith('/api/auth')) {
    const ip = getClientIp(request)

    // Determine which rate limiter to use based on endpoint
    let rateLimitResult

    if (pathname.includes('/login') || pathname.includes('/signin')) {
      // Strict limit for login attempts (5 per minute)
      rateLimitResult = await loginRateLimit.limit(ip)
    } else if (pathname.includes('/password-reset') || pathname.includes('/forgot-password')) {
      // Very strict limit for password reset (3 per hour)
      rateLimitResult = await passwordResetRateLimit.limit(ip)
    } else {
      // General auth limit for signup, etc. (10 per minute)
      rateLimitResult = await authRateLimit.limit(ip)
    }

    // If rate limit exceeded, return 429 response
    if (!rateLimitResult.success) {
      // Calculate retry time in seconds from reset timestamp (milliseconds)
      const now = Date.now()
      const retryAfter = Math.ceil((rateLimitResult.reset - now) / 1000)

      return createRateLimitResponse(retryAfter, rateLimitResult.limit, rateLimitResult.reset)
    }

    // Add rate limit headers to all auth responses
    const response = NextResponse.next({ request })
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())

    // Note: We continue to Supabase session handling below
  }

  // ============================================================================
  // Supabase Session Management
  // ============================================================================

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(
            ({ name, value, options }: { name: string; value: string; options?: any }) =>
              supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ============================================================================
  // Protected Routes & Role-Based Routing
  // ============================================================================

  // Admin/Manager Dashboard Protection
  // Check Supabase Auth, unified fleet-session, AND legacy admin-session cookie
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const fleetSessionCookie = request.cookies.get('fleet-session')
    const adminSessionCookie = request.cookies.get('admin-session')

    // If no Supabase user AND no fleet-session AND no admin session cookie, redirect to login
    if (!user && !fleetSessionCookie && !adminSessionCookie) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
  }

  // Pilot Portal Protection (US1)
  // Check both Supabase Auth AND custom pilot session cookies
  if (
    request.nextUrl.pathname.startsWith('/portal') &&
    !request.nextUrl.pathname.startsWith('/portal/login') &&
    !request.nextUrl.pathname.startsWith('/portal/register') &&
    !request.nextUrl.pathname.startsWith('/portal/forgot-password') &&
    !request.nextUrl.pathname.startsWith('/portal/reset-password') &&
    !request.nextUrl.pathname.startsWith('/portal/change-password')
  ) {
    // Check for custom pilot session cookie (bcrypt-authenticated pilots)
    // Note: Full validation happens in protected routes via validatePilotSession()
    const fleetSessionCookieForPortal = request.cookies.get('fleet-session')
    const pilotSessionCookie = request.cookies.get('pilot-session')

    // If no Supabase user AND no fleet-session AND no pilot session cookie, redirect to login
    if (!user && !fleetSessionCookieForPortal && !pilotSessionCookie) {
      const url = request.nextUrl.clone()
      url.pathname = '/portal/login'
      return NextResponse.redirect(url)
    }
  }

  // Role-Based Routing (US1)
  // If user is authenticated, check their role and redirect to appropriate portal
  if (user) {
    // Check if user is a pilot
    const { data: pilotUser } = await supabase
      .from('pilot_users')
      .select('id, registration_approved')
      .eq('id', user.id)
      .maybeSingle()

    // Check if user is an admin/manager
    const { data: adminUser } = await supabase
      .from('an_users')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle()

    // Redirect pilots trying to access admin dashboard
    if (pilotUser && !adminUser && request.nextUrl.pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone()
      url.pathname = '/portal/dashboard'
      return NextResponse.redirect(url)
    }

    // Redirect admins trying to access pilot portal
    if (
      adminUser &&
      !pilotUser &&
      request.nextUrl.pathname.startsWith('/portal') &&
      !request.nextUrl.pathname.startsWith('/portal/login') &&
      !request.nextUrl.pathname.startsWith('/portal/register') &&
      !request.nextUrl.pathname.startsWith('/portal/forgot-password') &&
      !request.nextUrl.pathname.startsWith('/portal/reset-password') &&
      !request.nextUrl.pathname.startsWith('/portal/change-password')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Redirect unapproved pilot registrations
    if (
      pilotUser &&
      !pilotUser.registration_approved &&
      request.nextUrl.pathname.startsWith('/portal') &&
      !request.nextUrl.pathname.startsWith('/portal/login')
    ) {
      // Allow access to pilot portal but dashboard will show pending message
      // No redirect needed - handled in dashboard page
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}
