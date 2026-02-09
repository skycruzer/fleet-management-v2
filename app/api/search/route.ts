/**
 * Search API Endpoint
 * Unified search across pilots, certifications, and requests
 *
 * Developer: Maurice Rondeau
 *
 * @version 1.0.0
 * @since 2026-02
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { unauthorizedResponse } from '@/lib/utils/api-response-helper'
import { searchPilots } from '@/lib/services/pilot-service'

/**
 * GET /api/search?q=<query>
 * Search pilots by name or employee ID
 * Returns up to 5 results in a unified format
 */
export async function GET(request: NextRequest) {
  // Auth check (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()

  if (!auth.authenticated) {
    return unauthorizedResponse()
  }

  const query = request.nextUrl.searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    // Search pilots using the existing service function
    const pilots = await searchPilots(query, {})

    // Map to unified search result format, limit to 5 results
    const results = pilots.slice(0, 5).map((p) => ({
      id: `pilot-${p.id}`,
      title: `${p.first_name} ${p.last_name}`,
      subtitle: `${p.role || 'Pilot'}${p.employee_id ? ` — ${p.employee_id}` : ''}`,
      type: 'pilot' as const,
      href: `/dashboard/pilots/${p.id}`,
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ results: [] })
  }
}
