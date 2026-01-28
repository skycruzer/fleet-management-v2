/**
 * Help & Feedback Page - Consolidated
 * Tabs: FAQs | Pilot Feedback
 * Replaces separate /dashboard/faqs and /dashboard/feedback pages
 *
 * @author Maurice Rondeau
 * @version 1.0.0
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getAllFeedback, getFeedbackStats } from '@/lib/services/feedback-service'
import { HelpPageClient } from './help-page-client'

export const metadata: Metadata = {
  title: 'Help & Feedback | Fleet Management',
  description: 'FAQs and pilot feedback management',
}

export default async function HelpPage() {
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  // Fetch feedback data server-side
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

  return <HelpPageClient initialFeedback={initialFeedback} initialStats={initialStats} />
}
