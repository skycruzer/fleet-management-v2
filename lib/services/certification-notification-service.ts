/** Developer: Maurice Rondeau */

/**
 * Certification Notification Service
 *
 * Manages email notification logic for certification expiry reminders.
 * Handles check-type-level reminder configuration, deduplication via
 * certification_email_log, and notification level determination.
 *
 * @version 1.0.0
 * @since 2026-02
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/supabase'
import { logError, logInfo, ErrorSeverity } from '@/lib/error-logger'

// ===================================
// TYPES
// ===================================

type NotificationLevel = Database['public']['Enums']['notification_level']
type NotificationStatus = Database['public']['Enums']['notification_status']

type EmailLogRow = Database['public']['Tables']['certification_email_log']['Row']
type EmailLogInsert = Database['public']['Tables']['certification_email_log']['Insert']

export interface CheckTypeReminderSettings {
  id: string
  check_code: string
  check_description: string
  category: string | null
  reminder_days: number[] | null
  email_notifications_enabled: boolean
}

export interface NotificationHistoryFilters {
  pilot_id?: string
  check_type_id?: string
  from_date?: string
  to_date?: string
  notification_level?: NotificationLevel
  notification_status?: NotificationStatus
}

export interface LogNotificationParams {
  pilot_id: string
  pilot_check_id: string
  check_type_id: string
  notification_level: NotificationLevel
  notification_status: NotificationStatus
  email_address: string
  sent_at?: string | null
  error_message?: string | null
}

// Ordered thresholds for level determination (checked from smallest to largest)
const LEVEL_THRESHOLDS: { max: number; level: NotificationLevel }[] = [
  { max: 0, level: 'EXPIRED' },
  { max: 7, level: '7_DAYS' },
  { max: 14, level: '14_DAYS' },
  { max: 30, level: '30_DAYS' },
  { max: 60, level: '60_DAYS' },
  { max: 90, level: '90_DAYS' },
]

// ===================================
// READ OPERATIONS
// ===================================

/**
 * Fetch all check types with their reminder configuration.
 * Used by the admin settings UI to display/edit reminder settings.
 */
export async function getCheckTypeReminderSettings(): Promise<CheckTypeReminderSettings[]> {
  const supabase = createAdminClient()

  try {
    const { data, error } = await supabase
      .from('check_types')
      .select(
        'id, check_code, check_description, category, reminder_days, email_notifications_enabled'
      )
      .order('check_code', { ascending: true })

    if (error) throw error

    return data || []
  } catch (error) {
    logError(error as Error, {
      source: 'certification-notification-service:getCheckTypeReminderSettings',
      severity: ErrorSeverity.HIGH,
      metadata: { operation: 'fetchReminderSettings' },
    })
    throw error
  }
}

/**
 * Check if a notification has already been sent for a specific
 * pilot_check + notification_level combination (deduplication).
 */
export async function hasNotificationBeenSent(
  pilotCheckId: string,
  level: NotificationLevel
): Promise<boolean> {
  const supabase = createAdminClient()

  try {
    const { count, error } = await supabase
      .from('certification_email_log')
      .select('id', { count: 'exact', head: true })
      .eq('pilot_check_id', pilotCheckId)
      .eq('notification_level', level)
      .in('notification_status', ['SENT', 'PENDING'])

    if (error) throw error

    return (count ?? 0) > 0
  } catch (error) {
    logError(error as Error, {
      source: 'certification-notification-service:hasNotificationBeenSent',
      severity: ErrorSeverity.MEDIUM,
      metadata: { pilotCheckId, level },
    })
    throw error
  }
}

/**
 * Query notification history with optional filters.
 * Supports filtering by pilot, check type, date range, level, and status.
 */
