/**
 * Global Search Component
 * Cmd+K style command palette using cmdk for quick navigation and entity search
 *
 * Developer: Maurice Rondeau
 *
 * @version 2.0.0
 * @since 2026-02 - Rewritten with cmdk CommandDialog, dynamic entity search
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  FileText,
  Users,
  Calendar,
  TrendingUp,
  Shield,
  Settings,
  ClipboardList,
  UserPlus,
  FileCheck,
  BarChart3,
  CalendarCheck,
  BookOpen,
  ListChecks,
  ScrollText,
  MessageSquare,
  HelpCircle,
  User,
} from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandSeparator,
} from '@/components/ui/command'

interface SearchResult {
  id: string
  title: string
  subtitle: string
  type: string
  href: string
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()

  // Keyboard shortcut to open search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Debounced async search for entities
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSearchResults(data.results || [])
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setQuery('')
      setSearchResults([])
      setIsSearching(false)
    }
  }

  // Navigate to a page and close the dialog
  const navigateTo = (href: string) => {
    router.push(href)
    handleOpenChange(false)
  }

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="text-muted-foreground border-border bg-muted/40 hover:bg-muted/60 flex w-full max-w-sm items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors sm:max-w-xs"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Quick search...</span>
        <kbd className="border-border bg-muted/60 pointer-events-none hidden rounded border px-1.5 py-0.5 font-mono text-xs sm:inline-block">
          ⌘K
        </kbd>
      </button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <CommandInput
          placeholder="Search pages, pilots, certifications..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Quick Actions */}
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => navigateTo('/dashboard/requests?action=new')}>
              <ClipboardList className="mr-2 h-4 w-4" />
              <span>New Leave Request</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/dashboard/pilots/new')}>
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Add Pilot</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/dashboard/reports')}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Generate Report</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/dashboard/certifications/new')}>
              <FileCheck className="mr-2 h-4 w-4" />
              <span>Update Certification</span>
            </CommandItem>
          </CommandGroup>

          {/* Dynamic search results when query >= 2 chars */}
          {searchResults.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Search Results">
                {searchResults.map((result) => (
                  <CommandItem key={result.id} onSelect={() => navigateTo(result.href)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>{result.title}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{result.subtitle}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {isSearching && (
            <div className="text-muted-foreground py-6 text-center text-sm">Searching...</div>
          )}

          <CommandSeparator />

          {/* Core */}
          <CommandGroup heading="Core">
            <CommandItem onSelect={() => navigateTo('/dashboard')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/dashboard/pilots')}>
              <Users className="mr-2 h-4 w-4" />
              <span>Pilots</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/dashboard/certifications')}>
              <FileCheck className="mr-2 h-4 w-4" />
              <span>Certifications</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Requests */}
          <CommandGroup heading="Requests">
            <CommandItem onSelect={() => navigateTo('/dashboard/requests')}>
              <ClipboardList className="mr-2 h-4 w-4" />
              <span>Pilot Requests</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/dashboard/requests?tab=leave')}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Leave Requests</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/dashboard/requests?tab=leave&view=calendar')}>
              <CalendarCheck className="mr-2 h-4 w-4" />
              <span>Leave Calendar View</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Planning */}
          <CommandGroup heading="Planning">
            <CommandItem onSelect={() => navigateTo('/dashboard/renewal-planning')}>
              <ListChecks className="mr-2 h-4 w-4" />
              <span>Renewal Planning</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/dashboard/renewal-planning/calendar')}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Calendar View</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/dashboard/analytics')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Analytics</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/dashboard/reports')}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Reports</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Administration */}
          <CommandGroup heading="Administration">
            <CommandItem onSelect={() => navigateTo('/dashboard/admin')}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/dashboard/tasks')}>
              <ListChecks className="mr-2 h-4 w-4" />
              <span>Tasks</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/dashboard/disciplinary')}>
              <ScrollText className="mr-2 h-4 w-4" />
              <span>Disciplinary</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/dashboard/audit-logs')}>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Audit Logs</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/dashboard/admin?tab=check-types')}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Check Types</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Support */}
          <CommandGroup heading="Support">
            <CommandItem onSelect={() => navigateTo('/dashboard/feedback')}>
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Feedback</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/dashboard/help')}>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help Center</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Settings */}
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => navigateTo('/dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>My Settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
