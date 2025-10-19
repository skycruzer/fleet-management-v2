/**
 * Pilot Portal Service
 * Handles pilot self-service operations including leave requests, flight requests, and certifications
 */

import { createClient } from '@/lib/supabase/server'
import { unstable_cache, revalidateTag } from 'next/cache'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface PilotUser {
  id: string
  employee_id: string | null
  email: string
  first_name: string
  last_name: string
  rank: 'Captain' | 'First Officer' | null
  seniority_number: number | null
  seniority: number | null // Alias for seniority_number
  registration_approved: boolean
  last_login_at: string | null
  created_at: string | null
  updated_at: string | null
  approved_at: string | null
  approved_by: string | null
}

export interface PilotDashboardStats {
  totalLeaveRequests: number
  pendingLeaveRequests: number
  approvedLeaveRequests: number
  totalLeaveDays: number
  activeCertifications: number
  expiringCertifications: number
  expiredCertifications: number
  upcomingFlights: number
}

export interface PilotCertification {
  id: string
  check_type: {
    check_code: string
    check_description: string
    category: string | null
  }
  expiry_date: string | null
  status: {
    color: 'red' | 'yellow' | 'green'
    label: string
    daysUntilExpiry: number
  }
  created_at: string
}

export interface PilotLeaveRequest {
  id: string
  request_type: string | null
  start_date: string
  end_date: string
  days_count: number
  roster_period: string | null
  status: string | null
  reason: string | null
  created_at: string | null
  reviewed_at: string | null
  review_comments: string | null
}

export interface PilotFlightRequest {
  id: string
  request_type: string | null
  flight_date: string
  description: string
  reason: string | null
  route: string | null // Optional route field
  flight_number: string | null // Optional flight number field
  status: string | null
  created_at: string | null
  reviewed_at: string | null
  reviewer_comments: string | null
}

export interface FeedbackCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
}

export interface FeedbackPost {
  id: string
  pilot_user_id: string | null
  title: string
  content: string
  author_display_name: string
  author_rank: string | null
  category_id: string | null
  is_anonymous: boolean | null
  status: string | null
  comment_count: number | null
  created_at: string | null
  category: FeedbackCategory | null | undefined
}

export interface PaginatedFeedbackPosts {
  posts: FeedbackPost[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get pilot_id from pilot_user_id using the pilot_user_mappings view
 * This eliminates the N+1 query pattern by using a single query
 * @param pilotUserId - The pilot_user.id
 * @returns pilot_id or null if not found
 */
async function getPilotIdFromPilotUserId(pilotUserId: string): Promise<string | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('pilot_user_mappings')
      .select('pilot_id')
      .eq('pilot_user_id', pilotUserId)
      .single()

    if (error) {
      // Log error type only, no user IDs
      console.error('Error fetching pilot_id from pilot_user_mappings:', {
        errorCode: error.code,
        errorMessage: error.message
      })
      return null
    }

    return data?.pilot_id || null
  } catch (error) {
    // Log error type only, no user data
    console.error('Error in getPilotIdFromPilotUserId:', {
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    })
    return null
  }
}

// ============================================================================
// PILOT USER OPERATIONS
// ============================================================================

/**
 * Get current pilot user from Supabase auth
 * CACHED: 1 hour (user data rarely changes during session)
 */
