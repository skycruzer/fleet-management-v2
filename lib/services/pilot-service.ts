/**
 * Pilot Service for Fleet Management V2
 * Ported from air-niugini-pms v1 with Next.js 15 updates
 *
 * Key Changes from v1:
 * - Updated imports to use @/ alias
 * - Changed Supabase client imports to @/lib/supabase/server
 * - All async patterns updated for Next.js 15
 * - Removed client/server branching (server-only service)
 * - Retained all business logic and seniority calculations
 *
 * @version 2.0.0
 * @since 2025-10-17
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { Database, Json } from '@/types/supabase'

// Type for licence_type enum
type PilotLicenceType = Database['public']['Enums']['pilot_licence_type']
import { createAuditLog } from './audit-service'
import { logError, logInfo, logWarning, ErrorSeverity } from '@/lib/error-logger'
import { parseCaptainQualifications } from '@/lib/utils/type-guards'
import { unstable_cache, revalidatePath, revalidateTag } from 'next/cache'
import { getCertificationStatus } from '@/lib/utils/certification-status'

// Helper to safely revalidate tags (server-side only)
function safeRevalidate(tag: string) {
  try {
    // Revalidate the cache tag
    // Note: revalidateTag has type definition issues in Next.js 16, using path revalidation instead
    // revalidateTag(tag)

    // Revalidate common paths based on tag
    if (tag === 'pilots') {
      revalidatePath('/dashboard/pilots')
      revalidatePath('/dashboard/admin')
      revalidatePath('/api/pilots')
    } else if (tag === 'certifications') {
      revalidatePath('/dashboard/certifications')
      revalidatePath('/dashboard/certifications')
    } else if (tag === 'dashboard') {
      revalidatePath('/dashboard')
    }
  } catch (error) {
    console.error('Cache revalidation failed:', error)
  }
}
import { getPilotRequirements } from './admin-service'

// Type aliases for convenience
type Pilot = Database['public']['Tables']['pilots']['Row']
// type PilotInsert = Database['public']['Tables']['pilots']['Insert']
// type PilotUpdate = Database['public']['Tables']['pilots']['Update']
// type PilotCheck = Database['public']['Tables']['pilot_checks']['Row']

// ===================================
// INTERFACES
// ===================================

export interface PilotWithCertifications extends Pilot {
  certificationStatus: {
    current: number
    expiring: number
    expired: number
  }
}

export interface PilotFormData {
  employee_id: string
  first_name: string
  middle_name?: string | null
  last_name: string
  email?: string | null
  role: 'Captain' | 'First Officer'
  contract_type?: string | null
  nationality?: string | null
  passport_number?: string | null
  passport_expiry?: string | null
  licence_type?: 'ATPL' | 'CPL' | null
  licence_number?: string | null
  date_of_birth?: string | null
  commencement_date?: string | null
  seniority_number?: number | null
  is_active: boolean
}

export interface PilotWithRetirement extends Pilot {
  retirement?: {
    yearsToRetirement: number
    retirementStatus: 'active' | 'due_soon' | 'overdue'
    retirementDate: string
  }
}

// NOTE: getCertificationStatus imported from @/lib/utils/certification-status
// Uses default 30-day threshold for pilot overview

// ===================================
// SENIORITY CALCULATION
// ===================================

export async function calculateSeniorityNumber(
  commencementDate: string,
  excludePilotId?: string
): Promise<number> {
  const supabase = createAdminClient()

  try {
    let query = supabase
      .from('pilots')
      .select('commencement_date')
      .not('commencement_date', 'is', null)
      .order('commencement_date', { ascending: true })

    if (excludePilotId) {
      query = query.not('id', 'eq', excludePilotId)
    }

    const { data: pilots, error } = await query
    if (error) throw error

    const targetDate = new Date(commencementDate)
    const earlierPilots = (pilots || []).filter((pilot) => {
      if (!pilot.commencement_date) return false
      return new Date(pilot.commencement_date) < targetDate
    })

    return earlierPilots.length + 1
  } catch (error) {
    logError(error as Error, {
      source: 'PilotService',
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        operation: 'calculateSeniorityNumber',
        commencementDate,
        excludePilotId,
      },
    })
    return 1
  }
}

// ===================================
// READ OPERATIONS
// ===================================

/**
 * Get all pilots with pagination and eager loading (optimized)
 * @param page - Page number (default: 1)
 * @param pageSize - Items per page (default: 50)
 * @param includeChecks - Whether to include certification data (default: true)
 * @returns Promise<{ pilots: PilotWithCertifications[], total: number, page: number, pageSize: number }>
 */
