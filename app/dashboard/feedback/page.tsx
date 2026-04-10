/**
 * Feedback Management Page
 * Review and manage pilot feedback
 *
 * @author Maurice Rondeau
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getAllFeedback, getFeedbackStats } from '@/lib/services/feedback-service'
import { FeedbackDashboardClient } from '@/components/admin/feedback-dashboard-client'
import { Breadcrumb } from '@/components/navigation/breadcrumb'

export const metadata: Metadata = {
  title: 'Pilot Feedback | Fleet Management',
  description: 'Review and manage pilot feedback',
}

export default async function FeedbackPage() {
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  const [feedbackResult, statsResult] = await Promise.all([
    getAllFeedback({ status: 'all' }),
    getFeedbackStats(),
  ])

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
    <div className="space-y-6">
      <Breadcrumb />
      <div>
        <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
          Pilot Feedback
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Review and manage pilot feedback submissions
        </p>
      </div>
      <FeedbackDashboardClient
        initialFeedback={initialFeedback}
        initialStats={initialStats}
        currentUserId={auth.userId || ''}
        currentUserName={auth.email?.split('@')[0] || 'Admin'}
      />
    </div>
  )
}
