/**
 * Portal Admin Service
 * Aggregates pilot portal user data with activity metrics for the admin dashboard.
 * Queries pilot_users, pilot_sessions, pilot_requests, leave_bids, and pilot_feedback
 * to provide a comprehensive view of portal user activity.
 *
 * @author Maurice Rondeau
 * @date February 2026
 */

import { createAdminClient } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PortalUserWithActivity {
  id: string
  first_name: string
  last_name: string
  email: string
  employee_id: string | null
  rank: string | null
  seniority_number: number | null
  registration_approved: boolean | null
  registration_date: string
  approved_at: string | null
  last_login_at: string | null
  must_change_password: boolean
  pilot_id: string | null
  // Activity counts
  login_count: number
  active_sessions: number
  total_requests: number
  leave_requests: number
  flight_requests: number
  leave_bids: number
  feedback_count: number
}

export interface PortalUsersFilters {
  status?: 'all' | 'approved' | 'pending' | 'denied'
  rank?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface PortalUsersResult {
  users: PortalUserWithActivity[]
  total: number
  error?: string
}

export interface PortalUsersSummary {
  total: number
  approved: number
  pending: number
  denied: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PAGE_SIZE = 25
const SORTABLE_COLUMNS = new Set([
  'first_name',
  'last_name',
  'email',
  'employee_id',
  'rank',
  'seniority_number',
  'registration_date',
  'approved_at',
  'last_login_at',
  'registration_approved',
])

// ---------------------------------------------------------------------------
// Main query
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated list of portal users enriched with activity counts.
 *
 * 1. Queries `pilot_users` with filters / pagination / sorting.
 * 2. Batch-fetches activity data from related tables for the returned page.
 * 3. Merges counts into each user record.
 */
export async function getPortalUsersWithActivity(
  filters: PortalUsersFilters = {}
): Promise<PortalUsersResult> {
  const supabase = createAdminClient()

  const {
    status = 'all',
    rank,
    search,
    sortBy = 'registration_date',
    sortOrder = 'desc',
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = filters

  // ── Build base query ────────────────────────────────────────────────
  let query = supabase.from('pilot_users').select('*', { count: 'exact' })

  // ── Status filter ───────────────────────────────────────────────────
  if (status === 'approved') {
    query = query.eq('registration_approved', true)
  } else if (status === 'pending') {
    query = query.is('registration_approved', null)
  } else if (status === 'denied') {
    query = query.eq('registration_approved', false)
  }

  // ── Rank filter ─────────────────────────────────────────────────────
  if (rank) {
    query = query.eq('rank', rank)
  }

  // ── Search filter (OR across multiple columns) ──────────────────────
  if (search) {
    const { sanitizeSearchTerm } = await import('@/lib/utils/search-sanitizer')
    const safe = sanitizeSearchTerm(search)
    if (safe) {
      const pattern = `%${safe}%`
      query = query.or(
        `first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},employee_id.ilike.${pattern}`
      )
    }
  }

  // ── Sorting ─────────────────────────────────────────────────────────
  const safeColumn = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'registration_date'
  query = query.order(safeColumn, { ascending: sortOrder === 'asc' })

  // ── Pagination ──────────────────────────────────────────────────────
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  // ── Execute ─────────────────────────────────────────────────────────
  const { data: users, count, error } = await query

  if (error) {
    return { users: [], total: 0, error: error.message }
  }

  if (!users || users.length === 0) {
    return { users: [], total: count ?? 0 }
  }

  // ── Batch-fetch activity data ───────────────────────────────────────
  const userIds = users.map((u) => u.id)
  const pilotIds = users.map((u) => u.pilot_id).filter((id): id is string => id !== null)

  const [sessions, requests, bids, feedback] = await Promise.all([
    fetchSessions(supabase, userIds),
    pilotIds.length > 0 ? fetchRequests(supabase, pilotIds) : Promise.resolve([]),
    pilotIds.length > 0 ? fetchLeaveBids(supabase, pilotIds) : Promise.resolve([]),
    pilotIds.length > 0 ? fetchFeedback(supabase, pilotIds) : Promise.resolve([]),
  ])

  // ── Build lookup maps ───────────────────────────────────────────────
  const now = new Date().toISOString()

  // Sessions keyed by pilot_user_id
  const loginCountMap = new Map<string, number>()
  const activeSessionMap = new Map<string, number>()
  for (const s of sessions) {
    loginCountMap.set(s.pilot_user_id, (loginCountMap.get(s.pilot_user_id) ?? 0) + 1)
    if (s.is_active && s.expires_at > now) {
      activeSessionMap.set(s.pilot_user_id, (activeSessionMap.get(s.pilot_user_id) ?? 0) + 1)
    }
  }

  // Requests keyed by pilot_id
  const leaveRequestMap = new Map<string, number>()
  const flightRequestMap = new Map<string, number>()
  for (const r of requests) {
    if (!r.pilot_id) continue
    if (r.request_category === 'LEAVE') {
      leaveRequestMap.set(r.pilot_id, (leaveRequestMap.get(r.pilot_id) ?? 0) + 1)
    } else if (r.request_category === 'FLIGHT') {
      flightRequestMap.set(r.pilot_id, (flightRequestMap.get(r.pilot_id) ?? 0) + 1)
    }
  }

  // Leave bids keyed by pilot_id
  const leaveBidMap = new Map<string, number>()
  for (const b of bids) {
    leaveBidMap.set(b.pilot_id, (leaveBidMap.get(b.pilot_id) ?? 0) + 1)
  }

  // Feedback keyed by pilot_id
  const feedbackMap = new Map<string, number>()
  for (const f of feedback) {
    feedbackMap.set(f.pilot_id, (feedbackMap.get(f.pilot_id) ?? 0) + 1)
  }

  // ── Merge into user records ─────────────────────────────────────────
  const enrichedUsers: PortalUserWithActivity[] = users.map((u) => {
    const leave = u.pilot_id ? (leaveRequestMap.get(u.pilot_id) ?? 0) : 0
    const flight = u.pilot_id ? (flightRequestMap.get(u.pilot_id) ?? 0) : 0

    return {
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      employee_id: u.employee_id,
      rank: u.rank,
      seniority_number: u.seniority_number,
      registration_approved: u.registration_approved,
      registration_date: u.registration_date ?? '',
      approved_at: u.approved_at,
      last_login_at: u.last_login_at,
      must_change_password: u.must_change_password ?? false,
      pilot_id: u.pilot_id,
      login_count: loginCountMap.get(u.id) ?? 0,
      active_sessions: activeSessionMap.get(u.id) ?? 0,
      total_requests: leave + flight,
      leave_requests: leave,
      flight_requests: flight,
      leave_bids: u.pilot_id ? (leaveBidMap.get(u.pilot_id) ?? 0) : 0,
      feedback_count: u.pilot_id ? (feedbackMap.get(u.pilot_id) ?? 0) : 0,
    }
  })

  return { users: enrichedUsers, total: count ?? 0 }
}

// ---------------------------------------------------------------------------
// Summary counts
// ---------------------------------------------------------------------------

/**
 * Quick aggregate counts for summary cards (total / approved / pending / denied).
 */
export async function getPortalUsersSummary(): Promise<PortalUsersSummary> {
  const supabase = createAdminClient()

  const [totalRes, approvedRes, pendingRes, deniedRes] = await Promise.all([
    supabase.from('pilot_users').select('*', { count: 'exact', head: true }),
    supabase
      .from('pilot_users')
      .select('id', { count: 'exact', head: true })
      .eq('registration_approved', true),
    supabase
      .from('pilot_users')
      .select('id', { count: 'exact', head: true })
      .is('registration_approved', null),
    supabase
      .from('pilot_users')
      .select('id', { count: 'exact', head: true })
      .eq('registration_approved', false),
  ])

  return {
    total: totalRes.count ?? 0,
    approved: approvedRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    denied: deniedRes.count ?? 0,
  }
}

// ---------------------------------------------------------------------------
// Batch-fetch helpers (private)
// ---------------------------------------------------------------------------

type SupabaseAdmin = ReturnType<typeof createAdminClient>

async function fetchSessions(supabase: SupabaseAdmin, userIds: string[]) {
  const { data, error } = await supabase
    .from('pilot_sessions')
    .select('*')
    .in('pilot_user_id', userIds)

  if (error) {
    console.error('[portal-admin-service] Failed to fetch sessions:', error.message)
    return []
  }
  return data ?? []
}

async function fetchRequests(supabase: SupabaseAdmin, pilotIds: string[]) {
  const { data, error } = await supabase.from('pilot_requests').select('*').in('pilot_id', pilotIds)

  if (error) {
    console.error('[portal-admin-service] Failed to fetch requests:', error.message)
    return []
  }
  return data ?? []
}

async function fetchLeaveBids(supabase: SupabaseAdmin, pilotIds: string[]) {
  const { data, error } = await supabase.from('leave_bids').select('*').in('pilot_id', pilotIds)

  if (error) {
    console.error('[portal-admin-service] Failed to fetch leave bids:', error.message)
    return []
  }
  return data ?? []
}

async function fetchFeedback(supabase: SupabaseAdmin, pilotIds: string[]) {
  const { data, error } = await supabase.from('pilot_feedback').select('*').in('pilot_id', pilotIds)

  if (error) {
    console.error('[portal-admin-service] Failed to fetch feedback:', error.message)
    return []
  }
  return data ?? []
}