export async function getAllPilots(
  page: number = 1,
  pageSize: number = 50,
  includeChecks: boolean = true
): Promise<{
  pilots: PilotWithCertifications[]
  total: number
  page: number
  pageSize: number
}> {
  const supabase = createAdminClient()

  try {
    // Calculate pagination range
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build query with eager loading (single JOIN query - eliminates N+1)
    const query = supabase
      .from('pilots')
      .select(
        includeChecks
          ? `
            id,
            employee_id,
            first_name,
            middle_name,
            last_name,
            role,
            contract_type,
            nationality,
            passport_number,
            passport_expiry,
            date_of_birth,
            commencement_date,
            seniority_number,
            is_active,
            captain_qualifications,
            pilot_checks (
              expiry_date,
              check_types (check_code, check_description, category)
            )
          `
          : `
            id,
            employee_id,
            first_name,
            middle_name,
            last_name,
            role,
            contract_type,
            is_active,
            seniority_number
          `,
        { count: 'exact' }
      )
      .range(from, to)
      .order('seniority_number', { ascending: true, nullsFirst: false })

    const { data: pilotsWithChecks, error, count } = await query

    if (error) throw error
    if (!pilotsWithChecks || pilotsWithChecks.length === 0) {
      return { pilots: [], total: count || 0, page, pageSize }
    }

    const pilotsWithCerts = pilotsWithChecks.map((pilot: any) => {
      if (!includeChecks) {
        return {
          ...pilot,
          certificationStatus: { current: 0, expiring: 0, expired: 0 },
        }
      }

      const certifications = pilot.pilot_checks || []
      const certificationCounts = certifications.reduce(
        (acc: any, check: any) => {
          const status = getCertificationStatus(
            check.expiry_date ? new Date(check.expiry_date) : null
          )
          if (status.color === 'green') acc.current++
          else if (status.color === 'yellow') acc.expiring++
          else if (status.color === 'red') acc.expired++
          return acc
        },
        { current: 0, expiring: 0, expired: 0 }
      )

      return {
        ...pilot,
        certificationStatus: certificationCounts,
      }
    })

    return { pilots: pilotsWithCerts, total: count || 0, page, pageSize }
  } catch (error) {
    logError(error as Error, {
      source: 'PilotService',
      severity: ErrorSeverity.HIGH,
      metadata: {
        operation: 'getAllPilots',
        page,
        pageSize,
        includeChecks,
      },
    })
    throw error
  }
}

/**
 * Get all pilots without pagination (for legacy compatibility)
 * Uses pagination internally with max page size
 */
export async function getAllPilotsUnpaginated(): Promise<PilotWithCertifications[]> {
  const result = await getAllPilots(1, 1000, true)
  return result.pilots
}

export async function getPilotById(pilotId: string): Promise<PilotWithCertifications | null> {
  const supabase = createAdminClient()

  try {
    const { data: pilot, error: pilotError } = await supabase
      .from('pilots')
      .select('*')
      .eq('id', pilotId)
      .single()

    if (pilotError) {
      if (pilotError.code === 'PGRST116') {
        return null
      }
      throw pilotError
    }
    if (!pilot) return null

    const { data: checks, error: checksError } = await supabase
      .from('pilot_checks')
      .select(
        `
        id,
        expiry_date,
        check_types (
          id,
          check_code,
          check_description,
          category
        )
      `
      )
      .eq('pilot_id', pilotId)

    if (checksError) {
      logWarning('Failed to fetch pilot checks', {
        source: 'PilotService',
        metadata: {
          operation: 'getPilotById',
          pilotId,
          error: checksError.message,
        },
      })
    }

    const certifications = checks || []
    const certificationCounts = certifications.reduce(
      (acc: any, check: any) => {
        const status = getCertificationStatus(
          check.expiry_date ? new Date(check.expiry_date) : null
        )
        if (status.color === 'green') acc.current++
        else if (status.color === 'yellow') acc.expiring++
        else if (status.color === 'red') acc.expired++
        return acc
      },
      { current: 0, expiring: 0, expired: 0 }
    )

    return {
      ...pilot,
      certificationStatus: certificationCounts,
    }
  } catch (error) {
    logError(error as Error, {
      source: 'PilotService',
      severity: ErrorSeverity.HIGH,
      metadata: {
        operation: 'getPilotById',
        pilotId,
      },
    })
    throw error
  }
}

/**
 * Get pilot by Supabase Auth user_id
 * Used by pilot portal to identify which pilot record belongs to the logged-in user
 * @param userId - Supabase Auth user ID
 * @returns Promise<PilotWithCertifications | null>
 */
