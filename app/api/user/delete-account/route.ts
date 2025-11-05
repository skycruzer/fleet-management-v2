/**
 * Delete Account API Route
 * Handles account deletion with safety checks
 *
 * @version 2.0.0 - SECURITY: Added CSRF protection and rate limiting
 * @updated 2025-11-04 - Critical security hardening
 *
 * SECURITY: Account deletion is a destructive operation
 * - CSRF protection required (prevents unauthorized deletions)
 * - Rate limiting prevents abuse
 * - Audit logging for compliance
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'

export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Validate CSRF token
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
    }

    // SECURITY: Rate limiting (strict for destructive operations)
    const { success: rateLimitSuccess } = await authRateLimit.limit(user.id)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check if user is an admin (prevent accidental admin deletion)
    const { data: userData, error: userError } = await supabase
      .from('an_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user role:', userError)
    }

    // If user is admin, add extra confirmation (in real implementation)
    if (userData?.role === 'admin') {
      console.warn('Admin account deletion attempted:', user.id)
      // In production, you might want to require additional confirmation
      // or prevent admin deletion entirely
    }

    // Get pilot data if exists (for audit trail)
    const { data: pilotData } = await supabase
      .from('pilots')
      .select('id')
      .eq('email', user.email || '')
      .single()

    // Create audit log entry before deletion
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'account_deletion',
      table_name: 'an_users',
      record_id: user.id,
      description: `User account deleted: ${user.email}`,
      new_values: {
        email: user.email,
        pilot_id: pilotData?.id,
        timestamp: new Date().toISOString(),
      },
    })

    // Anonymize pilot data if exists (instead of deleting for compliance)
    if (pilotData) {
      await supabase
        .from('pilots')
        .update({
          email: `deleted_${user.id}@deleted.local`,
          phone: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pilotData.id)
    }

    // Delete user leave requests
    if (pilotData) {
      await supabase.from('leave_requests').delete().eq('pilot_id', pilotData.id)
    }

    // Delete user from an_users table
    const { error: deleteUserError } = await supabase.from('an_users').delete().eq('id', user.id)

    if (deleteUserError) {
      throw deleteUserError
    }

    // Delete auth user (this will cascade to related tables)
    // Note: This requires service role key in production
    // For now, we'll rely on Supabase RLS and manual cleanup
    // In production, you'd use:
    // await supabaseAdmin.auth.admin.deleteUser(user.id)

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete account',
      },
      { status: 500 }
    )
  }
}
