// Maurice Rondeau — Activity Codes API
// GET: List all activity codes with categories
// @updated 2026-06-10 - Migrated to createAdminRoute factory

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { getActivityCodes } from '@/lib/services/activity-code-service'

export const GET = createAdminRoute(
  {
    operation: 'getActivityCodes',
    endpoint: '/api/activity-codes',
  },
  async () => {
    try {
      const codes = await getActivityCodes()

      return NextResponse.json({ success: true, data: codes })
    } catch (error) {
      console.error('Activity codes GET error:', error)
      return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
    }
  }
)
