/**
 * Global Search Component
 * Cmd+K style search for quick navigation
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileText, Users, Calendar, TrendingUp, Shield, Settings } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchResult {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  category: string
}

const searchablePages: SearchResult[] = [
  // Core
  { title: 'Dashboard', href: '/dashboard', icon: TrendingUp, category: 'Core' },
  { title: 'Pilots', href: '/dashboard/pilots', icon: Users, category: 'Core' },
  { title: 'Certifications', href: '/dashboard/certifications', icon: FileText, category: 'Core' },

  // Requests
  { title: 'Pilot Requests', href: '/dashboard/requests', icon: Calendar, category: 'Requests' },
  {
    title: 'Leave Requests',
    href: '/dashboard/requests?tab=leave',
    icon: FileText,
    category: 'Requests',
  },
  {
    title: 'Leave Calendar View',
    href: '/dashboard/requests?tab=leave&view=calendar',
    icon: Calendar,
    category: 'Requests',
  },

  // Planning
  {
    title: 'Renewal Planning',
    href: '/dashboard/renewal-planning',
    icon: FileText,
    category: 'Planning',
  },
  {
    title: 'Calendar View',
    href: '/dashboard/renewal-planning/calendar',
    icon: Calendar,
    category: 'Planning',
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: TrendingUp,
    category: 'Planning',
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
    category: 'Planning',
  },

  // Administration
  { title: 'Admin Dashboard', href: '/dashboard/admin', icon: Shield, category: 'Administration' },
  { title: 'Tasks', href: '/dashboard/tasks', icon: FileText, category: 'Administration' },
  {
    title: 'Disciplinary',
    href: '/dashboard/disciplinary',
    icon: FileText,
    category: 'Administration',
  },
  {
    title: 'Audit Logs',
    href: '/dashboard/audit-logs',
    icon: FileText,
    category: 'Administration',
  },
  {
    title: 'Check Types',
    href: '/dashboard/admin?tab=check-types',
    icon: FileText,
    category: 'Administration',
  },

  // Support
  { title: 'Help & Feedback', href: '/dashboard/help', icon: FileText, category: 'Support' },

  // Settings
  { title: 'My Settings', href: '/dashboard/settings', icon: Settings, category: 'Settings' },
]

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  // Filter results based on query - pure computation, no effect needed
  const results = useMemo(() => {
    if (query.trim() === '') {
      return searchablePages
    }
    return searchablePages.filter(
      (page) =>
        page.title.toLowerCase().includes(query.toLowerCase()) ||
        page.category.toLowerCase().includes(query.toLowerCase())
    )
  }, [query])

  // Reset selected index when results change
  const [prevResultsLength, setPrevResultsLength] = useState(results.length)
  if (results.length !== prevResultsLength) {
    setPrevResultsLength(results.length)
    setSelectedIndex(0)
  }

  // Keyboard shortcut to open search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle selecting a search result - defined before use in effects
  const handleSelect = useCallback(
    (result: SearchResult) => {
      router.push(result.href)
      setOpen(false)
      setQuery('')
    },
    [router]
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % results.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        handleSelect(results[selectedIndex])
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedIndex, results, handleSelect])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }

  // Group results by category
  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = []
      }
      acc[result.category].push(result)
      return acc
    },
    {} as Record<string, SearchResult[]>
  )

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="text-muted-foreground flex w-full max-w-sm items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-sm transition-colors hover:bg-white/[0.06] sm:max-w-xs"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Quick search...</span>
        <kbd className="pointer-events-none hidden rounded border border-white/[0.08] bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs sm:inline-block">
          ⌘K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl overflow-hidden rounded-xl border-white/[0.08] bg-[rgba(17,24,39,0.95)] p-0 shadow-xl backdrop-blur-xl">
          <DialogHeader className="border-b px-4 py-3">
            <div className="flex items-center gap-3">
              <Search className="text-muted-foreground h-5 w-5" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages..."
                className="border-0 p-0 focus-visible:ring-0"
                autoFocus
              />
            </div>
          </DialogHeader>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto p-2">
            {results.length === 0 ? (
              <div className="text-muted-foreground py-12 text-center text-sm">
                No results found for "{query}"
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedResults).map(([category, items]) => (
                  <div key={category}>
                    <div
                      className={cn(
                        'mb-2 px-2 text-xs font-semibold tracking-wider uppercase',
                        category === 'Core' && 'text-primary',
                        category === 'Requests' || category === 'Planning' ? 'text-accent' : '',
                        category === 'Administration' && 'text-[var(--color-status-low)]',
                        category === 'Support' || category === 'Settings'
                          ? 'text-muted-foreground'
                          : '',
                        ![
                          'Core',
                          'Requests',
                          'Planning',
                          'Administration',
                          'Support',
                          'Settings',
                        ].includes(category) && 'text-muted-foreground'
                      )}
                    >
                      {category}
                    </div>
                    <div className="space-y-1">
                      {items.map((result) => {
                        const globalIndex = results.indexOf(result)
                        const Icon = result.icon
                        const isSelected = globalIndex === selectedIndex

                        return (
                          <button
                            key={result.href}
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                              isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                            )}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span className="flex-1">{result.title}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2">
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>Navigate with ↑↓ arrows</span>
              <span>Press Enter to select</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
