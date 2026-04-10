// Maurice Rondeau — Activity Codes API
// GET: List all activity codes with categories

import { NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { getActivityCodes } from '@/lib/services/activity-code-service'

export const GET = withRateLimit(async () => {
  try {
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const codes = await getActivityCodes()

    return NextResponse.json({ success: true, data: codes })
  } catch (error) {
    console.error('Activity codes GET error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
})