export const getCurrentPilotUser = unstable_cache(
  async (): Promise<PilotUser | null> => {
    try {
      const supabase = await createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.email) return null

      const { data, error } = await supabase
        .from('pilot_users')
        .select('*')
        .eq('email', user.email)
        .single()

      if (error) {
        // Log error type only, no email or user data
        console.error('Error fetching pilot user:', {
          errorCode: error.code,
          errorMessage: error.message,
        })
        return null
      }

      return data
    } catch (error) {
      // Log error type only, no user data
      console.error('Error in getCurrentPilotUser:', {
        errorType: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      return null
    }
  },
  ['current-pilot-user'],
  {
    revalidate: 3600, // 1 hour
    tags: ['pilot-user'],
  }
)

/**
 * Get pilot dashboard statistics
 */
export async function getPilotDashboardStats(pilotUserId: string): Promise<PilotDashboardStats> {
  try {
    const supabase = await createClient()

    // Get pilot_id using the helper function (eliminates N+1 query)
    const pilot_id = await getPilotIdFromPilotUserId(pilotUserId)

    if (!pilot_id) {
      throw new Error('Pilot not found')
    }

    // Fetch all stats in parallel
    const [leaveRequests, certifications] = await Promise.all([
      supabase
        .from('leave_requests')
        .select('*')
        .eq('pilot_user_id', pilotUserId),
      supabase
        .from('pilot_checks')
        .select(
          `
          *,
          check_type:check_types(check_code, check_description, category)
        `
        )
        .eq('pilot_id', pilot_id),
    ])

    // Calculate leave stats
    const totalLeaveRequests = leaveRequests.data?.length || 0
    const pendingLeaveRequests =
      leaveRequests.data?.filter((r) => r.status === 'PENDING').length || 0
    const approvedLeaveRequests =
      leaveRequests.data?.filter((r) => r.status === 'APPROVED').length || 0
    const totalLeaveDays =
      leaveRequests.data?.reduce((sum, r) => sum + (r.days_count || 0), 0) || 0

    // Calculate certification stats
    const today = new Date()
    const certStats = {
      active: 0,
      expiring: 0,
      expired: 0,
    }

    certifications.data?.forEach((cert) => {
      if (!cert.expiry_date) return

      const expiryDate = new Date(cert.expiry_date)
      const daysUntilExpiry = Math.floor(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntilExpiry < 0) {
        certStats.expired++
      } else if (daysUntilExpiry <= 30) {
        certStats.expiring++
      } else {
        certStats.active++
      }
    })

    return {
      totalLeaveRequests,
      pendingLeaveRequests,
      approvedLeaveRequests,
      totalLeaveDays,
      activeCertifications: certStats.active,
      expiringCertifications: certStats.expiring,
      expiredCertifications: certStats.expired,
      upcomingFlights: 0, // TODO: Implement when flight schedule is available
    }
  } catch (error) {
    // Log error type only, no user IDs or stats data
    console.error('Error in getPilotDashboardStats:', {
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

// ============================================================================
// LEAVE REQUESTS
// ============================================================================

/**
 * Get all leave requests for current pilot
 * CACHED: 10 minutes (leave requests update moderately)
 */
export const getPilotLeaveRequests = (pilotUserId: string) =>
  unstable_cache(
    async (): Promise<PilotLeaveRequest[]> => {
      try {
        const supabase = await createClient()

        const { data, error } = await supabase
          .from('leave_requests')
          .select('*')
          .eq('pilot_user_id', pilotUserId)
          .order('created_at', { ascending: false })

        if (error) {
          // Log error type only, no user IDs or leave data
          console.error('Error fetching leave requests:', {
            errorCode: error.code,
            errorMessage: error.message,
          })
          throw new Error(`Failed to fetch leave requests: ${error.message}`)
        }

        return data || []
      } catch (error) {
        // Log error type only, no user data
        console.error('Error in getPilotLeaveRequests:', {
          errorType: error instanceof Error ? error.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
        throw error
      }
    },
    [`pilot-leave-requests-${pilotUserId}`],
    {
      revalidate: 600, // 10 minutes
      tags: ['leave-requests', `leave-requests-${pilotUserId}`],
    }
  )()

/**
 * Submit a new leave request (using transaction-wrapped database function)
 */
export async function submitLeaveRequest(
  pilotUserId: string,
  leaveRequest: {
    request_type: string
    start_date: string
    end_date: string
    days_count: number
    roster_period: string
    reason?: string
  }
): Promise<void> {
  try {
    const supabase = await createClient()

    // Use transaction-wrapped database function for atomic operation
    const { data, error } = await supabase.rpc('submit_leave_request_tx', {
      p_pilot_user_id: pilotUserId,
      p_request_type: leaveRequest.request_type,
      p_start_date: leaveRequest.start_date,
      p_end_date: leaveRequest.end_date,
      p_days_count: leaveRequest.days_count,
      p_roster_period: leaveRequest.roster_period,
      p_reason: leaveRequest.reason || null,
    })

    if (error) {
      // Log error type only, no leave request data (reasons may contain medical info)
      console.error('Error submitting leave request:', {
        errorCode: error.code,
        errorMessage: error.message
      })
      throw new Error(`Failed to submit leave request: ${error.message}`)
    }

    // Verify successful submission
    if (!data?.success) {
      throw new Error('Leave request submission failed')
    }

    // Invalidate leave requests cache for this pilot
    revalidateTag('leave-requests')
    revalidateTag(`leave-requests-${pilotUserId}`)
  } catch (error) {
    // Log error type only, no leave request data
    console.error('Error in submitLeaveRequest:', {
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

// ============================================================================
// FLIGHT REQUESTS
// ============================================================================

/**
 * Get all flight requests for current pilot
 * CACHED: 10 minutes (flight requests update moderately)
 */
export const getPilotFlightRequests = (pilotUserId: string) =>
  unstable_cache(
    async (): Promise<PilotFlightRequest[]> => {
      try {
        const supabase = await createClient()

        const { data, error } = await supabase
          .from('flight_requests')
          .select('*')
          .eq('pilot_user_id', pilotUserId)
          .order('created_at', { ascending: false })

        if (error) {
          // Log error type only, no user IDs or flight data
          console.error('Error fetching flight requests:', {
            errorCode: error.code,
            errorMessage: error.message,
          })
          throw new Error(`Failed to fetch flight requests: ${error.message}`)
        }

        return data || []
      } catch (error) {
        // Log error type only, no user data
        console.error('Error in getPilotFlightRequests:', {
          errorType: error instanceof Error ? error.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
        throw error
      }
    },
    [`pilot-flight-requests-${pilotUserId}`],
    {
      revalidate: 600, // 10 minutes
      tags: ['flight-requests', `flight-requests-${pilotUserId}`],
    }
  )()

/**
 * Submit a new flight request (using transaction-wrapped database function)
 */
export async function submitFlightRequest(
  pilotUserId: string,
  flightRequest: {
    request_type: string
    flight_date: string
    description: string
    reason?: string
  }
): Promise<void> {
  try {
    const supabase = await createClient()

    // Use transaction-wrapped database function for atomic operation
    const { data, error } = await supabase.rpc('submit_flight_request_tx', {
      p_pilot_user_id: pilotUserId,
      p_request_type: flightRequest.request_type,
      p_flight_date: flightRequest.flight_date,
      p_description: flightRequest.description,
      p_reason: flightRequest.reason || null,
    })

    if (error) {
      // Check if error is a unique constraint violation
      if (error.code === '23505' && error.message.includes('flight_requests_pilot_date_type_unique')) {
        const duplicateError = new Error(
          'A flight request for this date and type already exists. Please check your existing requests or select a different date.'
        )
        duplicateError.name = 'DuplicateFlightRequestError'
        throw duplicateError
      }

      // Log error type only, no flight request data (may contain sensitive reasons)
      console.error('Error submitting flight request:', {
        errorCode: error.code,
        errorMessage: error.message
      })
      throw new Error(`Failed to submit flight request: ${error.message}`)
    }

    // Verify successful submission
    if (!data?.success) {
      throw new Error('Flight request submission failed')
    }

    // Invalidate flight requests cache for this pilot
    revalidateTag('flight-requests')
    revalidateTag(`flight-requests-${pilotUserId}`)
  } catch (error) {
    // Re-throw duplicate errors without additional logging
    if (error instanceof Error && error.name === 'DuplicateFlightRequestError') {
      throw error
    }

    // Log error type only, no flight request data
    console.error('Error in submitFlightRequest:', {
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

// ============================================================================
// CERTIFICATIONS
// ============================================================================

/**
 * Get all certifications for current pilot
 */
export async function getPilotCertifications(
  pilotUserId: string
): Promise<PilotCertification[]> {
  try {
    const supabase = await createClient()

    // Get pilot_id using the helper function (eliminates N+1 query)
    const pilot_id = await getPilotIdFromPilotUserId(pilotUserId)

    if (!pilot_id) {
      throw new Error('Pilot not found')
    }

    const { data, error } = await supabase
      .from('pilot_checks')
      .select(
        `
        id,
        expiry_date,
        created_at,
        check_type:check_types(
          check_code,
          check_description,
          category
        )
      `
      )
      .eq('pilot_id', pilot_id)
      .order('expiry_date', { ascending: true })

    if (error) {
      // Log error type only, no user IDs or certification data
      console.error('Error fetching certifications:', {
        errorCode: error.code,
        errorMessage: error.message
      })
      throw new Error(`Failed to fetch certifications: ${error.message}`)
    }

    // Add status calculation
    const today = new Date()
    const certificationsWithStatus = (data || []).map((cert) => {
      let status = {
        color: 'green' as 'red' | 'yellow' | 'green',
        label: 'Current',
        daysUntilExpiry: 999,
      }

      if (cert.expiry_date) {
        const expiryDate = new Date(cert.expiry_date)
        const daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        status.daysUntilExpiry = daysUntilExpiry

        if (daysUntilExpiry < 0) {
          status = {
            color: 'red',
            label: 'Expired',
            daysUntilExpiry,
          }
        } else if (daysUntilExpiry <= 30) {
          status = {
            color: 'yellow',
            label: 'Expiring Soon',
            daysUntilExpiry,
          }
        } else {
          status = {
            color: 'green',
            label: 'Current',
            daysUntilExpiry,
          }
        }
      }

      return {
        ...cert,
        status,
      }
    })

    return certificationsWithStatus as PilotCertification[]
  } catch (error) {
    // Log error type only, no user data
    console.error('Error in getPilotCertifications:', {
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

// ============================================================================
// FEEDBACK
// ============================================================================

/**
 * Get all feedback categories (cached for 1 hour)
 */
export const getFeedbackCategories = unstable_cache(
  async (): Promise<FeedbackCategory[]> => {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('feedback_categories')
        .select('*')
        .eq('is_archived', false)
        .order('name')

      if (error) {
        // Log error type only, no category data
        console.error('Error fetching feedback categories:', {
          errorCode: error.code,
          errorMessage: error.message
        })
        throw new Error(`Failed to fetch feedback categories: ${error.message}`)
      }

      return data || []
    } catch (error) {
      // Log error type only, no category data
      console.error('Error in getFeedbackCategories:', {
        errorType: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  },
  ['feedback-categories'],
  {
    revalidate: 3600, // 1 hour
    tags: ['feedback-categories'],
  }
)

/**
 * Get feedback posts with pagination (cached for 5 minutes)
 * @param page - Page number (1-indexed, default: 1)
 * @param limit - Items per page (default: 20)
 */
export const getFeedbackPosts = async (
  page: number = 1,
  limit: number = 20
): Promise<PaginatedFeedbackPosts> => {
  return unstable_cache(
    async () => {
      try {
        const supabase = await createClient()

        // Calculate range for pagination
        const from = (page - 1) * limit
        const to = from + limit - 1

        // Get total count
        const { count, error: countError } = await supabase
          .from('feedback_posts')
          .select('*', { count: 'exact', head: true })

        if (countError) {
          // Log error type only, no post data
          console.error('Error counting feedback posts:', {
            errorCode: countError.code,
            errorMessage: countError.message
          })
          throw new Error(`Failed to count feedback posts: ${countError.message}`)
        }

        const total = count || 0
        const totalPages = Math.ceil(total / limit)

        // Get paginated data
        const { data, error } = await supabase
          .from('feedback_posts')
          .select(`
            *,
            category:feedback_categories(id, name, slug, description, icon)
          `)
          .order('created_at', { ascending: false })
          .range(from, to)

        if (error) {
          // Log error type only, no post content
          console.error('Error fetching feedback posts:', {
            errorCode: error.code,
            errorMessage: error.message
          })
          throw new Error(`Failed to fetch feedback posts: ${error.message}`)
        }

        return {
          posts: data || [],
          pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        }
      } catch (error) {
        // Log error type only, no post content
        console.error('Error in getFeedbackPosts:', {
          errorType: error instanceof Error ? error.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        })
        throw error
      }
    },
    [`feedback-posts-${page}-${limit}`],
    {
      revalidate: 300, // 5 minutes
      tags: ['feedback-posts'],
    }
  )()
}

/**
 * Submit a new feedback post (using transaction-wrapped database function)
 */
export async function submitFeedbackPost(
  pilotUserId: string,
  feedbackData: {
    title: string
    content: string
    category_id?: string
    is_anonymous?: boolean
    author_display_name: string
    author_rank: string
  }
): Promise<void> {
  try {
    const supabase = await createClient()

    // Use transaction-wrapped database function for atomic operation
    const { data, error } = await supabase.rpc('submit_feedback_post_tx', {
      p_pilot_user_id: pilotUserId,
      p_title: feedbackData.title,
      p_content: feedbackData.content,
      p_category_id: feedbackData.category_id || null,
      p_is_anonymous: feedbackData.is_anonymous || false,
      p_author_display_name: feedbackData.author_display_name,
      p_author_rank: feedbackData.author_rank,
    })

    if (error) {
      // Log error type only, no feedback content (may contain sensitive information)
      console.error('Error submitting feedback post:', {
        errorCode: error.code,
        errorMessage: error.message
      })
      throw new Error(`Failed to submit feedback post: ${error.message}`)
    }

    // Verify successful submission
    if (!data?.success) {
      throw new Error('Feedback post submission failed')
    }

    // Invalidate feedback posts cache
    revalidateTag('feedback-posts')
  } catch (error) {
    // Log error type only, no feedback content
    console.error('Error in submitFeedbackPost:', {
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}
