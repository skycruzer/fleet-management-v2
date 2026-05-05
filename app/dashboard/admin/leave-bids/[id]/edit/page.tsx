/**
 * Leave Bid Edit Page
 * Allows administrators to edit leave bid details and status
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { LeaveBidEditForm } from '@/components/admin/leave-bid-edit-form'
import { getAffectedRosterPeriods } from '@/lib/utils/roster-utils'
import type {
  AdminLeaveBid,
  EnrichedLeaveBidOption,
  LeaveBidOption,
  PreferredDateEntry,
  RawAdminLeaveBid,
} from '@/lib/types/admin-leave-bid'

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

  const supabase = createAdminClient()

  // Fetch leave bid with all related data
  const { data: rawBid, error } = await supabase
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
      preferred_dates,
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

  if (error || !rawBid) {
    notFound()
  }

  const typedRawBid = rawBid as unknown as RawAdminLeaveBid

  // Normalize options: portal submissions store dates in preferred_dates JSON
  let options: LeaveBidOption[] = typedRawBid.leave_bid_options ?? []
  if (options.length === 0 && typedRawBid.preferred_dates) {
    try {
      const parsed =
        typeof typedRawBid.preferred_dates === 'string'
          ? JSON.parse(typedRawBid.preferred_dates)
          : typedRawBid.preferred_dates
      if (Array.isArray(parsed)) {
        options = (parsed as PreferredDateEntry[]).map((item, index) => ({
          id: `${typedRawBid.id}-opt-${index}`,
          priority: item.priority ?? index + 1,
          start_date: item.start_date,
          end_date: item.end_date,
        }))
      }
    } catch {
      // Invalid JSON — leave options empty
    }
  }

  // Enrich each option with roster period codes
  const enrichedOptions: EnrichedLeaveBidOption[] = options.map((opt) => ({
    ...opt,
    roster_periods: getAffectedRosterPeriods(new Date(opt.start_date), new Date(opt.end_date)).map(
      (rp) => rp.code
    ),
  }))

  if (!typedRawBid.pilots) {
    notFound()
  }

  const typedBid: AdminLeaveBid & { pilots: NonNullable<typeof typedRawBid.pilots> } = {
    ...typedRawBid,
    pilots: typedRawBid.pilots,
    leave_bid_options: enrichedOptions,
  }

  return (
    <div className="space-y-6">
      <LeaveBidEditForm bid={typedBid} userId={auth.userId!} />
    </div>
  )
}
