// Maurice Rondeau — Published Roster Detail API
// GET: Roster with assignments | DELETE: Remove roster

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { revalidatePath } from 'next/cache'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import {
  deletePublishedRoster,
  getPublishedRosterById,
} from '@/lib/services/published-roster-service'

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
    const result = await getPublishedRosterById(id)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      source: 'api/published-rosters/[id]/GET',
      severity: ErrorSeverity.HIGH,
    })
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. CSRF validation first (per security pipeline)
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    // 2. Admin authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { success } = await authRateLimit.limit(auth.userId!)
    if (!success) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 })
    }

    const { id } = await params

    const result = await deletePublishedRoster(id)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    revalidatePath('/dashboard/published-rosters')

    return NextResponse.json({ success: true })
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      source: 'api/published-rosters/[id]/DELETE',
      severity: ErrorSeverity.HIGH,
    })
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
