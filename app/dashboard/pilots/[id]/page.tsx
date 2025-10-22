/**
 * Pilot Detail View Page
 * Displays comprehensive pilot information
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useConfirm } from '@/components/ui/confirm-dialog'
import Link from 'next/link'
import { CertificationCategoryGroup } from '@/components/certifications/certification-category-group'

interface Pilot {
  id: string
  employee_id: string
  first_name: string
  middle_name: string | null
  last_name: string
  role: 'Captain' | 'First Officer'
  is_active: boolean
  seniority_number: number | null
  date_of_birth: string | null
  commencement_date: string | null
  nationality: string | null
  passport_number: string | null
  passport_expiry: string | null
  contract_type: string | null
  captain_qualifications: any
  qualification_notes: string | null
  created_at: string
  updated_at: string
  certificationStatus: {
    current: number
    expiring: number
    expired: number
  }
}

export default function PilotDetailPage() {
  const router = useRouter()
  const params = useParams()
  const pilotId = params.id as string
  const { confirm, ConfirmDialog } = useConfirm()

  const [pilot, setPilot] = useState<Pilot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Certification modal state
  const [showCertificationsModal, setShowCertificationsModal] = useState(false)
  const [certifications, setCertifications] = useState<any[]>([])
  const [loadingCertifications, setLoadingCertifications] = useState(false)
  const [editingCertId, setEditingCertId] = useState<string | null>(null)
  const [editExpiryDate, setEditExpiryDate] = useState('')
  const [savingCert, setSavingCert] = useState(false)

  useEffect(() => {
    if (pilotId) {
      fetchPilotDetails()
    }
  }, [pilotId])

  async function fetchPilotDetails() {
    try {
      setLoading(true)
      const response = await fetch(`/api/pilots/${pilotId}`)
      const data = await response.json()

      if (data.success) {
        setPilot(data.data)
      } else {
        setError(data.error || 'Failed to fetch pilot details')
      }
    } catch (err) {
      setError('Failed to fetch pilot details')
    } finally {
      setLoading(false)
    }
  }

  async function fetchCertifications() {
    try {
      setLoadingCertifications(true)
      const response = await fetch(`/api/certifications?pilotId=${pilotId}&pageSize=100`)
      const data = await response.json()

      if (data.success) {
        // Sort certifications by expiry date within the response
        const sortedCerts = (data.data || []).sort((a: any, b: any) => {
          if (!a.expiry_date) return 1
          if (!b.expiry_date) return -1
          return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
        })
        setCertifications(sortedCerts)
      }
    } catch (err) {
      console.error('Failed to fetch certifications:', err)
    } finally {
      setLoadingCertifications(false)
    }
  }

  async function handleSaveCertification(certId: string) {
    if (!editExpiryDate) return

    try {
      setSavingCert(true)
      const response = await fetch(`/api/certifications/${certId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiry_date: new Date(editExpiryDate).toISOString(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Refresh certifications
        await fetchCertifications()
        // Also refresh pilot details to update certification status summary
        await fetchPilotDetails()
        // Clear editing state
        setEditingCertId(null)
        setEditExpiryDate('')
      } else {
        alert(result.error || 'Failed to update certification')
      }
    } catch (err) {
      alert('Failed to update certification')
    } finally {
      setSavingCert(false)
    }
  }

  function handleEditCertification(certId: string, currentExpiry: string | null) {
    setEditingCertId(certId)
    if (currentExpiry) {
      const date = new Date(currentExpiry)
      setEditExpiryDate(date.toISOString().split('T')[0])
    } else {
      setEditExpiryDate('')
    }
  }

  function handleCancelEdit() {
    setEditingCertId(null)
    setEditExpiryDate('')
  }

  function handleOpenCertificationsModal() {
    setShowCertificationsModal(true)
    fetchCertifications()
  }

  // Utility function for status badge colors (currently unused)
  // function getStatusColor(cert: any): string {
  //   if (!cert.status) return 'bg-gray-100 text-gray-800'
  //   if (cert.status.color === 'red') return 'bg-red-100 text-red-800'
  //   if (cert.status.color === 'yellow') return 'bg-yellow-100 text-yellow-800'
  //   return 'bg-green-100 text-green-800'
  // }

  async function handleDelete() {
    const confirmed = await confirm({
      title: 'Delete Pilot',
      description:
        'Are you sure you want to delete this pilot? This will permanently delete the pilot record and all associated certifications and leave requests. This action cannot be undone.',
      confirmText: 'Delete Pilot',
      cancelText: 'Cancel',
      variant: 'destructive',
    })

    if (!confirmed) {
      return
    }

    try {
      setDeleting(true)
      const response = await fetch(`/api/pilots/${pilotId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete pilot')
      }

      // Success - redirect to pilots list
      router.push('/dashboard/pilots')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pilot')
      setDeleting(false)
    }
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  function calculateAge(dateOfBirth: string | null): string {
    if (!dateOfBirth) return 'N/A'
    const birth = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return `${age} years`
  }

  function calculateYearsInService(commencementDate: string | null): string {
    if (!commencementDate) return 'N/A'
    const start = new Date(commencementDate)
    const today = new Date()
    const years = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    return `${years} years`
  }

  function parseCaptainQualifications(qualifications: any): string[] {
    if (!qualifications) return []
    if (Array.isArray(qualifications)) {
      return qualifications.map((q) => {
        if (q === 'line_captain') return 'Line Captain'
        if (q === 'training_captain') return 'Training Captain'
        if (q === 'examiner') return 'Examiner'
        return q
      })
    }
    // Handle JSONB object format
    const quals: string[] = []
    if (qualifications.line_captain) quals.push('Line Captain')
    if (qualifications.training_captain) quals.push('Training Captain')
    if (qualifications.examiner) quals.push('Examiner')
    return quals
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <div className="flex items-center justify-center space-x-2">
            <span className="animate-spin text-3xl">⏳</span>
            <p className="text-muted-foreground">Loading pilot details...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !pilot) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <span className="text-6xl">❌</span>
            <div>
              <h3 className="text-foreground mb-2 text-xl font-bold">Error</h3>
              <p className="text-muted-foreground">{error || 'Pilot not found'}</p>
            </div>
            <Link href="/dashboard/pilots">
              <Button variant="outline">← Back to Pilots</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const fullName = [pilot.first_name, pilot.middle_name, pilot.last_name].filter(Boolean).join(' ')

  // Group certifications by category and sort
  const groupedCertifications = certifications.reduce(
    (acc, cert) => {
      const category = cert.check_type?.category || 'Other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(cert)
      return acc
    },
    {} as Record<string, typeof certifications>
  )

  // Sort categories alphabetically
  const sortedCategories = Object.keys(groupedCertifications).sort()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-foreground text-2xl font-bold">{fullName}</h2>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                pilot.is_active ? 'bg-green-100 text-green-800' : 'bg-muted text-foreground'
              }`}
            >
              {pilot.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            {pilot.role} • Employee ID: {pilot.employee_id}
            {pilot.seniority_number && ` • Seniority #${pilot.seniority_number}`}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/dashboard/pilots">
            <Button variant="outline">← Back to Pilots</Button>
          </Link>
          <Link href={`/dashboard/pilots/${pilot.id}/edit`}>
            <Button className="bg-primary hover:bg-primary/90 text-white">Edit Pilot</Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleting}
            className="border-destructive/20 text-red-600 hover:bg-red-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Certification Status Summary */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-green-200 bg-green-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">✅</span>
            <div>
              <p className="text-foreground text-2xl font-bold">
                {pilot.certificationStatus.current}
              </p>
              <p className="text-muted-foreground text-sm font-medium">Current Certifications</p>
            </div>
          </div>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <p className="text-foreground text-2xl font-bold">
                {pilot.certificationStatus.expiring}
              </p>
              <p className="text-muted-foreground text-sm font-medium">Expiring Soon</p>
            </div>
          </div>
        </Card>
        <Card className="border-destructive/20 bg-red-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">❌</span>
            <div>
              <p className="text-foreground text-2xl font-bold">
                {pilot.certificationStatus.expired}
              </p>
              <p className="text-muted-foreground text-sm font-medium">Expired Certifications</p>
            </div>
          </div>
        </Card>
      </div>

      {/* View & Edit Certifications Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleOpenCertificationsModal}
          className="bg-primary hover:bg-primary/90 text-white"
          size="lg"
        >
          📋 View & Edit Certifications
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <Card className="p-6">
          <h3 className="text-foreground mb-4 border-b pb-2 text-lg font-semibold">
            Basic Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Employee ID:</span>
              <span className="text-foreground font-medium">{pilot.employee_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Full Name:</span>
              <span className="text-foreground font-medium">{fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rank:</span>
              <span className="text-foreground font-medium">{pilot.role}</span>
            </div>
            {pilot.seniority_number && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seniority Number:</span>
                <span className="text-foreground font-medium">#{pilot.seniority_number}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-foreground font-medium">
                {pilot.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </Card>

        {/* Employment Information */}
        <Card className="p-6">
          <h3 className="text-foreground mb-4 border-b pb-2 text-lg font-semibold">
            Employment Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contract Type:</span>
              <span className="text-foreground font-medium">
                {pilot.contract_type || 'Not specified'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Commencement Date:</span>
              <span className="text-foreground font-medium">
                {formatDate(pilot.commencement_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Years in Service:</span>
              <span className="text-foreground font-medium">
                {calculateYearsInService(pilot.commencement_date)}
              </span>
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="p-6">
          <h3 className="text-foreground mb-4 border-b pb-2 text-lg font-semibold">
            Personal Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date of Birth:</span>
              <span className="text-foreground font-medium">{formatDate(pilot.date_of_birth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Age:</span>
              <span className="text-foreground font-medium">
                {calculateAge(pilot.date_of_birth)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nationality:</span>
              <span className="text-foreground font-medium">
                {pilot.nationality || 'Not specified'}
              </span>
            </div>
          </div>
        </Card>

        {/* Passport Information */}
        <Card className="p-6">
          <h3 className="text-foreground mb-4 border-b pb-2 text-lg font-semibold">
            Passport Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Passport Number:</span>
              <span className="text-foreground font-medium">
                {pilot.passport_number || 'Not specified'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Passport Expiry:</span>
              <span className="text-foreground font-medium">
                {formatDate(pilot.passport_expiry)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Captain Qualifications - Only show if Captain */}
      {pilot.role === 'Captain' && (
        <Card className="p-6">
          <h3 className="text-foreground mb-4 border-b pb-2 text-lg font-semibold">
            Captain Qualifications
          </h3>
          <div className="flex flex-wrap gap-2">
            {parseCaptainQualifications(pilot.captain_qualifications).length > 0 ? (
              parseCaptainQualifications(pilot.captain_qualifications).map((qual, index) => (
                <span
                  key={index}
                  className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium"
                >
                  {qual}
                </span>
              ))
            ) : (
              <p className="text-muted-foreground">No qualifications specified</p>
            )}
          </div>
        </Card>
      )}

      {/* System Information */}
      <Card className="p-6">
        <h3 className="text-foreground mb-4 border-b pb-2 text-lg font-semibold">
          System Information
        </h3>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span className="text-foreground font-medium">{formatDate(pilot.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated:</span>
            <span className="text-foreground font-medium">{formatDate(pilot.updated_at)}</span>
          </div>
        </div>
      </Card>

      {/* Certifications Modal */}
      <Dialog open={showCertificationsModal} onOpenChange={setShowCertificationsModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Certifications for {fullName}
            </DialogTitle>
          </DialogHeader>

          {loadingCertifications ? (
            <div className="flex items-center justify-center py-12">
              <span className="animate-spin text-3xl">⏳</span>
              <p className="text-muted-foreground ml-3">Loading certifications...</p>
            </div>
          ) : certifications.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No certifications found for this pilot.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category Overview */}
              <Card className="p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h4 className="text-foreground text-sm font-semibold">Certification Categories</h4>
                  <div className="text-muted-foreground text-sm">
                    {sortedCategories.length} categories • {certifications.length} total certifications
                  </div>
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  Certifications are grouped by category and sorted by expiry date.
                </p>
              </Card>

              {/* Grouped Certifications by Category */}
              {sortedCategories.map((category) => (
                <CertificationCategoryGroup
                  key={category}
                  category={category}
                  certifications={groupedCertifications[category]}
                  defaultExpanded={true}
                  editingCertId={editingCertId}
                  editExpiryDate={editExpiryDate}
                  savingCert={savingCert}
                  onEdit={handleEditCertification}
                  onSave={handleSaveCertification}
                  onCancel={handleCancelEdit}
                  onEditExpiryDateChange={setEditExpiryDate}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog />
    </div>
  )
}
