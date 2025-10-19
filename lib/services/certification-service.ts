/**
 * Certification Service for Fleet Management V2
 * NEW SERVICE - Created for v2 based on pilot-service.ts CRUD patterns
 *
 * Provides comprehensive CRUD operations for pilot certifications with:
 * - Certification lifecycle management
 * - Expiry tracking and alerts
 * - FAA color coding logic
 * - Bulk operations support
 *
 * @version 2.0.0
 * @since 2025-10-17
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import { differenceInDays } from 'date-fns'
import { createAuditLog } from './audit-service'
import { logError, logInfo, ErrorSeverity } from '@/lib/error-logger'

// Type aliases for convenience
type PilotCheck = Database['public']['Tables']['pilot_checks']['Row']
type PilotCheckInsert = Database['public']['Tables']['pilot_checks']['Insert']
type PilotCheckUpdate = Database['public']['Tables']['pilot_checks']['Update']

// ===================================
// INTERFACES
// ===================================

export interface CertificationWithDetails extends PilotCheck {
  pilot?: {
    id: string
    first_name: string
    last_name: string
    employee_id: string
    role: string
  }
  check_type?: {
    id: string
    check_code: string
    check_description: string
    category: string | null
  }
  status?: {
    color: 'red' | 'yellow' | 'green' | 'gray'
    label: 'Expired' | 'Expiring Soon' | 'Current' | 'No Date'
    daysUntilExpiry?: number
  }
}

export interface CertificationFormData {
  pilot_id: string
  check_type_id: string
  expiry_date?: string | null
}

// ===================================
// CERTIFICATION STATUS CALCULATION (FAA Color Coding)
// ===================================

function getCertificationStatus(expiryDate: Date | null) {
  if (!expiryDate) return { color: 'gray' as const, label: 'No Date' as const }

  const today = new Date()
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysUntilExpiry < 0) {
    return {
      color: 'red' as const,
      label: 'Expired' as const,
      daysUntilExpiry,
    }
  }
  if (daysUntilExpiry <= 30) {
    return {
      color: 'yellow' as const,
      label: 'Expiring Soon' as const,
      daysUntilExpiry,
    }
  }
  return {
    color: 'green' as const,
    label: 'Current' as const,
    daysUntilExpiry,
  }
}

// ===================================
// READ OPERATIONS
// ===================================

/**
 * Get all certifications with pagination and eager loading (optimized)
 * @param page - Page number (default: 1)
 * @param pageSize - Items per page (default: 50)
 * @param filters - Optional filters for status, pilot, check type
 * @returns Promise<{ certifications: CertificationWithDetails[], total: number, page: number, pageSize: number }>
 */
export async function getCertifications(
  page: number = 1,
  pageSize: number = 50,
  filters?: {
    status?: 'current' | 'expiring' | 'expired' | 'all'
    pilotId?: string
    checkTypeId?: string
    category?: string
  }
): Promise<{
  certifications: CertificationWithDetails[]
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
    let query = supabase
      .from('pilot_checks')
      .select(
        `
        id,
        pilot_id,
        check_type_id,
        expiry_date,
        created_at,
        updated_at,
        pilot:pilots (
          id,
          first_name,
          last_name,
          employee_id,
          role
        ),
        check_type:check_types (
          id,
          check_code,
          check_description,
          category
        )
      `,
        { count: 'exact' }
      )
      .range(from, to)

    // Apply filters
    if (filters?.pilotId) {
      query = query.eq('pilot_id', filters.pilotId)
    }
    if (filters?.checkTypeId) {
      query = query.eq('check_type_id', filters.checkTypeId)
    }

    // Apply status filter (date-based)
    if (filters?.status && filters.status !== 'all') {
      const today = new Date()
      if (filters.status === 'expired') {
        query = query.lt('expiry_date', today.toISOString())
      } else if (filters.status === 'expiring') {
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(today.getDate() + 30)
        query = query
          .gte('expiry_date', today.toISOString())
          .lte('expiry_date', thirtyDaysFromNow.toISOString())
      } else if (filters.status === 'current') {
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(today.getDate() + 30)
        query = query.gt('expiry_date', thirtyDaysFromNow.toISOString())
      }
    }

    query = query.order('expiry_date', { ascending: true, nullsFirst: false })

    const { data, error, count } = await query

    if (error) throw error

    const certificationsWithStatus = (data || []).map((cert: any) => ({
      ...cert,
      status: getCertificationStatus(cert.expiry_date ? new Date(cert.expiry_date) : null),
    }))

    return {
      certifications: certificationsWithStatus,
      total: count || 0,
      page,
      pageSize,
    }
  } catch (error) {
    logError(error as Error, {
      source: 'certification-service:getCertifications',
      severity: ErrorSeverity.HIGH,
      metadata: { operation: 'fetchCertifications' },
    })
    throw error
  }
}

