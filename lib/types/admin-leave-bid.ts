/**
 * Shared types for the admin Leave Bid view/edit pages.
 *
 * The Supabase SELECT used in `app/dashboard/admin/leave-bids/[id]/page.tsx`
 * and `[id]/edit/page.tsx` joins `pilots` (single object) and
 * `leave_bid_options` (array). The pages also enrich each option with the
 * affected roster period codes after fetch.
 *
 * Defining the shapes here so both pages share one source of truth and we
 * can drop the `as any` casts that were papering over the join result.
 */

export interface LeaveBidPilot {
  id: string
  first_name: string | null
  last_name: string | null
  middle_name: string | null
  employee_id: string | null
  role: string | null
  seniority_number: number | null
  email: string | null
}

export interface LeaveBidOption {
  id: string
  priority: number
  start_date: string
  end_date: string
}

export interface EnrichedLeaveBidOption extends LeaveBidOption {
  roster_periods: string[]
}

/**
 * Shape returned by the Supabase SELECT in the admin leave-bid pages,
 * before option-enrichment.
 */
export interface RawAdminLeaveBid {
  id: string
  roster_period_code: string | null
  status: string | null
  created_at: string | null
  updated_at: string | null
  reviewed_at: string | null
  review_comments: string | null
  notes: string | null
  reason: string | null
  pilot_id: string
  preferred_dates: string | unknown[] | null
  pilots: LeaveBidPilot | null
  leave_bid_options: LeaveBidOption[] | null
}

/**
 * Shape consumed by the view/edit page UI after option enrichment.
 */
export interface AdminLeaveBid extends Omit<RawAdminLeaveBid, 'leave_bid_options'> {
  leave_bid_options: EnrichedLeaveBidOption[]
}

/**
 * Item shape stored inside the JSON `preferred_dates` column when a pilot
 * submits via the portal flow (vs the row-per-option `leave_bid_options`
 * table used by the new admin flow).
 */
export interface PreferredDateEntry {
  priority?: number
  start_date: string
  end_date: string
}
