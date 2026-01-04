'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

/**
 * Portal Toast Handler
 *
 * Client component that reads URL query parameters and displays toast notifications.
 * Used for showing messages after redirects (e.g., admin access denied).
 *
 * Supported query parameters:
 * - ?toast=admin_access_denied&message=Your custom message
 * - ?toast=error&message=Error message
 * - ?toast=success&message=Success message
 * - ?toast=info&message=Info message
 */
export function PortalToastHandler() {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const toastType = searchParams.get('toast')
    const message = searchParams.get('message')

    if (!toastType) return

    // Handle different toast types
    switch (toastType) {
      case 'admin_access_denied':
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: message || 'You need admin or fleet manager access to view the dashboard.',
        })
        break

      case 'error':
        toast({
          variant: 'destructive',
          title: 'Error',
          description: message || 'An error occurred.',
        })
        break

      case 'success':
        toast({
          title: 'Success',
          description: message || 'Operation completed successfully.',
        })
        break

      case 'info':
        toast({
          title: 'Information',
          description: message || 'Information message.',
        })
        break

      default:
        // Unknown toast type - still show message if provided
        if (message) {
          toast({
            title: 'Notification',
            description: message,
          })
        }
    }

    // Clean up URL after showing toast (optional)
    // This prevents the toast from showing again on page refresh
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('toast')
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, toast])

  return null // This component doesn't render anything
}
