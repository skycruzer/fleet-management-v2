import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js Middleware
 *
 * Handles:
 * - Supabase session management and refresh
 * - Rate limiting for authentication endpoints
 * - Protected route enforcement (admin dashboard + pilot portal)
 * - Role-based routing (pilots → portal, admins → dashboard)
 * - Dual authentication (Supabase Auth for admins, custom auth for pilots)
 *
 * This middleware runs on every request except static files and images.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 * @see /lib/supabase/middleware.ts for implementation details
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

/**
 * Middleware Configuration
 *
 * Runs on all routes EXCEPT:
 * - _next/static (Next.js static files)
 * - _next/image (Next.js image optimization)
 * - favicon.ico (browser favicon)
 * - Images (svg, png, jpg, jpeg, gif, webp)
 * - Service worker files (sw.js, workbox-*.js)
 * - PWA manifest and icons
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Images (svg, png, jpg, jpeg, gif, webp)
     * - Service worker and PWA files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|sw.js|workbox-.*\\.js|manifest.json|icons/).*)',
  ],
}