/**
 * Get all certifications without pagination (for legacy compatibility)
 */
export async function getCertificationsUnpaginated(): Promise<CertificationWithDetails[]> {
  const result = await getCertifications(1, 1000)
  return result.certifications
}

/**
 * Get single certification by ID
 */
export async function getCertificationById(
  certificationId: string
): Promise<CertificationWithDetails | null> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('pilot_checks')
      .select(
        `
        *,
        pilot:pilots (
          id,
          first_name,
          last_name,
          employee_id,
          role
        ),
        check_type:check_types (
          id,
          check_code,
          check_description,
          category
        )
      `
      )
      .eq('id', certificationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return {
      ...data,
      status: getCertificationStatus(data.expiry_date ? new Date(data.expiry_date) : null),
    }
  } catch (error) {
    logError(error as Error, {
      source: 'certification-service:getCertificationById',
      severity: ErrorSeverity.MEDIUM,
      metadata: { certificationId },
    })
    throw error
  }
}

/**
 * Get all certifications for a specific pilot
 */
export async function getCertificationsByPilotId(
  pilotId: string
): Promise<CertificationWithDetails[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('pilot_checks')
      .select(
        `
        *,
        check_type:check_types (
          id,
          check_code,
          check_description,
          category
        )
      `
      )
      .eq('pilot_id', pilotId)
      .order('expiry_date', { ascending: true, nullsFirst: false })

    if (error) throw error

    const certificationsWithStatus = (data || []).map((cert: any) => ({
      ...cert,
      status: getCertificationStatus(cert.expiry_date ? new Date(cert.expiry_date) : null),
    }))

    return certificationsWithStatus
  } catch (error) {
    logError(error as Error, {
      source: 'certification-service:getCertificationsByPilotId',
      severity: ErrorSeverity.MEDIUM,
      metadata: { pilotId },
    })
    throw error
  }
}

/**
 * Get expiring certifications within N days
 * Uses FAA color coding logic
 */
export async function getExpiringCertifications(daysAhead: number = 60) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('pilot_checks')
      .select(
        `
        *,
        pilot:pilots (
          id,
          first_name,
          last_name,
          employee_id,
          role
        ),
        check_type:check_types (
          id,
          check_code,
          check_description,
          category
        )
      `
      )
      .not('expiry_date', 'is', null)
      .order('expiry_date', { ascending: true })

    if (error) throw error

    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    const expiringCerts = (data || [])
      .filter((cert: any) => {
        const expiryDate = new Date(cert.expiry_date)
        return expiryDate <= futureDate
      })
      .map((cert: any) => {
        const expiryDate = new Date(cert.expiry_date)
        const daysUntilExpiry = differenceInDays(expiryDate, today)

        return {
          ...cert,
          daysUntilExpiry,
          status: getCertificationStatus(expiryDate),
        }
      })

    return expiringCerts
  } catch (error) {
    logError(error as Error, {
      source: 'certification-service:getExpiringCertifications',
      severity: ErrorSeverity.HIGH,
      metadata: { daysAhead },
    })
    throw error
  }
}

// ===================================
// WRITE OPERATIONS
// ===================================

/**
 * Create new certification
 */
