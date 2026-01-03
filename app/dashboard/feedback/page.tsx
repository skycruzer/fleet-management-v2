/**
 * Feedback Admin Dashboard
 * Admin view for reviewing pilot feedback submissions
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getAllFeedback, getFeedbackStats } from '@/lib/services/feedback-service'
import { FeedbackDashboardClient } from '@/components/admin/feedback-dashboard-client'

export const metadata: Metadata = {
  title: 'Pilot Feedback | Fleet Management',
  description: 'Review pilot feedback submissions',
}

export default async function FeedbackAdminPage() {
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  // Fetch initial feedback and stats server-side
  const feedbackResult = await getAllFeedback({ status: 'all' })
  const statsResult = await getFeedbackStats()

  const initialFeedback = feedbackResult.success ? feedbackResult.data || [] : []
  const initialStats = statsResult.success
    ? statsResult.data || {
        total: 0,
        pending: 0,
        reviewed: 0,
        resolved: 0,
        dismissed: 0,
        byCategory: {},
      }
    : {
        total: 0,
        pending: 0,
        reviewed: 0,
        resolved: 0,
        dismissed: 0,
        byCategory: {},
      }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pilot Feedback Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Review and respond to pilot feedback submissions
        </p>
      </div>

      <FeedbackDashboardClient initialFeedback={initialFeedback} initialStats={initialStats} />
    </div>
  )
}
