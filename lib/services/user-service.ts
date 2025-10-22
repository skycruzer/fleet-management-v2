/**
 * User Service
 * CRUD operations for system users (an_users table)
 *
 * @version 1.0.0
 * @since 2025-10-18
 */

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createAuditLog } from './audit-service'
import { logError, logInfo, ErrorSeverity } from '@/lib/error-logger'

export interface User {
  id: string
  email: string
  name: string
  role: 'Admin' | 'Manager' | 'User'
  created_at: string | null
  updated_at: string | null
}

export interface UserFormData {
  email: string
  name: string
  role: 'Admin' | 'Manager' | 'User'
}

export interface UserWithStats extends User {
  totalActions?: number
  lastLogin?: string | null
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  const supabase = await createClient()

  try {
    const { data: users, error } = await supabase
      .from('an_users')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    return (users || []) as User[]
  } catch (error) {
    logError(error as Error, {
      source: 'user-service:getAllUsers',
      severity: ErrorSeverity.HIGH,
      metadata: { operation: 'fetchAllUsers' },
    })
    throw error
  }
}

/**
 * Get a single user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const supabase = await createClient()

  try {
    const { data: user, error } = await supabase
      .from('an_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }

    return user as User
  } catch (error) {
    logError(error as Error, {
      source: 'user-service:getUserById',
      severity: ErrorSeverity.MEDIUM,
      metadata: { userId },
    })
    throw error
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = await createClient()

  try {
    const { data: user, error } = await supabase
      .from('an_users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }

    return user as User
  } catch (error) {
    logError(error as Error, {
      source: 'user-service:getUserByEmail',
      severity: ErrorSeverity.LOW,
      metadata: { email },
    })
    throw error
  }
}

/**
 * Create a new user
 */
export async function createUser(userData: UserFormData): Promise<User> {
  const supabase = await createClient()

  try {
    // Check if email already exists
    const existingUser = await getUserByEmail(userData.email)
    if (existingUser) {
      throw new Error('A user with this email already exists')
    }

    const { data, error } = await supabase
      .from('an_users')
      .insert({
        email: userData.email,
        name: userData.name,
        role: userData.role,
      })
      .select()
      .single()

    if (error) throw error

    // Audit log the creation
    await createAuditLog({
      action: 'INSERT',
      tableName: 'an_users',
      recordId: data.id,
      newData: data,
      description: `Created user: ${data.name} (${data.email}) with role ${data.role}`,
    })

    logInfo('User created successfully', {
      source: 'user-service:createUser',
      metadata: { userId: data.id, email: data.email },
    })

    return data as User
  } catch (error) {
    logError(error as Error, {
      source: 'user-service:createUser',
      severity: ErrorSeverity.HIGH,
      metadata: { email: userData.email },
    })
    throw error
  }
}

/**
 * Update an existing user
 */
export async function updateUser(userId: string, userData: Partial<UserFormData>): Promise<User> {
  const supabase = await createClient()

  try {
    // If email is being updated, check for duplicates
    if (userData.email) {
      const existingUser = await getUserByEmail(userData.email)
      if (existingUser && existingUser.id !== userId) {
        throw new Error('A user with this email already exists')
      }
    }

    // Get current data for audit log
    const currentUser = await getUserById(userId)
    if (!currentUser) {
      throw new Error('User not found')
    }

    const { data, error } = await supabase
      .from('an_users')
      .update({
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    // Audit log the update
    await createAuditLog({
      action: 'UPDATE',
      tableName: 'an_users',
      recordId: userId,
      oldData: currentUser,
      newData: data,
      description: `Updated user: ${data.name} (${data.email})`,
    })

    logInfo('User updated successfully', {
      source: 'user-service:updateUser',
      metadata: { userId, email: data.email },
    })

    return data as User
  } catch (error) {
    logError(error as Error, {
      source: 'user-service:updateUser',
      severity: ErrorSeverity.HIGH,
      metadata: { userId },
    })
    throw error
  }
}

/**
 * Delete a user
 * NOTE: This will fail if the user has associated records (foreign key constraints)
 */
export async function deleteUser(userId: string): Promise<void> {
  const supabase = await createClient()

  try {
    // Get user data for audit log
    const user = await getUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const { error } = await supabase.from('an_users').delete().eq('id', userId)

    if (error) {
      // Handle foreign key constraint errors
      if (error.code === '23503') {
        throw new Error(
          'Cannot delete user with associated records. Please remove or reassign all related data first.'
        )
      }
      throw error
    }

    // Audit log the deletion
    await createAuditLog({
      action: 'DELETE',
      tableName: 'an_users',
      recordId: userId,
      oldData: user,
      description: `Deleted user: ${user.name} (${user.email})`,
    })

    logInfo('User deleted successfully', {
      source: 'user-service:deleteUser',
      metadata: { userId, email: user.email },
    })
  } catch (error) {
    logError(error as Error, {
      source: 'user-service:deleteUser',
      severity: ErrorSeverity.HIGH,
      metadata: { userId },
    })
    throw error
  }
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: 'Admin' | 'Manager' | 'User'): Promise<User[]> {
  const supabase = await createClient()

  try {
    const { data: users, error } = await supabase
      .from('an_users')
      .select('*')
      .eq('role', role)
      .order('name', { ascending: true })

    if (error) throw error

    return (users || []) as User[]
  } catch (error) {
    logError(error as Error, {
      source: 'user-service:getUsersByRole',
      severity: ErrorSeverity.MEDIUM,
      metadata: { role },
    })
    throw error
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<{
  total: number
  byRole: { Admin: number; Manager: number; User: number }
}> {
  const supabase = await createClient()

  try {
    const { data: users, error } = await supabase.from('an_users').select('role')

    if (error) throw error

    const stats = (users || []).reduce(
      (acc, user) => {
        acc.total++
        if (user.role === 'Admin') acc.byRole.Admin++
        else if (user.role === 'Manager') acc.byRole.Manager++
        else if (user.role === 'User') acc.byRole.User++
        return acc
      },
      {
        total: 0,
        byRole: { Admin: 0, Manager: 0, User: 0 },
      }
    )

    return stats
  } catch (error) {
    logError(error as Error, {
      source: 'user-service:getUserStats',
      severity: ErrorSeverity.LOW,
      metadata: { operation: 'calculateStats' },
    })
    throw error
  }
}