export async function createCertification(
  certificationData: CertificationFormData
): Promise<PilotCheck> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('pilot_checks')
      .insert([
        {
          pilot_id: certificationData.pilot_id,
          check_type_id: certificationData.check_type_id,
          expiry_date: certificationData.expiry_date,
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Audit log the creation
    await createAuditLog({
      action: 'INSERT',
      tableName: 'pilot_checks',
      recordId: data.id,
      newData: data,
      description: `Created certification for pilot ID: ${data.pilot_id}`,
    })

    return data
  } catch (error) {
    logError(error as Error, {
      source: 'certification-service:createCertification',
      severity: ErrorSeverity.HIGH,
      metadata: { pilotId: certificationData.pilot_id },
    })
    throw error
  }
}

/**
 * Update existing certification
 */
export async function updateCertification(
  certificationId: string,
  certificationData: Partial<CertificationFormData>
): Promise<PilotCheck> {
  const supabase = await createClient()

  try {
    // Fetch old data for audit trail
    const { data: oldData } = await supabase
      .from('pilot_checks')
      .select('*')
      .eq('id', certificationId)
      .single()

    const cleanedData = Object.fromEntries(
      Object.entries(certificationData)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, value === '' ? null : value])
    )

    const { data, error } = await supabase
      .from('pilot_checks')
      .update(cleanedData)
      .eq('id', certificationId)
      .select()
      .single()

    if (error) throw error

    // Audit log the update
    await createAuditLog({
      action: 'UPDATE',
      tableName: 'pilot_checks',
      recordId: certificationId,
      oldData: oldData || undefined,
      newData: data,
      description: `Updated certification for pilot ID: ${data.pilot_id}`,
    })

    return data
  } catch (error) {
    logError(error as Error, {
      source: 'certification-service:updateCertification',
      severity: ErrorSeverity.HIGH,
      metadata: { certificationId },
    })
    throw error
  }
}

/**
 * Delete certification
 */
export async function deleteCertification(certificationId: string): Promise<void> {
  const supabase = await createClient()

  try {
    // Fetch certification data before deletion for audit trail
    const { data: oldData } = await supabase
      .from('pilot_checks')
      .select('*')
      .eq('id', certificationId)
      .single()

    const { error } = await supabase.from('pilot_checks').delete().eq('id', certificationId)

    if (error) throw error

    // Audit log the deletion
    if (oldData) {
      await createAuditLog({
        action: 'DELETE',
        tableName: 'pilot_checks',
        recordId: certificationId,
        oldData,
        description: `Deleted certification for pilot ID: ${oldData.pilot_id}`,
      })
    }
  } catch (error) {
    logError(error as Error, {
      source: 'certification-service:deleteCertification',
      severity: ErrorSeverity.HIGH,
      metadata: { certificationId },
    })
    throw error
  }
}

/**
 * Bulk delete certifications (atomic)
 * Uses PostgreSQL function for transaction safety
 * All deletes succeed together or all fail together
 */
export async function bulkDeleteCertifications(
  certificationIds: string[]
): Promise<{ deletedCount: number; requestedCount: number }> {
  const supabase = await createClient()

  try {
    // Use PostgreSQL function for atomic bulk delete
    const { data, error } = await supabase.rpc('bulk_delete_certifications', {
      p_certification_ids: certificationIds,
    })

    if (error) {
      logError(new Error(`bulkDeleteCertifications: ${error.message}`), {
        source: 'certification-service:bulkDeleteCertifications',
        severity: ErrorSeverity.CRITICAL,
        metadata: { certificationIds, error },
      })
      throw new Error(`Failed to bulk delete certifications: ${error.message}`)
    }

    // Extract results
    const result = data as any
    if (!result) {
      throw new Error('Unexpected response from database function')
    }

    logInfo('Bulk delete certifications completed', {
      source: 'certification-service:bulkDeleteCertifications',
      metadata: { message: result.message },
    })

    return {
      deletedCount: result.deleted_count || 0,
      requestedCount: result.requested_count || 0,
    }
  } catch (error) {
    logError(error as Error, {
      source: 'certification-service:bulkDeleteCertifications',
      severity: ErrorSeverity.CRITICAL,
      metadata: { certificationIds },
    })
    throw error
  }
}