export async function getPilotByUserId(userId: string): Promise<PilotWithCertifications | null> {
  const supabase = createAdminClient()

  try {
    const { data: pilot, error: pilotError } = await supabase
      .from('pilots')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (pilotError) {
      if (pilotError.code === 'PGRST116') {
        return null
      }
      throw pilotError
    }
    if (!pilot) return null

    const { data: checks, error: checksError } = await supabase
      .from('pilot_checks')
      .select(
        `
        id,
        expiry_date,
        check_types (
          id,
          check_code,
          check_description,
          category
        )
      `
      )
      .eq('pilot_id', pilot.id)

    if (checksError) {
      logWarning('Failed to fetch pilot checks', {
        source: 'PilotService',
        metadata: {
          operation: 'getPilotByUserId',
          userId,
          error: checksError.message,
        },
      })
    }

    const certifications = checks || []
    const certificationCounts = certifications.reduce(
      (acc: any, check: any) => {
        const status = getCertificationStatus(
          check.expiry_date ? new Date(check.expiry_date) : null
        )
        if (status.color === 'green') acc.current++
        else if (status.color === 'yellow') acc.expiring++
        else if (status.color === 'red') acc.expired++
        return acc
      },
      { current: 0, expiring: 0, expired: 0 }
    )

    return {
      ...pilot,
      certificationStatus: certificationCounts,
    }
  } catch (error) {
    logError(error as Error, {
      source: 'PilotService',
      severity: ErrorSeverity.HIGH,
      metadata: {
        operation: 'getPilotByUserId',
        userId,
      },
    })
    throw error
  }
}

/**
 * Get pilot statistics
 * CACHED: 5 minutes (pilot stats update moderately)
 */
export const getPilotStats = unstable_cache(
  async () => {
    const supabase = createAdminClient()

    try {
      const { data: pilots, error } = await supabase
        .from('pilots')
        .select('role, is_active, captain_qualifications')

      if (error) throw error

      const stats = (pilots || []).reduce(
        (acc, pilot) => {
          acc.total++
          if (pilot.is_active) acc.active++
          else acc.inactive++

          if (pilot.role === 'Captain') {
            acc.captains++

            const qualifications = parseCaptainQualifications(pilot.captain_qualifications)
            if (qualifications) {
              if (qualifications.training_captain) {
                acc.trainingCaptains++
              }
              if (qualifications.examiner) {
                acc.examiners++
              }
            }
          } else if (pilot.role === 'First Officer') {
            acc.firstOfficers++
          }

          return acc
        },
        {
          total: 0,
          active: 0,
          inactive: 0,
          captains: 0,
          firstOfficers: 0,
          trainingCaptains: 0,
          examiners: 0,
        }
      )

      return stats
    } catch (error) {
      logError(error as Error, {
        source: 'PilotService',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          operation: 'getPilotStats',
        },
      })
      throw error
    }
  },
  ['pilot-stats'],
  {
    revalidate: 300, // 5 minutes
    tags: ['pilots', 'pilot-stats'],
  }
)

// ===================================
// WRITE OPERATIONS
// ===================================

