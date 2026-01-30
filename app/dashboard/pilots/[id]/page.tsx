/**
 * Pilot Detail View Page - Tabbed Interface
 * Displays comprehensive pilot information with tabs for Overview and Certifications.
 *
 * Developer: Maurice Rondeau
 * @version 4.0.0 - Tabbed interface replacing modal-based editing
 * @date December 6, 2025
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm-dialog'
import Link from 'next/link'
import { PilotDetailTabs } from '@/components/pilots/pilot-detail-tabs'
import type { Pilot, Certification } from '@/components/pilots/pilot-detail-tabs'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import { motion } from 'framer-motion'
import { XCircle, ArrowLeft, Plane } from 'lucide-react'

export default function PilotDetailPage() {
  const router = useRouter()
  const params = useParams()
  const pilotId = params.id as string
  const { confirm, ConfirmDialog } = useConfirm()
  const { csrfToken } = useCsrfToken()

  const [pilot, setPilot] = useState<Pilot | null>(null)
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [retirementAge, setRetirementAge] = useState<number>(65)

  // Fetch pilot details with useCallback for stable reference
  const fetchPilotDetails = useCallback(async () => {
    if (!pilotId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/pilots/${pilotId}`)

      if (!response.ok) {
        setError('Failed to fetch pilot details')
        return
      }

      const data = await response.json()

      if (data.success) {
        setPilot(data.data)
        if (data.systemSettings?.pilot_retirement_age) {
          setRetirementAge(data.systemSettings.pilot_retirement_age)
        }
      } else {
        setError(data.error || 'Failed to fetch pilot details')
      }
    } catch (err) {
      setError('Failed to fetch pilot details')
    } finally {
      setLoading(false)
    }
  }, [pilotId])

  // Fetch certifications with useCallback for stable reference
  const fetchCertifications = useCallback(async () => {
    if (!pilotId) return

    try {
      const timestamp = new Date().getTime()
      const response = await fetch(
        `/api/certifications?pilotId=${pilotId}&pageSize=100&_t=${timestamp}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      )

      if (!response.ok) {
        console.error('Failed to fetch certifications: HTTP error')
        return
      }

      const data = await response.json()

      if (data.success) {
        // API returns { data: { certifications: [...], pagination: {...} } }
        setCertifications(data.data?.certifications || data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch certifications:', err)
    }
  }, [pilotId])

  // Fetch data when pilotId changes
  useEffect(() => {
    if (pilotId) {
      fetchPilotDetails()
      fetchCertifications()
    }
  }, [pilotId, fetchPilotDetails, fetchCertifications])

  async function handleDelete() {
    const confirmed = await confirm({
      title: 'Delete Pilot',
      description: `Are you sure you want to delete ${pilot?.first_name} ${pilot?.last_name}? This action cannot be undone and will also delete all associated certifications and records.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    })

    if (!confirmed) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/pilots/${pilotId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        credentials: 'include',
      })

      // Check response status before parsing JSON
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to delete pilot`)
      }

      const result = await response.json()

      if (result.success) {
        // Per CLAUDE.md: refresh first, wait, then navigate
        router.refresh()
        await new Promise((resolve) => setTimeout(resolve, 100))
        router.push('/dashboard/pilots')
      } else {
        throw new Error(result.error || 'Failed to delete pilot')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete pilot'
      alert(message)
      setDeleting(false)
    }
  }

  function handleCertificationUpdate() {
    // Refresh both pilot and certifications data
    fetchPilotDetails()
    fetchCertifications()
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mb-4 flex justify-center">
            <Plane className="text-primary h-12 w-12 animate-pulse" />
          </div>
          <p className="text-muted-foreground text-lg">Loading pilot details...</p>
        </motion.div>
      </div>
    )
  }

  if (error || !pilot) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md p-12 text-center">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-600" />
          <h3 className="text-foreground mb-2 text-xl font-bold">Error</h3>
          <p className="text-muted-foreground mb-6">{error || 'Pilot not found'}</p>
          <Link href="/dashboard/pilots">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pilots
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <PilotDetailTabs
        pilot={pilot}
        initialCertifications={certifications}
        retirementAge={retirementAge}
        onPilotDelete={handleDelete}
        onCertificationUpdate={handleCertificationUpdate}
        csrfToken={csrfToken}
        isDeleting={deleting}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog />
    </div>
  )
}
