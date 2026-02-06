/**
 * Notifications Page
 * Author: Maurice Rondeau
 * Displays all user notifications with filtering and actions
 */

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import {
  getUserNotifications,
  markAllNotificationsAsRead,
} from '@/lib/services/notification-service'
import Link from 'next/link'
import { ArrowLeft, Bell, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react'

// Server action for marking all notifications as read
async function markAllAsReadAction(formData: FormData) {
  'use server'
  const userId = formData.get('userId') as string

  if (!userId) {
    return
  }

  await markAllNotificationsAsRead(userId)
  revalidatePath('/dashboard/notifications')
  redirect('/dashboard/notifications')
}

export default async function NotificationsPage() {
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  const userId = auth.userId!

  // Fetch all notifications for the user
  const result = await getUserNotifications(userId, false)
  const notifications =
    result.success && result.data ? (Array.isArray(result.data) ? result.data : [result.data]) : []

  // Separate by read/unread
  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

  // Type icons
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-[var(--color-success-500)]" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-[var(--color-warning-500)]" />
      case 'error':
        return <XCircle className="h-5 w-5 text-[var(--color-danger-500)]" />
      default:
        return <Info className="h-5 w-5 text-[var(--color-primary-500)]" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-[var(--color-success-muted)] border-[var(--color-success-500)]/20'
      case 'warning':
        return 'bg-[var(--color-warning-muted)] border-[var(--color-warning-500)]/20'
      case 'error':
        return 'bg-[var(--color-destructive-muted)] border-[var(--color-danger-500)]/20'
      default:
        return 'bg-[var(--color-info-bg)] border-[var(--color-primary-500)]/20'
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        {unreadNotifications.length > 0 && (
          <form action={markAllAsReadAction}>
            <input type="hidden" name="userId" value={userId} />
            <button
              type="submit"
              className="rounded-lg bg-[var(--color-primary-600)] px-4 py-2 text-white hover:bg-[var(--color-primary-700)]"
            >
              Mark All as Read
            </button>
          </form>
        )}
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-foreground text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground mt-2">
          {unreadNotifications.length} unread notification
          {unreadNotifications.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/[0.1] bg-white/[0.03] p-12">
          <Bell className="text-muted-foreground h-12 w-12" />
          <h3 className="text-foreground mt-4 text-lg font-medium">No notifications</h3>
          <p className="text-muted-foreground mt-2">You are all caught up!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unread Section */}
          {unreadNotifications.length > 0 && (
            <div>
              <h2 className="text-foreground mb-3 text-lg font-semibold">Unread</h2>
              <div className="space-y-3">
                {unreadNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg border-2 p-4 ${getTypeColor(notification.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getTypeIcon(notification.type)}
                      <div className="flex-1">
                        <h3 className="text-foreground font-semibold">{notification.title}</h3>
                        <p className="text-foreground/80 mt-1">{notification.message}</p>
                        <div className="mt-3 flex items-center gap-4">
                          <p className="text-muted-foreground text-sm">
                            {new Date(notification.created_at || '').toLocaleString()}
                          </p>
                          {notification.link && (
                            <Link
                              href={notification.link}
                              className="text-sm font-medium text-[var(--color-info)] hover:text-[var(--color-primary-300)]"
                            >
                              View Details →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Read Section */}
          {readNotifications.length > 0 && (
            <div>
              <h2 className="text-foreground mb-3 text-lg font-semibold">
                Earlier ({readNotifications.length})
              </h2>
              <div className="space-y-3">
                {readNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="bg-card rounded-lg border border-white/[0.08] p-4 opacity-60"
                  >
                    <div className="flex items-start gap-3">
                      {getTypeIcon(notification.type)}
                      <div className="flex-1">
                        <h3 className="text-foreground font-semibold">{notification.title}</h3>
                        <p className="text-foreground/80 mt-1">{notification.message}</p>
                        <div className="mt-3 flex items-center gap-4">
                          <p className="text-muted-foreground text-sm">
                            {new Date(notification.created_at || '').toLocaleString()}
                          </p>
                          {notification.link && (
                            <Link
                              href={notification.link}
                              className="text-sm font-medium text-[var(--color-info)] hover:text-[var(--color-primary-300)]"
                            >
                              View Details →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