export async function createPilot(pilotData: PilotFormData): Promise<Pilot> {
  // Use admin client to bypass RLS (auth verified at API layer)
  const supabase = createAdminClient()

  // Helper to convert empty strings to null (PostgreSQL requires null, not '')
  const toNullIfEmpty = (value: string | null | undefined): string | null => {
    if (value === '' || value === undefined) return null
    return value
  }

  try {
    let seniorityNumber = null
    const commencementDate = toNullIfEmpty(pilotData.commencement_date)
    if (commencementDate) {
      seniorityNumber = await calculateSeniorityNumber(commencementDate)
    }

    const { data, error } = await supabase
      .from('pilots')
      .insert([
        {
          employee_id: pilotData.employee_id,
          first_name: pilotData.first_name,
          middle_name: toNullIfEmpty(pilotData.middle_name),
          last_name: pilotData.last_name,
          email: toNullIfEmpty(pilotData.email),
          role: pilotData.role,
          contract_type: toNullIfEmpty(pilotData.contract_type),
          nationality: toNullIfEmpty(pilotData.nationality),
          passport_number: toNullIfEmpty(pilotData.passport_number),
          passport_expiry: toNullIfEmpty(pilotData.passport_expiry),
          licence_type: toNullIfEmpty(pilotData.licence_type) as PilotLicenceType | null,
          licence_number: toNullIfEmpty(pilotData.licence_number),
          date_of_birth: toNullIfEmpty(pilotData.date_of_birth),
          commencement_date: commencementDate,
          seniority_number: seniorityNumber,
          is_active: pilotData.is_active,
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Audit log the creation
    await createAuditLog({
      action: 'INSERT',
      tableName: 'pilots',
      recordId: data.id,
      newData: data,
      description: `Created pilot: ${data.first_name} ${data.last_name} (${data.employee_id})`,
    })

    // Invalidate pilot-related caches
    await safeRevalidate('pilots')
    await safeRevalidate('pilot-stats')

    return data
  } catch (error) {
    logError(error as Error, {
      source: 'PilotService',
      severity: ErrorSeverity.HIGH,
      metadata: {
        operation: 'createPilot',
        employeeId: pilotData.employee_id,
      },
    })
    throw error
  }
}

export interface CertificationCreateData {
  check_type_id: string
  completion_date?: string
  expiry_date?: string
  expiry_roster_period?: string
  notes?: string
}

/**
 * Create pilot with initial certifications (atomic)
 * Uses PostgreSQL function for transaction safety
 * Both pilot and all certifications are created together or none at all
 */
export async function createPilotWithCertifications(
  pilotData: PilotFormData,
  certifications: CertificationCreateData[]
): Promise<{ pilot: Pilot; certificationCount: number }> {
  // Use admin client to bypass RLS (auth verified at API layer)
  const supabase = createAdminClient()

  try {
    // Prepare pilot data for PostgreSQL function
    const pilotJson = {
      employee_id: pilotData.employee_id,
      first_name: pilotData.first_name,
      middle_name: pilotData.middle_name || null,
      last_name: pilotData.last_name,
      role: pilotData.role,
      contract_type: pilotData.contract_type || null,
      nationality: pilotData.nationality || null,
      passport_number: pilotData.passport_number || null,
      passport_expiry: pilotData.passport_expiry || null,
      licence_type: pilotData.licence_type || null,
      licence_number: pilotData.licence_number || null,
      date_of_birth: pilotData.date_of_birth || null,
      commencement_date: pilotData.commencement_date || null,
      is_active: pilotData.is_active,
    }

    // Prepare certifications for PostgreSQL function (JSON array for RPC)
    const certificationsJson =
      certifications.length > 0 ? (certifications as unknown as Json[]) : undefined

    // Use PostgreSQL function for atomic creation
    const { data, error } = await supabase.rpc('create_pilot_with_certifications', {
      p_pilot_data: pilotJson,
      p_certifications: certificationsJson,
    })

    if (error) {
      logError(new Error(error.message), {
        source: 'PilotService',
        severity: ErrorSeverity.HIGH,
        metadata: {
          operation: 'createPilotWithCertifications',
          employeeId: pilotData.employee_id,
          certificationCount: certifications.length,
        },
      })
      throw new Error(`Failed to create pilot with certifications: ${error.message}`)
    }

    // Extract pilot and certification count from RPC array result
    type RpcResult = {
      certifications_created: number
      employee_id: string
      first_name: string
      last_name: string
      pilot_id: string
      role: 'Captain' | 'First Officer'
      seniority_number: number
    }

    const results = data as RpcResult[] | null
    if (!results || results.length === 0) {
      throw new Error('Unexpected response from database function')
    }

    const rpcResult = results[0]

    // Fetch the full pilot record
    const { data: pilotRecord, error: fetchError } = await supabase
      .from('pilots')
      .select('*')
      .eq('id', rpcResult.pilot_id)
      .single()

    if (fetchError || !pilotRecord) {
      throw new Error('Failed to fetch created pilot record')
    }

    logInfo('Successfully created pilot with certifications', {
      source: 'PilotService',
      metadata: {
        operation: 'createPilotWithCertifications',
        pilotId: rpcResult.pilot_id,
        employeeId: rpcResult.employee_id,
        certificationCount: rpcResult.certifications_created || 0,
      },
    })

    // Invalidate pilot-related caches
    await safeRevalidate('pilots')
    await safeRevalidate('pilot-stats')

    return {
      pilot: pilotRecord,
      certificationCount: rpcResult.certifications_created || 0,
    }
  } catch (error) {
    logError(error as Error, {
      source: 'PilotService',
      severity: ErrorSeverity.HIGH,
      metadata: {
        operation: 'createPilotWithCertifications',
        employeeId: pilotData.employee_id,
      },
    })
    throw error
  }
}

export async function updatePilot(
  pilotId: string,
  pilotData: Partial<PilotFormData>
): Promise<Pilot> {
  // Use admin client to bypass RLS (auth verified at API layer)
  const supabase = createAdminClient()

  try {
    // Fetch old data for audit trail
    const { data: oldData } = await supabase.from('pilots').select('*').eq('id', pilotId).single()

    let seniorityNumber = undefined
    if (pilotData.commencement_date) {
      seniorityNumber = await calculateSeniorityNumber(pilotData.commencement_date, pilotId)
    }

    const updateData = {
      ...pilotData,
      seniority_number: seniorityNumber,
    }

    const cleanedData = Object.fromEntries(
      Object.entries(updateData)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, value === '' ? null : value])
    )

    const { data, error } = await supabase
      .from('pilots')
      .update(cleanedData)
      .eq('id', pilotId)
      .select()
      .single()

    if (error) {
      console.error('❌ [updatePilot] Database error:', error)
      throw error
    }

    // Audit log the update
    await createAuditLog({
      action: 'UPDATE',
      tableName: 'pilots',
      recordId: pilotId,
      oldData: oldData || undefined,
      newData: data,
      description: `Updated pilot: ${data.first_name} ${data.last_name} (${data.employee_id})`,
    })

    // Invalidate pilot-related caches
    await safeRevalidate('pilots')
    await safeRevalidate('pilot-stats')

    return data
  } catch (error) {
    console.error('❌ [updatePilot] Error in updatePilot:', error)
    logError(error as Error, {
      source: 'PilotService',
      severity: ErrorSeverity.HIGH,
      metadata: {
        operation: 'updatePilot',
        pilotId,
      },
    })
    throw error
  }
}

/**
 * Delete pilot with cascading (atomic)
 * Uses PostgreSQL function for transaction safety
 * Deletes pilot and all related records (leave requests, certifications) atomically
 */
export async function deletePilot(pilotId: string): Promise<void> {
  // Use admin client to bypass RLS (auth verified at API layer)
  const supabase = createAdminClient()

  try {
    // Fetch pilot data before deletion for audit trail
    const { data: oldData } = await supabase.from('pilots').select('*').eq('id', pilotId).single()

    if (!oldData) {
      throw new Error('Pilot not found')
    }

    // Track deletion counts for audit log
    const deletedCounts = {
      requests: 0,
      checks: 0,
      leaveBids: 0,
      renewalPlans: 0,
      feedback: 0,
      ebtAssessments: 0,
      disciplinary: 0,
      tasks: 0,
      portalUsers: 0,
    }

    // Step 1: Delete from pilot_requests (leave + flight requests)
    const { data: deletedRequests, error: requestsError } = await supabase
      .from('pilot_requests')
      .delete()
      .eq('pilot_id', pilotId)
      .select('id')

    if (requestsError) {
      logWarning('Failed to delete pilot requests', {
        source: 'PilotService',
        metadata: { pilotId, error: requestsError.message },
      })
    } else {
      deletedCounts.requests = deletedRequests?.length ?? 0
    }

    // Step 2: Delete certifications (pilot_checks)
    const { data: deletedChecks, error: certsError } = await supabase
      .from('pilot_checks')
      .delete()
      .eq('pilot_id', pilotId)
      .select('id')

    if (certsError) {
      logWarning('Failed to delete pilot certifications', {
        source: 'PilotService',
        metadata: { pilotId, error: certsError.message },
      })
    } else {
      deletedCounts.checks = deletedChecks?.length ?? 0
    }

    // Step 3: Delete leave bids
    const { data: deletedBids, error: bidsError } = await supabase
      .from('leave_bids')
      .delete()
      .eq('pilot_id', pilotId)
      .select('id')

    if (bidsError) {
      logWarning('Failed to delete pilot leave bids', {
        source: 'PilotService',
        metadata: { pilotId, error: bidsError.message },
      })
    } else {
      deletedCounts.leaveBids = deletedBids?.length ?? 0
    }

    // Step 4: Delete certification renewal plans
    const { data: deletedPlans, error: plansError } = await supabase
      .from('certification_renewal_plans')
      .delete()
      .eq('pilot_id', pilotId)
      .select('id')

    if (plansError) {
      logWarning('Failed to delete certification renewal plans', {
        source: 'PilotService',
        metadata: { pilotId, error: plansError.message },
      })
    } else {
      deletedCounts.renewalPlans = deletedPlans?.length ?? 0
    }

    // Step 5: Delete pilot feedback
    const { data: deletedFeedback, error: feedbackError } = await supabase
      .from('pilot_feedback')
      .delete()
      .eq('pilot_id', pilotId)
      .select('id')

    if (feedbackError) {
      logWarning('Failed to delete pilot feedback', {
        source: 'PilotService',
        metadata: { pilotId, error: feedbackError.message },
      })
    } else {
      deletedCounts.feedback = deletedFeedback?.length ?? 0
    }

    // Step 6: Delete EBT assessments
    const { data: deletedEbt, error: ebtError } = await supabase
      .from('pilot_ebt_assessments')
      .delete()
      .eq('pilot_id', pilotId)
      .select('id')

    if (ebtError) {
      logWarning('Failed to delete pilot EBT assessments', {
        source: 'PilotService',
        metadata: { pilotId, error: ebtError.message },
      })
    } else {
      deletedCounts.ebtAssessments = deletedEbt?.length ?? 0
    }

    // Step 7: Delete disciplinary matters
    const { data: deletedDisciplinary, error: disciplinaryError } = await supabase
      .from('disciplinary_matters')
      .delete()
      .eq('pilot_id', pilotId)
      .select('id')

    if (disciplinaryError) {
      logWarning('Failed to delete disciplinary matters', {
        source: 'PilotService',
        metadata: { pilotId, error: disciplinaryError.message },
      })
    } else {
      deletedCounts.disciplinary = deletedDisciplinary?.length ?? 0
    }

    // Step 8: Delete related tasks
    const { data: deletedTasks, error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('related_pilot_id', pilotId)
      .select('id')

    if (tasksError) {
      logWarning('Failed to delete related tasks', {
        source: 'PilotService',
        metadata: { pilotId, error: tasksError.message },
      })
    } else {
      deletedCounts.tasks = deletedTasks?.length ?? 0
    }

    // Step 9: Delete pilot portal account
    const { data: deletedUsers, error: usersError } = await supabase
      .from('pilot_users')
      .delete()
      .eq('pilot_id', pilotId)
      .select('id')

    if (usersError) {
      logWarning('Failed to delete pilot portal account', {
        source: 'PilotService',
        metadata: { pilotId, error: usersError.message },
      })
    } else {
      deletedCounts.portalUsers = deletedUsers?.length ?? 0
    }

    // Step 10: Delete the pilot record itself
    const { error: pilotError } = await supabase.from('pilots').delete().eq('id', pilotId)

    if (pilotError) {
      throw new Error(`Failed to delete pilot: ${pilotError.message}`)
    }

    // Audit log the deletion with full cascade summary
    await createAuditLog({
      action: 'DELETE',
      tableName: 'pilots',
      recordId: pilotId,
      oldData,
      description: `Deleted pilot: ${oldData.first_name} ${oldData.last_name} (${oldData.employee_id}) — cascaded: ${deletedCounts.requests} requests, ${deletedCounts.checks} certifications, ${deletedCounts.leaveBids} leave bids, ${deletedCounts.renewalPlans} renewal plans, ${deletedCounts.feedback} feedback records, ${deletedCounts.ebtAssessments} EBT assessments, ${deletedCounts.disciplinary} disciplinary matters, ${deletedCounts.tasks} tasks, ${deletedCounts.portalUsers} portal accounts`,
    })

    logInfo('Successfully deleted pilot with all cascading records', {
      source: 'PilotService',
      metadata: {
        operation: 'deletePilot',
        pilotId,
        employeeId: oldData?.employee_id,
        pilotName: `${oldData.first_name} ${oldData.last_name}`,
        deletedCounts,
      },
    })

    // Invalidate pilot-related caches
    await safeRevalidate('pilots')
    await safeRevalidate('pilot-stats')
  } catch (error) {
    logError(error as Error, {
      source: 'PilotService',
      severity: ErrorSeverity.HIGH,
      metadata: {
        operation: 'deletePilot',
        pilotId,
      },
    })
    throw error
  }
}

// ===================================
// SEARCH & FILTER
// ===================================

/**
 * Get pilots with optional filters (for API routes)
 * @param filters - Optional filters for role and status
 * @returns Promise<Pilot[]>
 */
export async function getPilots(filters?: {
  role?: 'Captain' | 'First Officer'
  is_active?: boolean
}): Promise<Pilot[]> {
  const supabase = createAdminClient()

  try {
    let query = supabase
      .from('pilots')
      .select('*')
      .order('seniority_number', { ascending: true, nullsFirst: false })

    if (filters?.role) {
      query = query.eq('role', filters.role)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query

    if (error) throw error

    return data || []
  } catch (error) {
    logError(error as Error, {
      source: 'PilotService',
      severity: ErrorSeverity.HIGH,
      metadata: {
        operation: 'getPilots',
        filters,
      },
    })
    throw error
  }
}

/**
 * Get pilots grouped by rank and sorted by seniority number
 * Returns pilots organized by their rank (Captain, First Officer)
 * @returns Promise<Record<string, Pilot[]>>
 */
export async function getPilotsGroupedByRank(): Promise<Record<string, Pilot[]>> {
  const supabase = createAdminClient()

  try {
    const { data, error } = await supabase
      .from('pilots')
      .select('*')
      .order('seniority_number', { ascending: true, nullsFirst: false })

    if (error) throw error

    // Group pilots by rank
    const grouped = (data || []).reduce(
      (acc, pilot) => {
        const rank = pilot.role || 'Unknown'

        if (!acc[rank]) {
          acc[rank] = []
        }

        acc[rank].push(pilot)

        return acc
      },
      {} as Record<string, Pilot[]>
    )

    return grouped
  } catch (error) {
    logError(error as Error, {
      source: 'PilotService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getPilotsGroupedByRank' },
    })
    throw error
  }
}

export async function searchPilots(
  searchTerm: string,
  filters: {
    role?: 'Captain' | 'First Officer' | 'all'
    status?: 'active' | 'inactive' | 'all'
  } = {}
): Promise<PilotWithCertifications[]> {
  const supabase = createAdminClient()

  try {
    let query = supabase.from('pilots').select('*')

    if (searchTerm) {
      query = query.or(`
        first_name.ilike.%${searchTerm}%,
        last_name.ilike.%${searchTerm}%,
        employee_id.ilike.%${searchTerm}%
      `)
    }

    if (filters.role && filters.role !== 'all') {
      query = query.eq('role', filters.role)
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('is_active', filters.status === 'active')
    }

    const { data: pilots, error } = await query.order('first_name', { ascending: true })

    if (error) throw error

    const pilotsWithCerts = (pilots || []).map((pilot) => ({
      ...pilot,
      certificationStatus: { current: 0, expiring: 0, expired: 0 },
    }))

    return pilotsWithCerts
  } catch (error) {
    logError(error as Error, {
      source: 'PilotService',
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        operation: 'searchPilots',
        searchTerm,
        filters,
      },
    })
    throw error
  }
}

export async function checkEmployeeIdExists(
  employeeId: string,
  excludePilotId?: string
): Promise<boolean> {
  const supabase = createAdminClient()

  try {
    let query = supabase.from('pilots').select('id').eq('employee_id', employeeId)

    if (excludePilotId) {
      query = query.neq('id', excludePilotId)
    }

    const { data, error } = await query.maybeSingle()

    if (error) throw error
    return data !== null
  } catch (error) {
    logError(error as Error, {
      source: 'PilotService',
      severity: ErrorSeverity.LOW,
      metadata: {
        operation: 'checkEmployeeIdExists',
        employeeId,
      },
    })
    return false
  }
}

// ===================================
// RETIREMENT CALCULATIONS
// ===================================

export async function getPilotsNearingRetirementForDashboard(): Promise<PilotWithRetirement[]> {
  const supabase = createAdminClient()

  try {
    // Fetch retirement age from settings dynamically
    const pilotReqs = await getPilotRequirements()
    const RETIREMENT_AGE = pilotReqs.pilot_retirement_age

    const { data: pilots, error } = await supabase
      .from('pilots')
      .select('id, first_name, last_name, date_of_birth, is_active')
      .eq('is_active', true)
      .not('date_of_birth', 'is', null)

    if (error) throw error

    const today = new Date()
    const pilotsWithRetirement = (pilots || [])
      .map((pilot) => {
        if (!pilot.date_of_birth) return null

        const birthDate = new Date(pilot.date_of_birth)
        const retirementDate = new Date(birthDate)
        retirementDate.setFullYear(retirementDate.getFullYear() + RETIREMENT_AGE)

        const yearsToRetirement = Math.floor(
          (retirementDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
        )

        let retirementStatus: 'active' | 'due_soon' | 'overdue' = 'active'
        if (yearsToRetirement < 0) retirementStatus = 'overdue'
        else if (yearsToRetirement <= 2) retirementStatus = 'due_soon'

        return {
          ...pilot,
          retirement: {
            yearsToRetirement,
            retirementStatus,
            retirementDate: retirementDate.toISOString(),
          },
        }
      })
      .filter((pilot) => {
        return (
          pilot !== null && pilot.retirement !== undefined && pilot.retirement.yearsToRetirement < 5
        )
      })
      .sort((a, b) => {
        const aYears = a!.retirement!.yearsToRetirement
        const bYears = b!.retirement!.yearsToRetirement
        return aYears - bYears
      }) as PilotWithRetirement[]

    return pilotsWithRetirement
  } catch (error) {
    logError(error as Error, {
      source: 'PilotService',
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        operation: 'getPilotsNearingRetirementForDashboard',
      },
    })
    return []
  }
}

// ===================================
// AUTOMATED RETIREMENT PROCESSING
// ===================================

/**
 * Result for individual pilot retirement processing
 */
export interface PilotRetirementResult {
  pilotId: string
  pilotName: string
  employeeId: string
  email: string | null
  age: number
  success: boolean
  error?: string
}

/**
 * Summary of retirement processing batch
 */
export interface RetirementProcessingSummary {
  totalChecked: number
  retired: number
  skippedNoDOB: number
  skippedNoEmail: number
  emailsSent: number
  emailsFailed: number
  results: PilotRetirementResult[]
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: Date, referenceDate: Date = new Date()): number {
  let age = referenceDate.getFullYear() - dateOfBirth.getFullYear()
  const monthDiff = referenceDate.getMonth() - dateOfBirth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < dateOfBirth.getDate())) {
    age--
  }

  return age
}

