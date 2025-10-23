/**
 * Disciplinary Matter Service
 *
 * Service layer for disciplinary matter management with CRUD operations,
 * action tracking, timeline management, and audit logging.
 *
 * @spec 001-missing-core-features (US6)
 */

import { createClient } from '@/lib/supabase/server'
import { createAuditLog } from './audit-service'
import type { Database } from '@/types/supabase'

// Types
type DisciplinaryMatter = Database['public']['Tables']['disciplinary_matters']['Row']
type DisciplinaryMatterInsert = Database['public']['Tables']['disciplinary_matters']['Insert']
type DisciplinaryMatterUpdate = Database['public']['Tables']['disciplinary_matters']['Update']

// Extended types with relations
export interface DisciplinaryMatterWithRelations extends DisciplinaryMatter {
  pilot?: {
    id: string
    first_name: string
    last_name: string
    role: string
    employee_id: string
  }
  incident_type?: {
    id: string
    name: string
    description: string
  }
  reported_by_user?: {
    id: string
    email: string
    name: string | null
  }
  assigned_to_user?: {
    id: string
    email: string
    name: string | null
  }
  resolved_by_user?: {
    id: string
    email: string
    name: string | null
  }
}

// Service response types
export interface ServiceResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

// Filter types
export interface MatterFilters {
  pilotId?: string
  status?: string
  severity?: string
  incidentTypeId?: string
  assignedTo?: string
  reportedBy?: string
  startDate?: Date
  endDate?: Date
  searchQuery?: string
  includeResolved?: boolean
  page?: number
  pageSize?: number
  sortBy?: 'incident_date' | 'created_at' | 'updated_at' | 'severity'
  sortOrder?: 'asc' | 'desc'
}


// Statistics types
export interface MatterStats {
  totalMatters: number
  openMatters: number
  resolvedMatters: number
  underInvestigation: number
  bySeverity: {
    minor: number
    moderate: number
    serious: number
    critical: number
  }
  byStatus: {
    [key: string]: number
  }
  overdueMatters: number
  averageResolutionDays: number
}

// Constants
export const MATTER_STATUSES = [
  'REPORTED',
  'UNDER_INVESTIGATION',
  'PENDING_DECISION',
  'ACTION_TAKEN',
  'RESOLVED',
  'CLOSED',
  'APPEALED',
] as const

export const MATTER_SEVERITIES = ['MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL'] as const


// ============================================================================
// MATTER CRUD OPERATIONS
// ============================================================================

/**
 * Get disciplinary matters with optional filtering and pagination
 */
