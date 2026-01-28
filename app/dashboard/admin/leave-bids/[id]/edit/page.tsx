/**
 * Leave Bid Edit Page
 * Allows administrators to edit leave bid details and status
 */

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { LeaveBidEditForm } from '@/components/admin/leave-bid-edit-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LeaveBidEditPage({ params }: PageProps) {
  const { id } = await params

  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  const supabase = await createClient()

  // Fetch leave bid with all related data
  const { data: bid, error } = await supabase
    .from('leave_bids')
    .select(
      `
      id,
      roster_period_code,
      status,
      created_at,
      updated_at,
      reviewed_at,
      review_comments,
      notes,
      reason,
      pilot_id,
      pilots (
        id,
        first_name,
        last_name,
        middle_name,
        employee_id,
        role,
        seniority_number,
        email
      ),
      leave_bid_options (
        id,
        priority,
        start_date,
        end_date
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !bid) {
    notFound()
  }

  // Type assertion for the bid data
  const typedBid = bid as any

  return (
    <div className="container mx-auto space-y-6 p-6">
      <LeaveBidEditForm bid={typedBid} userId={auth.userId!} />
    </div>
  )
}
