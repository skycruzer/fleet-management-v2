// Maurice Rondeau — Published Rosters API
// GET: List rosters | POST: Upload + parse roster PDF

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { revalidatePath } from 'next/cache'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import {
  getPublishedRosters,
  uploadPublishedRoster,
} from '@/lib/services/published-roster-service'

// Maximum roster file size: 50MB
const MAX_ROSTER_FILE_SIZE = 50 * 1024 * 1024

// GET handler temporarily disabled - incomplete implementation
/*
export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Single roster lookup by period code (e.g., ?period=RP03/2026)
    const periodParam = searchParams.get('period')
    if (periodParam) {
      const rosterWithAssignments = await getRosterWithAssignments(periodParam)
      if (!rosterWithAssignments) {
        return NextResponse.json({ success: false, error: 'Roster not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: rosterWithAssignments })
    }

    // List all rosters, optionally filtered by year
    const yearParam = searchParams.get('year')
    let yearFilter: number | undefined
    if (yearParam) {
      yearFilter = parseInt(yearParam, 10)
      if (isNaN(yearFilter) || yearFilter < 2000 || yearFilter > 2100) {
        return NextResponse.json(
          { success: false, error: 'Invalid year parameter' },
          { status: 400 }
        )
      }
    }

    const rosters = await getPublishedRosters(yearFilter ? { year: yearFilter } : undefined)

    return NextResponse.json({ success: true, data: rosters })
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      source: 'api/published-rosters/GET',
      severity: ErrorSeverity.HIGH,
    })
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
})
*/

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // 1. CSRF validation first (per security pipeline)
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    // 2. Admin authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Parse and validate input
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are accepted' },
        { status: 400 }
      )
    }

    if (file.size > MAX_ROSTER_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File exceeds 10MB size limit' },
        { status: 400 }
      )
    }

    // 4. Business logic
    const rosterPeriodCode = formData.get('periodCode') as string | null
    if (!rosterPeriodCode) {
      return NextResponse.json(
        { success: false, error: 'Roster period code is required' },
        { status: 400 }
      )
    }

    const result = await uploadPublishedRoster(file, rosterPeriodCode, auth.userId!)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    revalidatePath('/dashboard/published-rosters')

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 201 }
    )
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      source: 'api/published-rosters/POST',
      severity: ErrorSeverity.HIGH,
    })
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})