export async function getMatters(
  filters?: MatterFilters
): Promise<ServiceResponse<{ matters: DisciplinaryMatterWithRelations[]; totalCount: number }>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    let query = supabase
      .from('disciplinary_matters')
      .select(
        `
        *,
        pilot:pilots!disciplinary_matters_pilot_id_fkey (
          id,
          first_name,
          last_name,
          role,
          employee_id
        ),
        incident_type:incident_types!disciplinary_matters_incident_type_id_fkey (
          id,
          name,
          description
        ),
        reported_by_user:an_users!disciplinary_matters_reported_by_fkey (
          id,
          email,
          name
        ),
        assigned_to_user:an_users!disciplinary_matters_assigned_to_fkey (
          id,
          email,
          name
        ),
        resolved_by_user:an_users!disciplinary_matters_resolved_by_fkey (
          id,
          email,
          name
        )
      `,
        { count: 'exact' }
      )

    // Apply filters
    if (filters?.pilotId) {
      query = query.eq('pilot_id', filters.pilotId)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.severity) {
      query = query.eq('severity', filters.severity)
    }

    if (filters?.incidentTypeId) {
      query = query.eq('incident_type_id', filters.incidentTypeId)
    }

    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo)
    }

    if (filters?.reportedBy) {
      query = query.eq('reported_by', filters.reportedBy)
    }

    if (filters?.startDate) {
      query = query.gte('incident_date', filters.startDate.toISOString())
    }

    if (filters?.endDate) {
      query = query.lte('incident_date', filters.endDate.toISOString())
    }

    if (!filters?.includeResolved) {
      query = query.neq('status', 'RESOLVED').neq('status', 'CLOSED')
    }

    // Search query
    if (filters?.searchQuery) {
      query = query.or(
        `title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,flight_number.ilike.%${filters.searchQuery}%`
      )
    }

    // Sorting
    const sortBy = filters?.sortBy || 'incident_date'
    const sortOrder = filters?.sortOrder || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Pagination
    if (filters?.page && filters?.pageSize) {
      const from = (filters.page - 1) * filters.pageSize
      const to = from + filters.pageSize - 1
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching disciplinary matters:', error)
      return { success: false, error: 'Failed to fetch disciplinary matters' }
    }

    return {
      success: true,
      data: {
        matters: (data as DisciplinaryMatterWithRelations[]) || [],
        totalCount: count || 0,
      },
    }
  } catch (error) {
    console.error('Error in getMatters:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Get single disciplinary matter by ID with full relations
 */
export async function getMatterById(matterId: string): Promise<ServiceResponse<DisciplinaryMatterWithRelations>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('disciplinary_matters')
      .select(
        `
        *,
        pilot:pilots!disciplinary_matters_pilot_id_fkey (
          id,
          first_name,
          last_name,
          role,
          employee_id,
          commencement_date
        ),
        incident_type:incident_types!disciplinary_matters_incident_type_id_fkey (
          id,
          name,
          description
        ),
        reported_by_user:an_users!disciplinary_matters_reported_by_fkey (
          id,
          email,
          name
        ),
        assigned_to_user:an_users!disciplinary_matters_assigned_to_fkey (
          id,
          email,
          name
        ),
        resolved_by_user:an_users!disciplinary_matters_resolved_by_fkey (
          id,
          email,
          name
        )
      `
      )
      .eq('id', matterId)
      .single()

    if (error) {
      console.error('Error fetching matter by ID:', error)
      return { success: false, error: 'Failed to fetch matter' }
    }

    if (!data) {
      return { success: false, error: 'Matter not found' }
    }

    return { success: true, data: data as DisciplinaryMatterWithRelations }
  } catch (error) {
    console.error('Error in getMatterById:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Get matter with complete timeline of actions
 * NOTE: Actions timeline functionality removed - disciplinary_actions table no longer exists
 */
export async function getMatterWithTimeline(
  matterId: string
): Promise<ServiceResponse<DisciplinaryMatterWithRelations>> {
  try {
    // Get the matter (actions table no longer exists)
    const matterResult = await getMatterById(matterId)
    return matterResult
  } catch (error) {
    console.error('Error in getMatterWithTimeline:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Create new disciplinary matter
 */
export async function createMatter(
  matterData: Omit<DisciplinaryMatterInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<ServiceResponse<DisciplinaryMatter>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Insert matter
    const { data: matter, error } = await supabase
      .from('disciplinary_matters')
      .insert({
        ...matterData,
        reported_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating matter:', error)
      return { success: false, error: 'Failed to create matter' }
    }

    // Create audit log
    await createAuditLog({
      action: 'INSERT',
      tableName: 'disciplinary_matters',
      recordId: matter.id,
      newData: matter,
    })

    // Send notification to assigned user if specified
    if (matterData.assigned_to) {
      // TODO: Implement notification system
      console.log(`Notification: Matter assigned to user ${matterData.assigned_to}`)
    }

    // Send notification to pilot
    if (matterData.pilot_id) {
      // TODO: Implement notification system
      console.log(`Notification: Disciplinary matter created for pilot ${matterData.pilot_id}`)
    }

    return { success: true, data: matter }
  } catch (error) {
    console.error('Error in createMatter:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Update existing disciplinary matter
 */
export async function updateMatter(
  matterId: string,
  updates: DisciplinaryMatterUpdate
): Promise<ServiceResponse<DisciplinaryMatter>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get old values for audit
    const { data: oldMatter } = await supabase
      .from('disciplinary_matters')
      .select('*')
      .eq('id', matterId)
      .single()

    if (!oldMatter) {
      return { success: false, error: 'Matter not found' }
    }

    // Auto-set resolved_date if status changed to RESOLVED or CLOSED
    if (
      updates.status &&
      (updates.status === 'RESOLVED' || updates.status === 'CLOSED') &&
      !oldMatter.resolved_date
    ) {
      updates.resolved_date = new Date().toISOString()
      updates.resolved_by = user.id
    }

    // Update matter
    const { data: matter, error } = await supabase
      .from('disciplinary_matters')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matterId)
      .select()
      .single()

    if (error) {
      console.error('Error updating matter:', error)
      return { success: false, error: 'Failed to update matter' }
    }

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      tableName: 'disciplinary_matters',
      recordId: matterId,
      oldData: oldMatter,
      newData: matter,
    })

    // Send notification on status change
    if (updates.status && updates.status !== oldMatter.status) {
      console.log(`Notification: Matter ${matterId} status changed to ${updates.status}`)
    }

    // Send notification on assignment change
    if (updates.assigned_to && updates.assigned_to !== oldMatter.assigned_to) {
      console.log(`Notification: Matter ${matterId} assigned to user ${updates.assigned_to}`)
    }

    return { success: true, data: matter }
  } catch (error) {
    console.error('Error in updateMatter:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Delete disciplinary matter (soft delete by setting status to archived)
 */
export async function deleteMatter(matterId: string): Promise<ServiceResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get old values for audit
    const { data: oldMatter } = await supabase
      .from('disciplinary_matters')
      .select('*')
      .eq('id', matterId)
      .single()

    if (!oldMatter) {
      return { success: false, error: 'Matter not found' }
    }

    // Soft delete (update status)
    const { error } = await supabase
      .from('disciplinary_matters')
      .update({ status: 'CLOSED', updated_at: new Date().toISOString() })
      .eq('id', matterId)

    if (error) {
      console.error('Error deleting matter:', error)
      return { success: false, error: 'Failed to delete matter' }
    }

    // Create audit log
    await createAuditLog({
      action: 'DELETE',
      tableName: 'disciplinary_matters',
      recordId: matterId,
      oldData: oldMatter,
    })

    return { success: true }
  } catch (error) {
    console.error('Error in deleteMatter:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// ============================================================================
// ACTION MANAGEMENT
// ============================================================================
// NOTE: Action management functionality removed - disciplinary_actions table no longer exists

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get disciplinary matter statistics
 */
export async function getMatterStats(filters?: {
  startDate?: Date
  endDate?: Date
  pilotId?: string
}): Promise<ServiceResponse<MatterStats>> {
  try {
    const supabase = await createClient()

    let query = supabase.from('disciplinary_matters').select('*')

    // Apply filters
    if (filters?.startDate) {
      query = query.gte('incident_date', filters.startDate.toISOString())
    }

    if (filters?.endDate) {
      query = query.lte('incident_date', filters.endDate.toISOString())
    }

    if (filters?.pilotId) {
      query = query.eq('pilot_id', filters.pilotId)
    }

    const { data: matters, error } = await query

    if (error) {
      console.error('Error fetching stats:', error)
      return { success: false, error: 'Failed to fetch statistics' }
    }

    if (!matters) {
      return { success: false, error: 'No data found' }
    }

    // Calculate statistics
    const totalMatters = matters.length
    const openMatters = matters.filter(
      (m) => m.status !== 'RESOLVED' && m.status !== 'CLOSED'
    ).length
    const resolvedMatters = matters.filter(
      (m) => m.status === 'RESOLVED' || m.status === 'CLOSED'
    ).length
    const underInvestigation = matters.filter((m) => m.status === 'UNDER_INVESTIGATION').length

    // By severity
    const bySeverity = {
      minor: matters.filter((m) => m.severity === 'MINOR').length,
      moderate: matters.filter((m) => m.severity === 'MODERATE').length,
      serious: matters.filter((m) => m.severity === 'SERIOUS').length,
      critical: matters.filter((m) => m.severity === 'CRITICAL').length,
    }

    // By status
    const byStatus: { [key: string]: number } = {}
    matters.forEach((m) => {
      const status = m.status || 'UNKNOWN'
      byStatus[status] = (byStatus[status] || 0) + 1
    })

    // Overdue matters (due_date passed and not resolved)
    const now = new Date()
    const overdueMatters = matters.filter(
      (m) =>
        m.due_date &&
        new Date(m.due_date) < now &&
        m.status !== 'RESOLVED' &&
        m.status !== 'CLOSED'
    ).length

    // Average resolution days (for resolved matters)
    const resolvedWithDates = matters.filter(
      (m) => m.resolved_date && (m.status === 'RESOLVED' || m.status === 'CLOSED')
    )
    const totalDays = resolvedWithDates.reduce((sum, m) => {
      if (m.resolved_date && m.reported_date) {
        const reported = new Date(m.reported_date)
        const resolved = new Date(m.resolved_date)
        const days = Math.floor((resolved.getTime() - reported.getTime()) / (1000 * 60 * 60 * 24))
        return sum + days
      }
      return sum
    }, 0)
    const averageResolutionDays = resolvedWithDates.length > 0 ? totalDays / resolvedWithDates.length : 0

    const stats: MatterStats = {
      totalMatters,
      openMatters,
      resolvedMatters,
      underInvestigation,
      bySeverity,
      byStatus,
      overdueMatters,
      averageResolutionDays: Math.round(averageResolutionDays),
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error('Error in getMatterStats:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all incident types
 */
export async function getIncidentTypes(): Promise<
  ServiceResponse<Array<{ id: string; name: string; description: string }>>
> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('incident_types')
      .select('id, name, description')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching incident types:', error)
      return { success: false, error: 'Failed to fetch incident types' }
    }

    // Map to ensure description is never null
    const mappedData = (data || []).map(item => ({
      ...item,
      description: item.description || ''
    }))

    return { success: true, data: mappedData }
  } catch (error) {
    console.error('Error in getIncidentTypes:', error)
    return { success: false, error: 'Internal server error' }
  }
}
