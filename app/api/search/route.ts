/**
 * Search API Endpoint
 * Unified search across pilots, certifications, and requests
 *
 * Developer: Maurice Rondeau
 *
 * @version 1.1.0
 * @since 2026-02
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { searchPilots } from '@/lib/services/pilot-service'

/**
 * GET /api/search?q=<query>
 * Search pilots by name or employee ID
 * Returns up to 5 results in a unified format
 */
export const GET = createAdminRoute(
  {
    operation: 'search',
    endpoint: '/api/search',
    rateLimit: false,
  },
  async ({ request }) => {
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
)