export async function getNotificationHistory(
  filters?: NotificationHistoryFilters
): Promise<EmailLogRow[]> {
  const supabase = createAdminClient()

  try {
    let query = supabase
      .from('certification_email_log')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.pilot_id) {
      query = query.eq('pilot_id', filters.pilot_id)
    }
    if (filters?.check_type_id) {
      query = query.eq('check_type_id', filters.check_type_id)
    }
    if (filters?.notification_level) {
      query = query.eq('notification_level', filters.notification_level)
    }
    if (filters?.notification_status) {
      query = query.eq('notification_status', filters.notification_status)
    }
    if (filters?.from_date) {
      query = query.gte('created_at', filters.from_date)
    }
    if (filters?.to_date) {
      query = query.lte('created_at', filters.to_date)
    }

    const { data, error } = await query

    if (error) throw error

    return data || []
  } catch (error) {
    logError(error as Error, {
      source: 'certification-notification-service:getNotificationHistory',
      severity: ErrorSeverity.MEDIUM,
      metadata: { filters },
    })
    throw error
  }
}

// ===================================
// WRITE OPERATIONS
// ===================================

/**
 * Update reminder configuration for a specific check type.
 */
export async function updateCheckTypeReminderSettings(
  checkTypeId: string,
  settings: { reminder_days: number[]; email_notifications_enabled: boolean }
): Promise<void> {
  const supabase = createAdminClient()

  try {
    const { error } = await supabase
      .from('check_types')
      .update({
        reminder_days: settings.reminder_days,
        email_notifications_enabled: settings.email_notifications_enabled,
      })
      .eq('id', checkTypeId)

    if (error) throw error

    logInfo('Updated check type reminder settings', {
      source: 'certification-notification-service:updateCheckTypeReminderSettings',
      metadata: { checkTypeId, ...settings },
    })
  } catch (error) {
    logError(error as Error, {
      source: 'certification-notification-service:updateCheckTypeReminderSettings',
      severity: ErrorSeverity.HIGH,
      metadata: { checkTypeId, settings },
    })
    throw error
  }
}

/**
 * Insert a record into certification_email_log to track a sent (or attempted) notification.
 */
export async function logNotificationSent(params: LogNotificationParams): Promise<EmailLogRow> {
  const supabase = createAdminClient()

  try {
    const insertData: EmailLogInsert = {
      pilot_id: params.pilot_id,
      pilot_check_id: params.pilot_check_id,
      check_type_id: params.check_type_id,
      notification_level: params.notification_level,
      notification_status: params.notification_status,
      email_address: params.email_address,
      sent_at: params.sent_at ?? null,
      error_message: params.error_message ?? null,
    }

    const { data, error } = await supabase
      .from('certification_email_log')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    logInfo('Notification log entry created', {
      source: 'certification-notification-service:logNotificationSent',
      metadata: {
        pilotCheckId: params.pilot_check_id,
        level: params.notification_level,
        status: params.notification_status,
      },
    })

    return data
  } catch (error) {
    logError(error as Error, {
      source: 'certification-notification-service:logNotificationSent',
      severity: ErrorSeverity.HIGH,
      metadata: { params },
    })
    throw error
  }
}

// ===================================
// BUSINESS LOGIC
// ===================================

/**
 * Map days-until-expiry to the appropriate notification level.
 *
 * Returns null if the expiry is beyond 90 days (no notification needed).
 *
 * Thresholds:
 *   < 0   → EXPIRED
 *   <= 7  → 7_DAYS
 *   <= 14 → 14_DAYS
 *   <= 30 → 30_DAYS
 *   <= 60 → 60_DAYS
 *   <= 90 → 90_DAYS
 */
export function determineNotificationLevel(daysUntilExpiry: number): NotificationLevel | null {
  for (const { max, level } of LEVEL_THRESHOLDS) {
    if (daysUntilExpiry <= max) {
      return level
    }
  }
  // Beyond 90 days — no notification level applies
  return null
}

/**
 * Check whether a notification should fire based on the check type's
 * configured reminder_days thresholds.
 *
 * Returns true when daysUntilExpiry crosses one of the configured
 * thresholds (e.g., reminder_days = [90, 60, 30] and days = 28 → true
 * because 28 <= 30).
 */
export function shouldSendNotification(daysUntilExpiry: number, reminderDays: number[]): boolean {
  if (reminderDays.length === 0) return false

  // Sort descending so we check the largest threshold first
  const sorted = [...reminderDays].sort((a, b) => b - a)

  for (const threshold of sorted) {
    if (daysUntilExpiry <= threshold) {
      return true
    }
  }

  return false
}
