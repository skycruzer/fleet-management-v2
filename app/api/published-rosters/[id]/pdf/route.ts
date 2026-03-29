// Maurice Rondeau — Published Roster PDF Signed URL API
// GET: Returns a temporary signed URL for PDF download/viewing

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { authRateLimit } from '@/lib/rate-limit'
import { getSignedPdfUrl } from '@/lib/services/published-roster-service'
import { logError } from '@/lib/utils/logger'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { success } = await authRateLimit.limit(auth.userId!)
    if (!success) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 })
    }

    const { id } = await params
    const result = await getSignedPdfUrl(id)

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'PDF not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: { url: result.data } })
  } catch (error) {
    logError('Published roster PDF GET error', error, { route: '/api/published-rosters/[id]/pdf' })
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
