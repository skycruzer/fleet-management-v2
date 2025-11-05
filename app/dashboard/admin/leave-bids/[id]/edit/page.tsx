/**
 * Leave Bid Edit Page
 * Allows administrators to edit leave bid details and status
 */

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { LeaveBidEditForm } from '@/components/admin/leave-bid-edit-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LeaveBidEditPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

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
      <LeaveBidEditForm bid={typedBid} userId={user.id} />
    </div>
  )
}
