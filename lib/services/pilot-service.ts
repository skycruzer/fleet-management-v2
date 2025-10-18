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

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import { createAuditLog } from './audit-service'
import { logError, logInfo, logWarning, ErrorSeverity } from '@/lib/error-logger'
import { parseCaptainQualifications } from '@/lib/utils/type-guards'

// Type aliases for convenience
type Pilot = Database['public']['Tables']['pilots']['Row']
type PilotInsert = Database['public']['Tables']['pilots']['Insert']
type PilotUpdate = Database['public']['Tables']['pilots']['Update']
type PilotCheck = Database['public']['Tables']['pilot_checks']['Row']

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
  role: 'Captain' | 'First Officer'
  contract_type?: string | null
  nationality?: string | null
  passport_number?: string | null
  passport_expiry?: string | null
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

// ===================================
// CERTIFICATION STATUS CALCULATION
// ===================================

function getCertificationStatus(expiryDate: Date | null) {
  if (!expiryDate) return { color: 'gray', label: 'No Date' }

  const today = new Date()
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysUntilExpiry < 0) {
    return { color: 'red', label: 'Expired' }
  }
  if (daysUntilExpiry <= 30) {
    return { color: 'yellow', label: 'Expiring Soon' }
  }
  return { color: 'green', label: 'Current' }
}

// ===================================
// SENIORITY CALCULATION
// ===================================

export async function calculateSeniorityNumber(
  commencementDate: string,
  excludePilotId?: string
): Promise<number> {
  const supabase = await createClient()

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
  const supabase = await createClient()

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
  const supabase = await createClient()

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

export async function getPilotStats() {
  const supabase = await createClient()

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
}

// ===================================
// WRITE OPERATIONS
// ===================================

export async function createPilot(pilotData: PilotFormData): Promise<Pilot> {
  const supabase = await createClient()

  try {
    let seniorityNumber = null
    if (pilotData.commencement_date) {
      seniorityNumber = await calculateSeniorityNumber(pilotData.commencement_date)
    }

    const { data, error } = await supabase
      .from('pilots')
      .insert([
        {
          employee_id: pilotData.employee_id,
          first_name: pilotData.first_name,
          middle_name: pilotData.middle_name,
          last_name: pilotData.last_name,
          role: pilotData.role,
          contract_type: pilotData.contract_type,
          nationality: pilotData.nationality,
          passport_number: pilotData.passport_number,
          passport_expiry: pilotData.passport_expiry,
          date_of_birth: pilotData.date_of_birth,
          commencement_date: pilotData.commencement_date,
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
  const supabase = await createClient()

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
      date_of_birth: pilotData.date_of_birth || null,
      commencement_date: pilotData.commencement_date || null,
      is_active: pilotData.is_active,
    }

    // Prepare certifications for PostgreSQL function
    const certificationsJson = certifications.length > 0 ? (certifications as any) : undefined

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

    // Extract pilot and certification count from result
    const result = data as any
    if (!result || !result.pilot) {
      throw new Error('Unexpected response from database function')
    }

    logInfo('Successfully created pilot with certifications', {
      source: 'PilotService',
      metadata: {
        operation: 'createPilotWithCertifications',
        pilotId: result.pilot.id,
        employeeId: result.pilot.employee_id,
        certificationCount: result.certification_count || 0,
      },
    })

    return {
      pilot: result.pilot,
      certificationCount: result.certification_count || 0,
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
  const supabase = await createClient()

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

    if (error) throw error

    // Audit log the update
    await createAuditLog({
      action: 'UPDATE',
      tableName: 'pilots',
      recordId: pilotId,
      oldData: oldData || undefined,
      newData: data,
      description: `Updated pilot: ${data.first_name} ${data.last_name} (${data.employee_id})`,
    })

    return data
  } catch (error) {
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
  const supabase = await createClient()

  try {
    // Fetch pilot data before deletion for audit trail
    const { data: oldData } = await supabase.from('pilots').select('*').eq('id', pilotId).single()

    // Use PostgreSQL function for atomic deletion
    const { data, error } = await supabase.rpc('delete_pilot_with_cascade', {
      p_pilot_id: pilotId,
    })

    if (error) {
      logError(new Error(error.message), {
        source: 'PilotService',
        severity: ErrorSeverity.HIGH,
        metadata: {
          operation: 'deletePilot',
          pilotId,
        },
      })
      throw new Error(`Failed to delete pilot: ${error.message}`)
    }

    // Audit log the deletion
    if (oldData) {
      await createAuditLog({
        action: 'DELETE',
        tableName: 'pilots',
        recordId: pilotId,
        oldData,
        description: `Deleted pilot: ${oldData.first_name} ${oldData.last_name} (${oldData.employee_id})`,
      })
    }

    // Log the successful deletion for audit purposes
    if (data && typeof data === 'object' && 'message' in data) {
      logInfo('Successfully deleted pilot with cascading records', {
        source: 'PilotService',
        metadata: {
          operation: 'deletePilot',
          pilotId,
          employeeId: oldData?.employee_id,
        },
      })
    }
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
  const supabase = await createClient()

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

export async function searchPilots(
  searchTerm: string,
  filters: {
    role?: 'Captain' | 'First Officer' | 'all'
    status?: 'active' | 'inactive' | 'all'
  } = {}
): Promise<PilotWithCertifications[]> {
  const supabase = await createClient()

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
  const supabase = await createClient()

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
  const supabase = await createClient()
  const RETIREMENT_AGE = 65

  try {
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
