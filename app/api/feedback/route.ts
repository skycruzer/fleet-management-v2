/**
 * Admin Feedback API Endpoint
 *
 * Handles admin operations for pilot feedback management.
 *
 * @route GET /api/feedback - Get all feedback with filters
 * @route GET /api/feedback?export=csv - Export feedback to CSV
 * @route GET /api/feedback?stats=true - Get feedback statistics
 * @auth Admin Supabase Authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAllFeedback,
  getFeedbackStats,
  exportFeedbackToCSV,
  type FeedbackFilters,
} from '@/lib/services/feedback-service'

/**
 * GET /api/feedback
 *
 * Returns all pilot feedback with optional filters
 *
 * Query Params:
 * - status: PENDING | REVIEWED | RESOLVED | DISMISSED | all
 * - category: GENERAL | OPERATIONS | SAFETY | TRAINING | SCHEDULING | SYSTEM_IT | OTHER
 * - search: Search in subject/message
 * - startDate: Filter by start date (ISO string)
 * - endDate: Filter by end date (ISO string)
 * - export: csv (triggers CSV export)
 * - stats: true (returns statistics instead of data)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🌐 [API GET /api/feedback] Request received')

    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('❌ [API] Unauthorized access attempt')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const exportFormat = searchParams.get('export')
    const getStats = searchParams.get('stats') === 'true'

    // Handle CSV export
    if (exportFormat === 'csv') {
      const filters: FeedbackFilters = {
        status: (searchParams.get('status') as FeedbackFilters['status']) || 'all',
        category: searchParams.get('category') || undefined,
        search: searchParams.get('search') || undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
      }

      const result = await exportFeedbackToCSV(filters)

      if (!result.success || !result.data) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
      }

      // Return CSV file
      return new NextResponse(result.data, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="feedback-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // Handle statistics request
    if (getStats) {
      const result = await getFeedbackStats()

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: result.data,
      })
    }

    // Handle normal feedback list request
    const filters: FeedbackFilters = {
      status: (searchParams.get('status') as FeedbackFilters['status']) || 'all',
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    }

    const result = await getAllFeedback(filters)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      count: result.data?.length || 0,
    })
  } catch (error) {
    console.error('❌ [API] Error in GET /api/feedback:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
