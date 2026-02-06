/**
 * Sidebar Badge Hook
 * Fetches dynamic counts for sidebar navigation badges
 * Pauses polling when the browser tab is hidden to save API calls
 *
 * Author: Maurice Rondeau
 */

'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

export interface SidebarBadges {
  pendingRequests: number
  expiringCertifications: number
  expiredCertifications: number
}

function useTabVisible() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const handler = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  return visible
}

export function useSidebarBadges() {
  const isTabVisible = useTabVisible()

  return useQuery<SidebarBadges>({
    queryKey: ['sidebar-badges'],
    queryFn: async () => {
      const response = await fetch('/api/sidebar-badges')
      if (!response.ok) throw new Error('Failed to fetch badges')
      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Failed to fetch badges')
      return result.data
    },
    refetchInterval: isTabVisible ? 60000 : false,
    staleTime: 30000,
  })
}
