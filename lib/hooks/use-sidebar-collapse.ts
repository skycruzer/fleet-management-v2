/**
 * Sidebar Collapse Hook
 * Developer: Maurice Rondeau
 *
 * Provides a React context + hook for managing sidebar collapsed/expanded state.
 * State is persisted to localStorage so the preference survives page reloads.
 */
'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'

interface SidebarCollapseContextType {
  isCollapsed: boolean
  toggleCollapse: () => void
  setCollapsed: (collapsed: boolean) => void
}

const SidebarCollapseContext = createContext<SidebarCollapseContextType>({
  isCollapsed: false,
  toggleCollapse: () => {},
  setCollapsed: () => {},
})

export function useSidebarCollapse() {
  return useContext(SidebarCollapseContext)
}

export function useSidebarCollapseState() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setIsCollapsed(true)
  }, [])

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }, [])

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed)
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [])

  return { isCollapsed, toggleCollapse, setCollapsed }
}

export { SidebarCollapseContext }
