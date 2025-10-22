/**
 * Admin Service
 * Handles administrative operations including user management, check types, and system settings
 */

import 'server-only'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager'
  created_at: string | null
  updated_at: string | null
}

export interface CheckType {
  id: string
  check_code: string
  check_description: string
  category: string | null
  created_at: string
  updated_at: string
}

export interface SystemSetting {
  id: string
  key: string
  value: any
  description: string | null
  created_at: string | null
  updated_at: string | null
}

export interface ContractType {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AdminStats {
  totalAdmins: number
  totalManagers: number
  totalPilots: number
  totalCheckTypes: number
  totalCertifications: number
  totalLeaveRequests: number
  systemStatus: 'operational' | 'warning' | 'error'
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Get all admin and manager users
 */
export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('an_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // Log error type only, no user data
      console.error('Error fetching admin users:', {
        errorCode: error.code,
        errorMessage: error.message
      })
      throw new Error(`Failed to fetch admin users: ${error.message}`)
    }

    return (data || []) as AdminUser[]
  } catch (error) {
    // Log error type only, no user data
    console.error('Error in getAdminUsers:', {
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

/**
 * Get a single admin user by ID
 */
export async function getAdminUserById(userId: string): Promise<AdminUser | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('an_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      // Log error type only, no user data
      console.error('Error fetching admin user:', {
        errorCode: error.code,
        errorMessage: error.message
      })
      throw new Error(`Failed to fetch admin user: ${error.message}`)
    }

    return data as AdminUser | null
  } catch (error) {
    // Log error type only, no user data or IDs
    console.error('Error in getAdminUserById:', {
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

// ============================================================================
// CHECK TYPES MANAGEMENT
// ============================================================================

/**
 * Get all check types
 */
export async function getCheckTypes(): Promise<CheckType[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('check_types')
      .select('*')
      .order('check_code', { ascending: true })

    if (error) {
      console.error('Error fetching check types:', error)
      throw new Error(`Failed to fetch check types: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error in getCheckTypes:', error)
    throw error
  }
}

/**
 * Get check types by category
 */
export async function getCheckTypesByCategory(category: string): Promise<CheckType[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('check_types')
      .select('*')
      .eq('category', category)
      .order('check_code', { ascending: true })

    if (error) {
      console.error('Error fetching check types by category:', error)
      throw new Error(`Failed to fetch check types: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error in getCheckTypesByCategory:', error)
    throw error
  }
}

/**
 * Get unique check type categories
 */
export async function getCheckTypeCategories(): Promise<string[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('check_types')
      .select('category')
      .not('category', 'is', null)
      .order('category', { ascending: true })

    if (error) {
      console.error('Error fetching check type categories:', error)
      throw new Error(`Failed to fetch categories: ${error.message}`)
    }

    // Extract unique categories
    const categories = Array.from(new Set(data?.map(item => item.category).filter(Boolean) || []))
    return categories as string[]
  } catch (error) {
    console.error('Error in getCheckTypeCategories:', error)
    throw error
  }
}

// ============================================================================
// SYSTEM SETTINGS
// ============================================================================

/**
 * Get all system settings
 */
export async function getSystemSettings(): Promise<SystemSetting[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('key', { ascending: true })

    if (error) {
      console.error('Error fetching system settings:', error)
      throw new Error(`Failed to fetch system settings: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error in getSystemSettings:', error)
    throw error
  }
}

/**
 * Get a specific system setting by key
 */
export async function getSystemSetting(key: string): Promise<SystemSetting | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', key)
      .single()

    if (error) {
      console.error('Error fetching system setting:', error)
      throw new Error(`Failed to fetch system setting: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error in getSystemSetting:', error)
    throw error
  }
}

/**
 * Update a system setting
 */
export async function updateSystemSetting(
  id: string,
  updates: { value?: any; description?: string }
): Promise<SystemSetting> {
  try {
    const supabase = await createClient()

    console.log('🔄 updateSystemSetting - Before update:', {
      id,
      updates: JSON.stringify(updates),
    })

    const { data, error } = await supabase
      .from('settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ updateSystemSetting - Database error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      throw new Error(`Failed to update system setting: ${error.message}`)
    }

    console.log('✅ updateSystemSetting - Success:', {
      id: data.id,
      key: data.key,
      value: JSON.stringify(data.value),
      updated_at: data.updated_at,
    })

    return data
  } catch (error) {
    console.error('❌ updateSystemSetting - Error:', error)
    throw error
  }
}

/**
 * Get the application title from settings
 * Returns a default value if not found
 */
export async function getAppTitle(): Promise<string> {
  try {
    const supabase = await createClient()

    // Fetch directly without caching to get fresh data
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'app_title')
      .single()

    if (error) {
      console.error('Error fetching app title:', error)
      return 'Fleet Office Management'
    }

    if (data && data.value) {
      // Handle both string and object value formats
      if (typeof data.value === 'string') {
        return data.value
      } else if (
        typeof data.value === 'object' &&
        data.value !== null &&
        !Array.isArray(data.value) &&
        'title' in data.value &&
        typeof data.value.title === 'string'
      ) {
        return data.value.title
      }
    }

    // Default fallback
    return 'Fleet Office Management'
  } catch (error) {
    console.error('Error getting app title:', error)
    // Return default on error
    return 'Fleet Office Management'
  }
}

/**
 * Get pilot requirements from settings
 * Returns default values if not found
 */
export async function getPilotRequirements(): Promise<{
  pilot_retirement_age: number
  number_of_aircraft: number
  captains_per_hull: number
  first_officers_per_hull: number
  minimum_captains_per_hull: number
  minimum_first_officers_per_hull: number
  training_captains_per_pilots: number
  examiners_per_pilots: number
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'pilot_requirements')
      .single()

    if (error) {
      console.error('Error fetching pilot requirements:', error)
      return getDefaultPilotRequirements()
    }

    if (
      data &&
      data.value &&
      typeof data.value === 'object' &&
      data.value !== null &&
      !Array.isArray(data.value)
    ) {
      const value = data.value as Record<string, unknown>
      return {
        pilot_retirement_age:
          typeof value.pilot_retirement_age === 'number' ? value.pilot_retirement_age : 65,
        number_of_aircraft: typeof value.number_of_aircraft === 'number' ? value.number_of_aircraft : 2,
        captains_per_hull: typeof value.captains_per_hull === 'number' ? value.captains_per_hull : 7,
        first_officers_per_hull:
          typeof value.first_officers_per_hull === 'number' ? value.first_officers_per_hull : 7,
        minimum_captains_per_hull:
          typeof value.minimum_captains_per_hull === 'number' ? value.minimum_captains_per_hull : 10,
        minimum_first_officers_per_hull:
          typeof value.minimum_first_officers_per_hull === 'number'
            ? value.minimum_first_officers_per_hull
            : 10,
        training_captains_per_pilots:
          typeof value.training_captains_per_pilots === 'number'
            ? value.training_captains_per_pilots
            : 11,
        examiners_per_pilots:
          typeof value.examiners_per_pilots === 'number' ? value.examiners_per_pilots : 11,
      }
    }

    return getDefaultPilotRequirements()
  } catch (error) {
    console.error('Error getting pilot requirements:', error)
    return getDefaultPilotRequirements()
  }
}

/**
 * Get alert thresholds from settings
 * Returns default values if not found
 */
export async function getAlertThresholds(): Promise<{
  critical_days: number
  urgent_days: number
  warning_30_days: number
  warning_60_days: number
  early_warning_90_days: number
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'alert_thresholds')
      .single()

    if (error) {
      console.error('Error fetching alert thresholds:', error)
      return getDefaultAlertThresholds()
    }

    if (
      data &&
      data.value &&
      typeof data.value === 'object' &&
      data.value !== null &&
      !Array.isArray(data.value)
    ) {
      const value = data.value as Record<string, unknown>
      return {
        critical_days: typeof value.critical_days === 'number' ? value.critical_days : 7,
        urgent_days: typeof value.urgent_days === 'number' ? value.urgent_days : 14,
        warning_30_days: typeof value.warning_30_days === 'number' ? value.warning_30_days : 30,
        warning_60_days: typeof value.warning_60_days === 'number' ? value.warning_60_days : 60,
        early_warning_90_days:
          typeof value.early_warning_90_days === 'number' ? value.early_warning_90_days : 90,
      }
    }

    return getDefaultAlertThresholds()
  } catch (error) {
    console.error('Error getting alert thresholds:', error)
    return getDefaultAlertThresholds()
  }
}

/**
 * Default pilot requirements (fallback)
 */
function getDefaultPilotRequirements() {
  return {
    pilot_retirement_age: 65,
    number_of_aircraft: 2,
    captains_per_hull: 7,
    first_officers_per_hull: 7,
    minimum_captains_per_hull: 10,
    minimum_first_officers_per_hull: 10,
    training_captains_per_pilots: 11,
    examiners_per_pilots: 11,
  }
}

/**
 * Default alert thresholds (fallback)
 */
function getDefaultAlertThresholds() {
  return {
    critical_days: 7,
    urgent_days: 14,
    warning_30_days: 30,
    warning_60_days: 60,
    early_warning_90_days: 90,
  }
}

// ============================================================================
// CONTRACT TYPES
// ============================================================================

/**
 * Get all contract types
 */
export async function getContractTypes(): Promise<ContractType[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contract_types')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching contract types:', error)
      throw new Error(`Failed to fetch contract types: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error in getContractTypes:', error)
    throw error
  }
}

// ============================================================================
// ADMIN STATISTICS
// ============================================================================

/**
 * Get comprehensive admin statistics
 */
export async function getAdminStats(): Promise<AdminStats> {
  try {
    const supabase = await createClient()

    // Fetch all stats in parallel
    const [_usersData, pilotsData, checkTypesData, certificationsData, leaveRequestsData] =
      await Promise.all([
        supabase.from('an_users').select('role', { count: 'exact', head: true }),
        supabase.from('pilots').select('*', { count: 'exact', head: true }),
        supabase.from('check_types').select('*', { count: 'exact', head: true }),
        supabase.from('pilot_checks').select('*', { count: 'exact', head: true }),
        supabase.from('leave_requests').select('*', { count: 'exact', head: true }),
      ])

    // Count admins and managers separately
    const { data: users } = await supabase.from('an_users').select('role')
    const totalAdmins = users?.filter(u => u.role === 'admin').length || 0
    const totalManagers = users?.filter(u => u.role === 'manager').length || 0

    return {
      totalAdmins,
      totalManagers,
      totalPilots: pilotsData.count || 0,
      totalCheckTypes: checkTypesData.count || 0,
      totalCertifications: certificationsData.count || 0,
      totalLeaveRequests: leaveRequestsData.count || 0,
      systemStatus: 'operational', // Default to operational
    }
  } catch (error) {
    console.error('Error in getAdminStats:', error)
    throw error
  }
}
