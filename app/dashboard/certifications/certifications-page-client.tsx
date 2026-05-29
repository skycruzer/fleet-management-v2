/**
 * Certifications Page Client Component
 * Handles all interactive functionality for the certifications page
 *
 * @author Maurice Rondeau
 * @version 1.1.0
 * @created 2025-12-19
 * @updated 2026-05-25 — drop refreshData() race, restore DELETE flow,
 *                       wire activeStatus, scope Export to active tab,
 *                       surface fetchFormData errors via toast
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { useQueryClient } from '@tanstack/react-query'
import { formatDate } from '@/lib/utils/date-utils'
import { Button } from '@/components/ui/button'
import {
  CertificationStatCards,
  type CertificationStats,
} from '@/components/certifications/certification-stat-cards'
import { CertificationsTabs } from '@/components/certifications/certifications-tabs'
import { CertificationFormDialog } from '@/components/certifications/certification-form-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import { Plus, Download } from 'lucide-react'
import type { CertificationWithDetails } from '@/lib/services/certification-service'

interface Pilot {
  id: string
  first_name: string
  last_name: string
  employee_id: string
}

interface CheckType {
  id: string
  check_code: string
  check_description: string
}

interface CertificationsPageClientProps {
  certifications: CertificationWithDetails[]
  stats: CertificationStats
}

const TAB_VALUES = ['all', 'attention', 'category'] as const

export function CertificationsPageClient({
  certifications: initialCertifications,
  stats: initialStats,
}: CertificationsPageClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { csrfToken } = useCsrfToken()

  // Tab state is URL-synced (shared with CertificationsTabs via the `tab` query
  // param) so the stat cards can deep-link into the relevant view.
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringLiteral(TAB_VALUES).withDefault('all')
  )

  // Data state. The server component re-renders on router.refresh() and
  // re-supplies these as props; the render-phase sync below picks them up.
  const [certifications, setCertifications] = useState(initialCertifications || [])
  const [stats, setStats] = useState(initialStats)
  const [pilots, setPilots] = useState<Pilot[]>([])
  const [checkTypes, setCheckTypes] = useState<CheckType[]>([])

  // Active card highlight — tracks the last status the user clicked so the
  // CertificationStatCards component can render its ring-2 ring-primary.
  const [activeStatus, setActiveStatus] = useState<
    'all' | 'current' | 'expiring' | 'expired' | undefined
  >()

  // Dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [formDialogMode, setFormDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedCertification, setSelectedCertification] = useState<
    CertificationWithDetails | undefined
  >()

  // Delete state (separate from edit selection so a stale dialog can't fire a
  // DELETE on the wrong row if the user opens both flows in quick succession).
  const [certificationToDelete, setCertificationToDelete] = useState<
    CertificationWithDetails | undefined
  >()
  const [deleting, setDeleting] = useState(false)

  // Update local state when props change (React Compiler-friendly pattern).
  // Track previous props and update during render instead of in effect.
  const [prevInitialCertifications, setPrevInitialCertifications] = useState(initialCertifications)
  const [prevInitialStats, setPrevInitialStats] = useState(initialStats)

  if (initialCertifications !== prevInitialCertifications) {
    setPrevInitialCertifications(initialCertifications)
    setCertifications(initialCertifications || [])
  }
  if (initialStats !== prevInitialStats) {
    setPrevInitialStats(initialStats)
    setStats(initialStats)
  }

  // Fetch pilots and check types for the create/edit form dialog.
  useEffect(() => {
    async function fetchFormData() {
      try {
        const [pilotsRes, checkTypesRes] = await Promise.all([
          fetch('/api/pilots', { credentials: 'include' }),
          fetch('/api/check-types', { credentials: 'include' }),
        ])

        if (!pilotsRes.ok || !checkTypesRes.ok) {
          throw new Error(
            `Form data fetch failed (pilots: ${pilotsRes.status}, check-types: ${checkTypesRes.status})`
          )
        }

        const pilotsData = await pilotsRes.json()
        // /api/pilots returns { data: { pilots: [...] } }
        setPilots(pilotsData.data?.pilots || pilotsData.data || [])

        const checkTypesData = await checkTypesRes.json()
        setCheckTypes(checkTypesData.data || [])
      } catch (err) {
        console.error('Error fetching form data:', err)
        toast({
          title: 'Could not load form data',
          description:
            'Pilot and check-type lists are unavailable — the Add / Edit dialog will not work until you reload.',
          variant: 'destructive',
        })
      }
    }

    fetchFormData()
  }, [toast])

  // Stat card click → jump to the tab that surfaces that status, and remember
  // which card was clicked so the highlight ring follows the user.
  const handleStatClick = (status: 'all' | 'current' | 'expiring' | 'expired') => {
    setActiveStatus(status)
    setActiveTab(status === 'expired' || status === 'expiring' ? 'attention' : 'all')
  }

  // Handle create certification
  const handleCreateClick = () => {
    setFormDialogMode('create')
    setSelectedCertification(undefined)
    setFormDialogOpen(true)
  }

  // Handle edit certification
  const handleEditCertification = (certId: string) => {
    const cert = certifications.find((c) => c.id === certId)
    if (cert) {
      setFormDialogMode('edit')
      setSelectedCertification(cert)
      setFormDialogOpen(true)
    }
  }

  // Handle delete request — opens confirm dialog. Actual DELETE fires in
  // handleDeleteConfirm so the user has to explicitly opt in.
  const handleDeleteCertification = (certId: string) => {
    const cert = certifications.find((c) => c.id === certId)
    if (cert) setCertificationToDelete(cert)
  }

  async function handleDeleteConfirm() {
    if (!certificationToDelete) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/certifications/${certificationToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${response.status}: Failed to delete certification`)
      }

      toast({ description: 'Certification deleted successfully' })

      // Single source of truth: router.refresh() re-renders the server
      // component, which re-fetches via getCertificationsUnpaginated and
      // supplies fresh props (handled by the render-phase sync above).
      queryClient.invalidateQueries({ queryKey: ['certifications'] })
      queryClient.invalidateQueries({ queryKey: ['pilots'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete certification'
      toast({ title: 'Delete failed', description: message, variant: 'destructive' })
    } finally {
      setDeleting(false)
      setCertificationToDelete(undefined)
    }
  }

  // Handle export — scoped to the active tab so the CSV matches what the user
  // is currently looking at. On Attention, we drop the green rows; All and
  // Category export the full set (Category is a grouping of the same data).
  const handleExport = () => {
    const scopedRows =
      activeTab === 'attention'
        ? certifications.filter((c) => c.status?.color === 'red' || c.status?.color === 'yellow')
        : certifications

    const headers = [
      'Pilot Name',
      'Employee ID',
      'Rank',
      'Check Code',
      'Check Description',
      'Category',
      'Expiry Date',
      'Status',
      'Days Until Expiry',
    ]

    const rows = scopedRows.map((cert) => [
      `${cert.pilot?.first_name || ''} ${cert.pilot?.last_name || ''}`,
      cert.pilot?.employee_id || '',
      cert.pilot?.role || '',
      cert.check_type?.check_code || '',
      cert.check_type?.check_description || '',
      cert.check_type?.category || 'Uncategorized',
      cert.expiry_date ? formatDate(cert.expiry_date) : 'N/A',
      cert.status?.label || 'No Date',
      cert.status?.daysUntilExpiry?.toString() || 'N/A',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const scopeSuffix = activeTab === 'attention' ? '_attention' : ''
    link.download = `certifications${scopeSuffix}_export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      description: `Exported ${rows.length} certification${rows.length === 1 ? '' : 's'}`,
    })
  }

  // Calculate attention count
  const attentionCount = stats.expiring + stats.expired

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
            Certifications
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage pilot certifications and track compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExport}
            aria-label={
              activeTab === 'attention'
                ? 'Export expired and expiring certifications to CSV'
                : 'Export all certifications to CSV'
            }
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
          </Button>
          <Button className="gap-2" onClick={handleCreateClick} aria-label="Add new certification">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Certification
          </Button>
        </div>
      </div>

      {/* Stat Cards — click to jump to the relevant tab; activeStatus drives
          the ring-2 highlight on the clicked card. */}
      <CertificationStatCards
        stats={stats}
        onStatClick={handleStatClick}
        activeStatus={activeStatus}
      />

      {/* Tabs */}
      <CertificationsTabs
        certifications={certifications}
        attentionCount={attentionCount}
        onEditCertification={handleEditCertification}
        onDeleteCertification={handleDeleteCertification}
      />

      {/* Certification Form Dialog */}
      <CertificationFormDialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open)
          if (!open) {
            // Single source of truth: invalidate the TanStack caches and let
            // router.refresh() re-pull fresh server props. No client-side fetch.
            queryClient.invalidateQueries({ queryKey: ['certifications'] })
            queryClient.invalidateQueries({ queryKey: ['pilots'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            router.refresh()
          }
        }}
        certification={selectedCertification}
        pilots={pilots}
        checkTypes={checkTypes}
        mode={formDialogMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!certificationToDelete}
        onOpenChange={(open) => {
          if (!open) setCertificationToDelete(undefined)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete certification?</AlertDialogTitle>
            <AlertDialogDescription>
              {certificationToDelete ? (
                <>
                  This will permanently remove the{' '}
                  <strong>{certificationToDelete.check_type?.check_code}</strong> certification for{' '}
                  <strong>
                    {certificationToDelete.pilot?.first_name}{' '}
                    {certificationToDelete.pilot?.last_name}
                  </strong>
                  . This action cannot be undone.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-[var(--color-status-high)] text-white hover:bg-[var(--color-status-high)]/90"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
