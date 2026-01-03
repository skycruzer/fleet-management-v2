/**
 * Certifications Page Client Component
 * Handles all interactive functionality for the certifications page
 *
 * @author Maurice Rondeau
 * @version 1.0.0
 * @created 2025-12-19
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  CertificationStatCards,
  type CertificationStats,
} from '@/components/certifications/certification-stat-cards'
import { CertificationsTabs } from '@/components/certifications/certifications-tabs'
import { CertificationFormDialog } from '@/components/certifications/certification-form-dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Download } from 'lucide-react'
import type { CertificationWithDetails } from '@/lib/services/certification-service'

interface Pilot {
  id: string
  first_name: string
  last_name: string
  employee_number: string
}

interface CheckType {
  id: string
  check_code: string
  check_description: string
}

interface CertificationsPageClientProps {
  certifications: CertificationWithDetails[]
  stats: CertificationStats
  categories: string[]
}

export function CertificationsPageClient({
  certifications: initialCertifications,
  stats: initialStats,
  categories,
}: CertificationsPageClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Data state
  const [certifications, setCertifications] = useState(initialCertifications)
  const [stats, setStats] = useState(initialStats)
  const [pilots, setPilots] = useState<Pilot[]>([])
  const [checkTypes, setCheckTypes] = useState<CheckType[]>([])

  // Dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [formDialogMode, setFormDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedCertification, setSelectedCertification] = useState<
    CertificationWithDetails | undefined
  >()

  // Update local state when props change (React Compiler-friendly pattern)
  // Track previous props and update during render instead of in effect
  const [prevInitialCertifications, setPrevInitialCertifications] = useState(initialCertifications)
  const [prevInitialStats, setPrevInitialStats] = useState(initialStats)

  if (initialCertifications !== prevInitialCertifications) {
    setPrevInitialCertifications(initialCertifications)
    setCertifications(initialCertifications)
  }
  if (initialStats !== prevInitialStats) {
    setPrevInitialStats(initialStats)
    setStats(initialStats)
  }

  // Fetch pilots and check types for form
  useEffect(() => {
    async function fetchFormData() {
      try {
        const [pilotsRes, checkTypesRes] = await Promise.all([
          fetch('/api/pilots'),
          fetch('/api/check-types'),
        ])

        if (pilotsRes.ok) {
          const pilotsData = await pilotsRes.json()
          setPilots(pilotsData.data || [])
        }

        if (checkTypesRes.ok) {
          const checkTypesData = await checkTypesRes.json()
          setCheckTypes(checkTypesData.data || [])
        }
      } catch (err) {
        console.error('Error fetching form data:', err)
      }
    }

    fetchFormData()
  }, [])

  // Refresh data after mutations
  const refreshData = useCallback(async () => {
    try {
      const response = await fetch('/api/certifications', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        const certs = data.data || []
        setCertifications(certs)
        setStats({
          total: certs.length,
          current: certs.filter((c: CertificationWithDetails) => c.status?.color === 'green')
            .length,
          expiring: certs.filter((c: CertificationWithDetails) => c.status?.color === 'yellow')
            .length,
          expired: certs.filter((c: CertificationWithDetails) => c.status?.color === 'red').length,
        })
      }
    } catch (err) {
      console.error('Error refreshing certifications:', err)
    }
  }, [])

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

  // Handle export to CSV
  const handleExport = () => {
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

    const rows = certifications.map((cert) => [
      `${cert.pilot?.first_name || ''} ${cert.pilot?.last_name || ''}`,
      cert.pilot?.employee_id || '',
      cert.pilot?.role || '',
      cert.check_type?.check_code || '',
      cert.check_type?.check_description || '',
      cert.check_type?.category || 'Uncategorized',
      cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString() : 'N/A',
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
    link.download = `certifications_export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      description: 'Certifications exported successfully',
    })
  }

  // Calculate attention count
  const attentionCount = stats.expiring + stats.expired

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-foreground text-xl font-bold">Certifications</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Manage pilot certifications and track compliance
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" className="gap-1.5" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-1.5" onClick={handleCreateClick}>
            <Plus className="h-4 w-4" />
            Add Certification
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <CertificationStatCards stats={stats} />

      {/* Tabs */}
      <CertificationsTabs
        certifications={certifications}
        attentionCount={attentionCount}
        onEditCertification={handleEditCertification}
      />

      {/* Certification Form Dialog */}
      <CertificationFormDialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open)
          if (!open) {
            // Invalidate queries and refresh on close
            queryClient.invalidateQueries({ queryKey: ['certifications'] })
            queryClient.invalidateQueries({ queryKey: ['pilot-certifications'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            router.refresh()
            refreshData()
          }
        }}
        certification={selectedCertification}
        pilots={pilots}
        checkTypes={checkTypes}
        mode={formDialogMode}
      />
    </div>
  )
}
