import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

/**
 * Root Proxy Middleware - Unified Authentication with Role-Based Access Control
 *
 * All users (pilots, admins, managers) authenticate via Supabase Auth.
 * Access control is determined by:
 * - pilot_users table: approved pilots can access /portal/*
 * - an_users table: admins/managers can access /dashboard/*
 *
 * Dual-role users (pilot + admin) can access both portals with separate logins.
 */

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create response that can be modified
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update request cookies for Server Components
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Update response cookies
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Update request cookies
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Update response cookies
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ============================================================================
  // PUBLIC ROUTES - Allow everyone
  // ============================================================================
  const publicRoutes = [
    '/auth/login',
    '/portal/login',
    '/portal/register',
    '/portal/forgot-password',
    '/portal/reset-password',
  ]

  // Check if pathname exactly matches public routes or is root
  const isPublicRoute = pathname === '/' || publicRoutes.some((route) => pathname === route)

  if (isPublicRoute) {
    return response
  }

  // ============================================================================
  // PILOT PORTAL ROUTES - /portal/*
  // ============================================================================
  if (pathname.startsWith('/portal')) {
    // Check for custom pilot session first (bcrypt authentication)
    const pilotSessionToken = request.cookies.get('pilot-session')?.value

    if (pilotSessionToken) {
      try {
        // Validate token against pilot_sessions table
        const { data: session, error } = await supabase
          .from('pilot_sessions')
          .select('id, pilot_user_id, expires_at, is_active')
          .eq('session_token', pilotSessionToken)
          .eq('is_active', true)
          .single()

        if (!error && session) {
          const expiresAt = new Date(session.expires_at)

          // Check if session is still valid
          if (expiresAt > new Date()) {
            // Verify pilot is still approved
            const { data: pilotUser } = await supabase
              .from('pilot_users')
              .select('id, registration_approved')
              .eq('id', session.pilot_user_id)
              .single()

            if (pilotUser && pilotUser.registration_approved === true) {
              // Valid custom session - allow access
              return response
            }
          }
        }
      } catch {
        // Invalid session cookie - continue to check Supabase Auth
      }
    }

    // Fall back to Supabase Auth check (for legacy auth_user_id pilots)
    if (!user) {
      const loginUrl = new URL('/portal/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check if user is an approved pilot (Supabase Auth)
    const { data: pilotUser } = await supabase
      .from('pilot_users')
      .select('id, registration_approved, auth_user_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!pilotUser) {
      // User exists but is not a pilot - redirect with message
      const loginUrl = new URL('/portal/login', request.url)
      loginUrl.searchParams.set('error', 'not_registered')
      loginUrl.searchParams.set('message', 'You are not registered as a pilot')

      // Sign out the user since they're in the wrong portal
      await supabase.auth.signOut()
      return NextResponse.redirect(loginUrl)
    }

    if (pilotUser.registration_approved !== true) {
      // Pilot not yet approved
      const loginUrl = new URL('/portal/login', request.url)
      loginUrl.searchParams.set('error', 'not_approved')
      loginUrl.searchParams.set('message', 'Your pilot registration is pending approval')

      // Sign out - they can't use the portal yet
      await supabase.auth.signOut()
      return NextResponse.redirect(loginUrl)
    }

    // Approved pilot - allow access
    return response
  }

  // ============================================================================
  // ADMIN DASHBOARD ROUTES - /dashboard/*
  // ============================================================================
  if (pathname.startsWith('/dashboard')) {
    // Check for custom admin session first (bcrypt authentication)
    const adminSessionToken = request.cookies.get('admin-session')?.value

    // Check custom admin session cookie first
    if (adminSessionToken) {
      try {
        // Validate token against admin_sessions table
        const { data: session, error } = await supabase
          .from('admin_sessions')
          .select('id, admin_user_id, expires_at, is_active')
          .eq('session_token', adminSessionToken)
          .eq('is_active', true)
          .single()

        if (!error && session) {
          const expiresAt = new Date(session.expires_at)

          // Check if session is still valid
          if (expiresAt > new Date()) {
            // Verify admin user exists
            const { data: adminUser } = await supabase
              .from('an_users')
              .select('id, email, role')
              .eq('id', session.admin_user_id)
              .single()

            if (adminUser) {
              // Valid custom session - allow access
              return response
            }
          }
        }
      } catch {
        // Invalid session cookie - continue to check Supabase Auth
      }
    }

    // Fall back to Supabase Auth check
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check if user is admin or manager
    const { data: adminUser } = await supabase
      .from('an_users')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (!adminUser) {
      // Not an admin/manager - check if they're a pilot
      const { data: pilotUser } = await supabase
        .from('pilot_users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (pilotUser) {
        // User is a pilot - redirect to pilot portal with toast notification
        const portalUrl = new URL('/portal/dashboard', request.url)
        portalUrl.searchParams.set('toast', 'admin_access_denied')
        portalUrl.searchParams.set(
          'message',
          'You need admin or fleet manager access to view the dashboard'
        )
        return NextResponse.redirect(portalUrl)
      }

      // Not a pilot or admin - redirect to login
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('error', 'unauthorized')
      loginUrl.searchParams.set('message', 'You do not have access to the admin dashboard')

      // Sign out
      await supabase.auth.signOut()
      return NextResponse.redirect(loginUrl)
    }

    // Admin/manager - allow access
    return response
  }

  // ============================================================================
  // API ROUTES - Role-based access
  // ============================================================================
  if (pathname.startsWith('/api/portal')) {
    // Allow public portal API routes (login, register, password flows)
    const publicPortalApiRoutes = [
      '/api/portal/login',
      '/api/portal/register',
      '/api/portal/forgot-password',
      '/api/portal/reset-password',
      '/api/portal/change-password',
    ]
    if (publicPortalApiRoutes.includes(pathname)) {
      return response
    }

    // Check for custom pilot session cookie (bcrypt authentication)
    const pilotSessionCookie = request.cookies.get('pilot-session')?.value

    if (pilotSessionCookie) {
      try {
        // Validate token against pilot_sessions table
        const { data: session, error } = await supabase
          .from('pilot_sessions')
          .select('id, pilot_user_id, expires_at, is_active')
          .eq('session_token', pilotSessionCookie)
          .eq('is_active', true)
          .single()

        if (!error && session) {
          const expiresAt = new Date(session.expires_at)

          // Check if session is still valid
          if (expiresAt > new Date()) {
            // Verify pilot is still approved
            const { data: pilotUser } = await supabase
              .from('pilot_users')
              .select('id, registration_approved')
              .eq('id', session.pilot_user_id)
              .single()

            if (pilotUser && pilotUser.registration_approved === true) {
              // Valid custom session - allow access
              return response
            }
          }
        }
      } catch {
        // Fall through to Supabase Auth check
      }
    }

    // Fall back to Supabase Auth (for legacy pilots with auth_user_id)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: pilotUser } = await supabase
      .from('pilot_users')
      .select('id, registration_approved')
      .eq('auth_user_id', user.id)
      .single()

    if (!pilotUser || pilotUser.registration_approved !== true) {
      return NextResponse.json({ error: 'Unauthorized - Pilot access required' }, { status: 403 })
    }

    return response
  }

  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    // Admin API routes - verify admin access
    // Check for custom admin session first (bcrypt authentication)
    const adminApiSessionToken = request.cookies.get('admin-session')?.value

    if (adminApiSessionToken) {
      try {
        // Validate token against admin_sessions table
        const { data: session, error } = await supabase
          .from('admin_sessions')
          .select('id, admin_user_id, expires_at, is_active')
          .eq('session_token', adminApiSessionToken)
          .eq('is_active', true)
          .single()

        if (!error && session) {
          const expiresAt = new Date(session.expires_at)

          // Check if session is still valid
          if (expiresAt > new Date()) {
            // Verify admin user exists
            const { data: adminUser } = await supabase
              .from('an_users')
              .select('id, email, role')
              .eq('id', session.admin_user_id)
              .single()

            if (adminUser) {
              // Valid custom session - allow access
              return response
            }
          }
        }
      } catch {
        // Fall through to Supabase Auth check
      }
    }

    // Fall back to Supabase Auth check
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminUser } = await supabase
      .from('an_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    return response
  }

  // All other routes - allow
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