/**
 * Bulk update certifications (atomic)
 * Uses PostgreSQL function for transaction safety
 * All updates succeed together or all fail together
 */
export async function batchUpdateCertifications(
  certifications: Array<{
    id: string
    updates: Partial<CertificationFormData>
  }>
): Promise<{ updatedCount: number; totalRequested: number }> {
  const supabase = await createClient()

  try {
    // Prepare updates for PostgreSQL function
    const updatesJson = certifications.map(({ id, updates }) => {
      const cleanedData: any = { id }

      // Only include defined, non-empty values
      if (updates.expiry_date !== undefined) {
        cleanedData.expiry_date = updates.expiry_date || null
      }

      return cleanedData
    })

    // Use PostgreSQL function for atomic batch update
    const { data, error } = await supabase.rpc('batch_update_certifications', {
      p_updates: updatesJson,
    })

    if (error) {
      logError(new Error(`batchUpdateCertifications: ${error.message}`), {
        source: 'certification-service:batchUpdateCertifications',
        severity: ErrorSeverity.CRITICAL,
        metadata: { certifications, error: error.message },
      })
      throw new Error(`Failed to batch update certifications: ${error.message}`)
    }

    // Extract results
    const result = data as any
    if (!result) {
      throw new Error('Unexpected response from database function')
    }

    logInfo('Batch update certifications completed', {
      source: 'certification-service:batchUpdateCertifications',
      metadata: { message: result.message },
    })

    return {
      updatedCount: result.updated_count || 0,
      totalRequested: result.total_requested || 0,
    }
  } catch (error) {
    logError(error as Error, {
      source: 'certification-service:batchUpdateCertifications',
      severity: ErrorSeverity.CRITICAL,
      metadata: { certifications },
    })
    throw error
  }
}

// ===================================
// STATISTICS & ANALYTICS
// ===================================

/**
 * Get certification statistics
 */
export async function getCertificationStats() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from('pilot_checks').select('expiry_date')

    if (error) throw error

    const now = new Date()
    const stats = (data || []).reduce(
      (acc, cert) => {
        acc.total++

        if (!cert.expiry_date) {
          acc.noDate++
          return acc
        }

        const status = getCertificationStatus(new Date(cert.expiry_date))

        if (status.color === 'red') acc.expired++
        else if (status.color === 'yellow') acc.expiring++
        else if (status.color === 'green') acc.current++

        return acc
      },
      {
        total: 0,
        current: 0,
        expiring: 0,
        expired: 0,
        noDate: 0,
      }
    )

    const complianceRate = stats.total > 0 ? Math.round((stats.current / stats.total) * 100) : 100

    return {
      ...stats,
      complianceRate,
    }
  } catch (error) {
    logError(error as Error, {
      source: 'certification-service:getCertificationStats',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'calculateStats' },
    })
    throw error
  }
}

/**
 * Get certifications by category with status breakdown
 */
export async function getCertificationsByCategory() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from('pilot_checks').select(
      `
        id,
        expiry_date,
        check_type:check_types (
          category
        )
      `
    )

    if (error) throw error

    const categoryStats = (data || []).reduce(
      (acc, cert: any) => {
        const category = cert.check_type?.category || 'Other'

        if (!acc[category]) {
          acc[category] = { total: 0, current: 0, expiring: 0, expired: 0 }
        }

        acc[category].total++

        if (!cert.expiry_date) {
          acc[category].current++
          return acc
        }

        const status = getCertificationStatus(new Date(cert.expiry_date))

        if (status.color === 'red') acc[category].expired++
        else if (status.color === 'yellow') acc[category].expiring++
        else if (status.color === 'green') acc[category].current++

        return acc
      },
      {} as Record<string, { total: number; current: number; expiring: number; expired: number }>
    )

    return Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      ...stats,
      complianceRate: Math.round((stats.current / stats.total) * 100),
    }))
  } catch (error) {
    logError(error as Error, {
      source: 'certification-service:getCertificationsByCategory',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'calculateCategoryStats' },
    })
    throw error
  }
}
