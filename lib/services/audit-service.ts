/**
 * AUDIT SERVICE
 *
 * Comprehensive service for querying, filtering, and exporting audit trail data.
 * Provides functions for audit log retrieval, aggregation, and compliance reporting.
 *
 * Features:
 * - Advanced filtering (user, table, action, date range)
 * - Pagination support for large datasets
 * - Aggregate statistics and user activity summaries
 * - CSV/PDF export functionality
 * - Real-time data with Supabase Realtime support
 *
 * @version 2.0.0
 * @since 2025-10-17
 */

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { logError, logWarning, ErrorSeverity } from '@/lib/error-logger'

// ===================================
// TYPES & INTERFACES
// ===================================

/**
 * Parameters for creating an audit log entry
 */
export interface CreateAuditLogParams {
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'SOFT_DELETE'
  tableName: string
  recordId: string
  oldData?: Record<string, any> | null
  newData?: Record<string, any> | null
  description?: string
  ipAddress?: string
  userAgent?: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  user_email: string | null
  user_role: string | null
  action: string
  table_name: string
  record_id: string
  old_data: any
  new_data: any
  changed_fields: string[] | null
  description: string | null
  ip_address: any
  user_agent: string | null
  created_at: string
  created_at_png: string | null
}

export interface AuditLogFilters {
  userEmail?: string
  tableName?: string
  action?: string
  recordId?: string
  startDate?: Date
  endDate?: Date
  searchQuery?: string
  page?: number
  pageSize?: number
  sortBy?: 'created_at' | 'user_email' | 'table_name' | 'action'
  sortOrder?: 'asc' | 'desc'
}

export interface AuditLogResult {
  logs: AuditLog[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AuditStats {
  totalLogs: number
  totalUsers: number
  totalTables: number
  actionBreakdown: {
    INSERT: number
    UPDATE: number
    DELETE: number
    RESTORE: number
    SOFT_DELETE: number
  }
  tableActivity: {
    table_name: string
    count: number
  }[]
  userActivity: {
    user_email: string
    user_role: string
    count: number
  }[]
  recentActivity: {
    date: string
    count: number
  }[]
}

export interface UserActivitySummary {
  user_email: string
  user_role: string
  total_actions: number
  tables_modified: string[]
  first_action: string
  last_action: string
  action_breakdown: {
    INSERT: number
    UPDATE: number
    DELETE: number
    RESTORE: number
    SOFT_DELETE: number
  }
}

export interface TableModificationHistory {
  table_name: string
  total_modifications: number
  last_modified: string
  recent_changes: {
    user_email: string
    action: string
    timestamp: string
    description: string
  }[]
}

// ===================================
// AUDIT LOG CREATION (HELPER FUNCTION)
// ===================================

/**
 * Create an audit log entry
 * This function should be called from other services to log all CRUD operations
 *
 * @param params - Audit log parameters
 * @returns Promise<void> - Fails silently to not block main operations
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    const supabase = await createClient()

    // Get current user information
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      logWarning('Failed to get user during audit log creation', {
        source: 'AuditService',
        metadata: {
          operation: 'createAuditLog',
          error: userError?.message || String(userError),
        },
      })
    }

    // Calculate changed fields if both old and new data provided
    let changedFields: string[] | null = null
    if (params.oldData && params.newData) {
      // Get all unique keys from both old and new data
      const allKeys = new Set([...Object.keys(params.oldData), ...Object.keys(params.newData)])

      changedFields = Array.from(allKeys).filter((key) => {
        const oldValue = params.oldData![key]
        const newValue = params.newData![key]

        // Handle undefined explicitly to avoid false positives
        if (oldValue === undefined && newValue === undefined) {
          return false
        }

        // Consider undefined and null as different values
        if (oldValue === undefined || newValue === undefined) {
          return true
        }

        // Use JSON.stringify for deep comparison of objects/arrays
        return JSON.stringify(oldValue) !== JSON.stringify(newValue)
      })
    }

    // Get user role from an_users table if user exists
    let userRole: string | null = null
    if (user?.id) {
      const { data: anUser } = await supabase
        .from('an_users')
        .select('role')
        .eq('id', user.id)
        .single()

      userRole = anUser?.role || null
    }

    // Create audit log entry
    const { error: insertError } = await supabase.from('audit_logs').insert({
      user_id: user?.id || null,
      user_email: user?.email || null,
      user_role: userRole,
      action: params.action,
      table_name: params.tableName,
      record_id: params.recordId,
      old_data: params.oldData || null,
      new_data: params.newData || null,
      changed_fields: changedFields,
      description: params.description || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      created_at_png: new Date().toISOString(), // PNG timezone
    })

    if (insertError) {
      logError(insertError as Error, {
        source: 'AuditService',
        severity: ErrorSeverity.LOW,
        metadata: {
          operation: 'createAuditLog',
          action: params.action,
          tableName: params.tableName,
        },
      })
      // Don't throw error - audit logging should not break main operations
    }
  } catch (error) {
    logError(error as Error, {
      source: 'AuditService',
      severity: ErrorSeverity.LOW,
      metadata: { operation: 'createAuditLog' },
    })
    // Fail silently to not block main operations
  }
}

// ===================================
// AUDIT LOG QUERY FUNCTIONS
// ===================================

/**
 * Get audit logs with advanced filtering and pagination
 */
export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogResult> {
  const supabase = await createClient()
  const {
    userEmail,
    tableName,
    action,
    recordId,
    startDate,
    endDate,
    searchQuery,
    page = 1,
    pageSize = 50,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = filters

  try {
    // Build query
    let query = supabase.from('audit_logs').select('*', { count: 'exact' })

    // Apply filters
    if (userEmail) {
      query = query.eq('user_email', userEmail)
    }

    if (tableName) {
      query = query.eq('table_name', tableName)
    }

    if (action) {
      query = query.eq('action', action)
    }

    if (recordId) {
      query = query.eq('record_id', recordId)
    }

    if (startDate) {
      query = query.gte('created_at', startOfDay(startDate).toISOString())
    }

    if (endDate) {
      query = query.lte('created_at', endOfDay(endDate).toISOString())
    }

    // Search in description field
    if (searchQuery) {
      query = query.ilike('description', `%${searchQuery}%`)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      logError(error as Error, {
        source: 'AuditService',
        severity: ErrorSeverity.MEDIUM,
        metadata: { operation: 'getAuditLogs' },
      })
      throw error
    }

    const totalPages = Math.ceil((count || 0) / pageSize)

    return {
      logs: data || [],
      totalCount: count || 0,
      page,
      pageSize,
      totalPages,
    }
  } catch (error) {
    logError(error as Error, {
      source: 'AuditService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getAuditLogs' },
    })
    throw error
  }
}

/**
 * Get a single audit log entry by ID
 */
export async function getAuditLogById(id: string): Promise<AuditLog | null> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from('audit_logs').select('*').eq('id', id).single()

    if (error) {
      logError(error as Error, {
        source: 'AuditService',
        severity: ErrorSeverity.MEDIUM,
        metadata: { operation: 'getAuditLogById' },
      })
      throw error
    }

    return data
  } catch (error) {
    logError(error as Error, {
      source: 'AuditService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getAuditLogById' },
    })
    return null
  }
}

