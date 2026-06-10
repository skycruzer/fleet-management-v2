/**
 * Check Types API Route
 * Handles listing all check types for certification forms
 *
 * Updated: 2025-10-22 - Refactored to use service layer pattern
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { getCheckTypes } from '@/lib/services/check-types-service'

/**
 * GET /api/check-types
 * List all check types
 *
 * Query params:
 * - includeCategories=true: Also return distinct categories list
 *
 * Uses service layer for database operations (check-types-service.ts)
 */
export const GET = createAdminRoute(
  {
    operation: 'getCheckTypes',
    endpoint: '/api/check-types',
    rateLimit: false,
  },
  async ({ request }) => {
    try {
      // Fetch check types using service layer
      const checkTypes = await getCheckTypes()

      // Check if categories should be included
      const includeCategories = request.nextUrl.searchParams.get('includeCategories') === 'true'

      // Extract distinct categories if requested
      let categories: string[] = []
      if (includeCategories) {
        const categorySet = new Set<string>()
        checkTypes?.forEach((ct) => {
          if (ct.category) {
            categorySet.add(ct.category)
          }
        })
        categories = Array.from(categorySet).sort()
      }

      return NextResponse.json({
        success: true,
        data: checkTypes,
        count: checkTypes?.length || 0,
        ...(includeCategories && { categories }),
      })
    } catch (error) {
      console.error('GET /api/check-types error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch check types',
        },
        { status: 500 }
      )
    }
  }
)