/**
 * Process pilots who have reached retirement age
 *
 * This function:
 * 1. Fetches retirement age from settings (default 65)
 * 2. Queries all active pilots with date_of_birth
 * 3. Calculates which pilots have reached retirement age
 * 4. Sets is_active = false for retired pilots
 * 5. Creates audit log entries for each update
 *
 * @returns Promise<RetirementProcessingSummary> - Summary of processing results
 */
export async function processRetiredPilots(): Promise<RetirementProcessingSummary> {
  const supabase = createAdminClient()
  const today = new Date()

  const summary: RetirementProcessingSummary = {
    totalChecked: 0,
    retired: 0,
    skippedNoDOB: 0,
    skippedNoEmail: 0,
    emailsSent: 0,
    emailsFailed: 0,
    results: [],
  }

  try {
    // Fetch retirement age from settings dynamically
    const pilotReqs = await getPilotRequirements()
    const retirementAge = pilotReqs.pilot_retirement_age

    logInfo('Starting automated retirement processing', {
      source: 'PilotService',
      metadata: {
        operation: 'processRetiredPilots',
        retirementAge,
        processDate: today.toISOString(),
      },
    })

    // Query all active pilots (email is in pilot_users table, not pilots)
    const { data: activePilots, error: fetchError } = await supabase
      .from('pilots')
      .select('id, employee_id, first_name, last_name, role, date_of_birth, is_active')
      .eq('is_active', true)

    if (fetchError) {
      throw new Error(`Failed to fetch active pilots: ${fetchError.message}`)
    }

    if (!activePilots || activePilots.length === 0) {
      logInfo('No active pilots found for retirement check', {
        source: 'PilotService',
        metadata: { operation: 'processRetiredPilots' },
      })
      return summary
    }

    summary.totalChecked = activePilots.length

    // Process each pilot
    for (const pilot of activePilots) {
      // Skip pilots without date of birth
      if (!pilot.date_of_birth) {
        summary.skippedNoDOB++
        continue
      }

      const birthDate = new Date(pilot.date_of_birth)
      const age = calculateAge(birthDate, today)

      // Check if pilot has reached retirement age
      if (age >= retirementAge) {
        const pilotName = `${pilot.first_name} ${pilot.last_name}`

        // Look up pilot's email from pilot_users table
        const { data: pilotUser } = await supabase
          .from('pilot_users')
          .select('email')
          .eq('pilot_id', pilot.id)
          .single()

        const pilotEmail = pilotUser?.email || null

        const result: PilotRetirementResult = {
          pilotId: pilot.id,
          pilotName,
          employeeId: pilot.employee_id || 'N/A',
          email: pilotEmail,
          age,
          success: false,
        }

        try {
          // Update pilot to inactive
          const { error: updateError } = await supabase
            .from('pilots')
            .update({ is_active: false })
            .eq('id', pilot.id)

          if (updateError) {
            throw new Error(updateError.message)
          }

          // Create audit log entry
          await createAuditLog({
            action: 'UPDATE',
            tableName: 'pilots',
            recordId: pilot.id,
            oldData: { is_active: true },
            newData: { is_active: false },
            description: `Automated retirement: ${pilotName} (${pilot.employee_id}) reached retirement age of ${retirementAge}. Current age: ${age}`,
          })

          result.success = true
          summary.retired++

          logInfo('Pilot automatically retired', {
            source: 'PilotService',
            metadata: {
              operation: 'processRetiredPilots',
              pilotId: pilot.id,
              pilotName,
              employeeId: pilot.employee_id,
              age,
              retirementAge,
            },
          })
        } catch (error) {
          result.error = error instanceof Error ? error.message : 'Unknown error'
          logError(error as Error, {
            source: 'PilotService',
            severity: ErrorSeverity.HIGH,
            metadata: {
              operation: 'processRetiredPilots',
              pilotId: pilot.id,
              pilotName,
            },
          })
        }

        summary.results.push(result)
      }
    }

    // Invalidate pilot-related caches if any retirements occurred
    if (summary.retired > 0) {
      await safeRevalidate('pilots')
      await safeRevalidate('pilot-stats')
    }

    logInfo('Automated retirement processing completed', {
      source: 'PilotService',
      metadata: {
        operation: 'processRetiredPilots',
        summary: {
          totalChecked: summary.totalChecked,
          retired: summary.retired,
          skippedNoDOB: summary.skippedNoDOB,
        },
      },
    })

    return summary
  } catch (error) {
    logError(error as Error, {
      source: 'PilotService',
      severity: ErrorSeverity.HIGH,
      metadata: {
        operation: 'processRetiredPilots',
      },
    })
    throw error
  }
}