/**
 * Get audit history for a specific record
 */
export async function getRecordAuditHistory(
  tableName: string,
  recordId: string
): Promise<AuditLog[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', tableName)
      .eq('record_id', recordId)
      .order('created_at', { ascending: false })

    if (error) {
      logError(error as Error, {
        source: 'AuditService',
        severity: ErrorSeverity.MEDIUM,
        metadata: { operation: 'getRecordAuditHistory' },
      })
      throw error
    }

    return data || []
  } catch (error) {
    logError(error as Error, {
      source: 'AuditService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getRecordAuditHistory' },
    })
    return []
  }
}

/**
 * Get recent audit activity (last 7 days by default)
 */
export async function getRecentAuditActivity(days: number = 7): Promise<AuditLog[]> {
  const supabase = await createClient()
  const startDate = subDays(new Date(), days)

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      logError(error as Error, {
        source: 'AuditService',
        severity: ErrorSeverity.MEDIUM,
        metadata: { operation: 'getRecentAuditActivity' },
      })
      throw error
    }

    return data || []
  } catch (error) {
    logError(error as Error, {
      source: 'AuditService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getRecentAuditActivity' },
    })
    return []
  }
}

// ===================================
// AGGREGATE STATISTICS
// ===================================

/**
 * Get comprehensive audit statistics
 */
