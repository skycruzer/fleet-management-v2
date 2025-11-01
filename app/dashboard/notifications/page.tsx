/**
 * Notifications Page
 * Author: Maurice Rondeau
 * Displays all user notifications with filtering and actions
 */

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch all notifications for the user
  const result = await getUserNotifications(user.id, false)
  const notifications =
    result.success && result.data ? (Array.isArray(result.data) ? result.data : [result.data]) : []

  // Separate by read/unread
  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

  // Type icons
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        {unreadNotifications.length > 0 && (
          <form action={markAllAsReadAction}>
            <input type="hidden" name="userId" value={user.id} />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Mark All as Read
            </button>
          </form>
        )}
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-2 text-gray-600">
          {unreadNotifications.length} unread notification
          {unreadNotifications.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12">
          <Bell className="h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No notifications</h3>
          <p className="mt-2 text-gray-600">You are all caught up!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unread Section */}
          {unreadNotifications.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Unread</h2>
              <div className="space-y-3">
                {unreadNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg border-2 p-4 ${getTypeColor(notification.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getTypeIcon(notification.type)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        <p className="mt-1 text-gray-700">{notification.message}</p>
                        <div className="mt-3 flex items-center gap-4">
                          <p className="text-sm text-gray-500">
                            {new Date(notification.created_at || '').toLocaleString()}
                          </p>
                          {notification.link && (
                            <Link
                              href={notification.link}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700"
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
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Earlier ({readNotifications.length})
              </h2>
              <div className="space-y-3">
                {readNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 opacity-60"
                  >
                    <div className="flex items-start gap-3">
                      {getTypeIcon(notification.type)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        <p className="mt-1 text-gray-700">{notification.message}</p>
                        <div className="mt-3 flex items-center gap-4">
                          <p className="text-sm text-gray-500">
                            {new Date(notification.created_at || '').toLocaleString()}
                          </p>
                          {notification.link && (
                            <Link
                              href={notification.link}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700"
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