export async function getAuditStats(startDate?: Date, endDate?: Date): Promise<AuditStats> {
  const supabase = await createClient()

  try {
    // Build base query
    let query = supabase.from('audit_logs').select('*')

    if (startDate) {
      query = query.gte('created_at', startOfDay(startDate).toISOString())
    }

    if (endDate) {
      query = query.lte('created_at', endOfDay(endDate).toISOString())
    }

    const { data, error } = await query

    if (error) {
      logError(error as Error, {
        source: 'AuditService',
        severity: ErrorSeverity.MEDIUM,
        metadata: { operation: 'getAuditStats' },
      })
      throw error
    }

    const logs = data || []

    // Calculate statistics
    const totalLogs = logs.length

    // Count unique users
    const uniqueUsers = new Set(logs.map((log) => log.user_email).filter(Boolean))
    const totalUsers = uniqueUsers.size

    // Count unique tables
    const uniqueTables = new Set(logs.map((log) => log.table_name))
    const totalTables = uniqueTables.size

    // Action breakdown
    const actionBreakdown = {
      INSERT: logs.filter((log) => log.action === 'INSERT').length,
      UPDATE: logs.filter((log) => log.action === 'UPDATE').length,
      DELETE: logs.filter((log) => log.action === 'DELETE').length,
      RESTORE: logs.filter((log) => log.action === 'RESTORE').length,
      SOFT_DELETE: logs.filter((log) => log.action === 'SOFT_DELETE').length,
    }

    // Table activity
    const tableActivityMap = new Map<string, number>()
    logs.forEach((log) => {
      const count = tableActivityMap.get(log.table_name) || 0
      tableActivityMap.set(log.table_name, count + 1)
    })
    const tableActivity = Array.from(tableActivityMap.entries())
      .map(([table_name, count]) => ({ table_name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // User activity
    const userActivityMap = new Map<string, { role: string; count: number }>()
    logs.forEach((log) => {
      if (log.user_email) {
        const existing = userActivityMap.get(log.user_email) || {
          role: log.user_role || 'Unknown',
          count: 0,
        }
        userActivityMap.set(log.user_email, {
          role: log.user_role || existing.role,
          count: existing.count + 1,
        })
      }
    })
    const userActivity = Array.from(userActivityMap.entries())
      .map(([user_email, { role, count }]) => ({
        user_email,
        user_role: role,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Recent activity (last 30 days by date)
    const thirtyDaysAgo = subDays(new Date(), 30)
    const recentLogs = logs.filter((log) => new Date(log.created_at) >= thirtyDaysAgo)
    const activityByDate = new Map<string, number>()
    recentLogs.forEach((log) => {
      const date = format(new Date(log.created_at), 'yyyy-MM-dd')
      const count = activityByDate.get(date) || 0
      activityByDate.set(date, count + 1)
    })
    const recentActivity = Array.from(activityByDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalLogs,
      totalUsers,
      totalTables,
      actionBreakdown,
      tableActivity,
      userActivity,
      recentActivity,
    }
  } catch (error) {
    logError(error as Error, {
      source: 'AuditService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getAuditStats' },
    })
    throw error
  }
}

/**
 * Get user activity summary for a specific user
 */
export async function getUserActivitySummary(
  userEmail: string,
  startDate?: Date,
  endDate?: Date
): Promise<UserActivitySummary | null> {
  const supabase = await createClient()

  try {
    let query = supabase.from('audit_logs').select('*').eq('user_email', userEmail)

    if (startDate) {
      query = query.gte('created_at', startOfDay(startDate).toISOString())
    }

    if (endDate) {
      query = query.lte('created_at', endOfDay(endDate).toISOString())
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      logError(error as Error, {
        source: 'AuditService',
        severity: ErrorSeverity.MEDIUM,
        metadata: { operation: 'getUserActivitySummary' },
      })
      throw error
    }

    const logs = data || []

    if (logs.length === 0) {
      return null
    }

    // Calculate summary
    const total_actions = logs.length
    const tables_modified = [...new Set(logs.map((log) => log.table_name))]
    const first_action = logs[logs.length - 1].created_at
    const last_action = logs[0].created_at
    const user_role = logs[0].user_role || 'Unknown'

    const action_breakdown = {
      INSERT: logs.filter((log) => log.action === 'INSERT').length,
      UPDATE: logs.filter((log) => log.action === 'UPDATE').length,
      DELETE: logs.filter((log) => log.action === 'DELETE').length,
      RESTORE: logs.filter((log) => log.action === 'RESTORE').length,
      SOFT_DELETE: logs.filter((log) => log.action === 'SOFT_DELETE').length,
    }

    return {
      user_email: userEmail,
      user_role,
      total_actions,
      tables_modified,
      first_action,
      last_action,
      action_breakdown,
    }
  } catch (error) {
    logError(error as Error, {
      source: 'AuditService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getUserActivitySummary' },
    })
    return null
  }
}

/**
 * Get table modification history
 */
export async function getTableModificationHistory(
  tableName: string,
  limit: number = 10
): Promise<TableModificationHistory | null> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', tableName)
      .order('created_at', { ascending: false })

    if (error) {
      logError(error as Error, {
        source: 'AuditService',
        severity: ErrorSeverity.MEDIUM,
        metadata: { operation: 'getTableModificationHistory' },
      })
      throw error
    }

    const logs = data || []

    if (logs.length === 0) {
      return null
    }

    const total_modifications = logs.length
    const last_modified = logs[0].created_at

    const recent_changes = logs.slice(0, limit).map((log) => ({
      user_email: log.user_email || 'System',
      action: log.action,
      timestamp: log.created_at,
      description: log.description || 'No description',
    }))

    return {
      table_name: tableName,
      total_modifications,
      last_modified,
      recent_changes,
    }
  } catch (error) {
    logError(error as Error, {
      source: 'AuditService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getTableModificationHistory' },
    })
    return null
  }
}

// ===================================
// EXPORT FUNCTIONS
// ===================================

/**
 * Export audit logs to CSV format
 */
export function exportAuditLogsToCSV(logs: AuditLog[]): string {
  // CSV headers
  const headers = [
    'Timestamp',
    'User Email',
    'User Role',
    'Action',
    'Table',
    'Record ID',
    'Description',
    'Changed Fields',
    'IP Address',
  ]

  // Convert logs to CSV rows
  const rows = logs.map((log) => [
    log.created_at_png || log.created_at,
    log.user_email || 'System',
    log.user_role || 'N/A',
    log.action,
    log.table_name,
    log.record_id,
    log.description || '',
    (log.changed_fields || []).join('; '),
    log.ip_address || 'N/A',
  ])

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Download audit logs as CSV file (client-side only)
 */
export function downloadAuditLogsCSV(logs: AuditLog[], filename?: string): void {
  if (typeof window === 'undefined') {
    logWarning('downloadAuditLogsCSV can only be called on the client side', {
      source: 'AuditService',
      metadata: {
        operation: 'downloadAuditLogsCSV',
      },
    })
    return
  }

  const csv = exportAuditLogsToCSV(logs)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute(
    'download',
    filename || `audit-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`
  )
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Get list of all unique tables in audit logs
 */
export async function getAuditedTables(): Promise<string[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from('audit_logs').select('table_name')

    if (error) {
      logError(error as Error, {
        source: 'AuditService',
        severity: ErrorSeverity.MEDIUM,
        metadata: { operation: 'getAuditedTables' },
      })
      throw error
    }

    const tables = [...new Set((data || []).map((log) => log.table_name))]
    return tables.sort()
  } catch (error) {
    logError(error as Error, {
      source: 'AuditService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getAuditedTables' },
    })
    return []
  }
}

/**
 * Get list of all users in audit logs
 */
export async function getAuditedUsers(): Promise<{ email: string; role: string }[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('user_email, user_role')
      .not('user_email', 'is', null)

    if (error) {
      logError(error as Error, {
        source: 'AuditService',
        severity: ErrorSeverity.MEDIUM,
        metadata: { operation: 'getAuditedUsers' },
      })
      throw error
    }

    // Get unique users
    const userMap = new Map<string, string>()
    ;(data || []).forEach((log) => {
      if (log.user_email && !userMap.has(log.user_email)) {
        userMap.set(log.user_email, log.user_role || 'Unknown')
      }
    })

    const users = Array.from(userMap.entries()).map(([email, role]) => ({
      email,
      role,
    }))

    return users.sort((a, b) => a.email.localeCompare(b.email))
  } catch (error) {
    logError(error as Error, {
      source: 'AuditService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getAuditedUsers' },
    })
    return []
  }
}

// ===================================
// COMPLIANCE & CERTIFICATION AUDIT
// ===================================

/**
 * Get certification modification audit trail (for regulatory compliance)
 */
export async function getCertificationAuditTrail(
  startDate?: Date,
  endDate?: Date
): Promise<AuditLog[]> {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'pilot_checks')
      .order('created_at', { ascending: false })

    if (startDate) {
      query = query.gte('created_at', startOfDay(startDate).toISOString())
    }

    if (endDate) {
      query = query.lte('created_at', endOfDay(endDate).toISOString())
    }

    const { data, error } = await query

    if (error) {
      logError(error as Error, {
        source: 'AuditService',
        severity: ErrorSeverity.MEDIUM,
        metadata: { operation: 'getCertificationAuditTrail' },
      })
      throw error
    }

    return data || []
  } catch (error) {
    logError(error as Error, {
      source: 'AuditService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getCertificationAuditTrail' },
    })
    return []
  }
}

/**
 * Get pilot record modification audit trail
 */
export async function getPilotAuditTrail(
  pilotId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<AuditLog[]> {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'pilots')
      .order('created_at', { ascending: false })

    if (pilotId) {
      query = query.eq('record_id', pilotId)
    }

    if (startDate) {
      query = query.gte('created_at', startOfDay(startDate).toISOString())
    }

    if (endDate) {
      query = query.lte('created_at', endOfDay(endDate).toISOString())
    }

    const { data, error } = await query

    if (error) {
      logError(error as Error, {
        source: 'AuditService',
        severity: ErrorSeverity.MEDIUM,
        metadata: { operation: 'getPilotAuditTrail' },
      })
      throw error
    }

    return data || []
  } catch (error) {
    logError(error as Error, {
      source: 'AuditService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getPilotAuditTrail' },
    })
    return []
  }
}
