/**
 * Pilot Detail View Page - Professional Aviation-Inspired Design
 * Displays comprehensive pilot information with modern UI
 * @version 3.0.0 - Complete redesign with aviation theme
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
import { motion } from 'framer-motion'
import {
  User,
  Briefcase,
  Calendar,
  MapPin,
  Shield,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Plane,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  calculateRetirementCountdown,
  formatRetirementCountdown,
  formatRetirementDate,
} from '@/lib/utils/retirement-utils'
import { RetirementCountdownBadge } from '@/components/pilots/RetirementCountdownBadge'
import { RetirementInformationCard } from '@/components/pilots/RetirementInformationCard'

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
  contract_type_id: string | null
  captain_qualifications: any
  qualification_notes: string | null
  rhs_captain_expiry: string | null
  created_at: string
  updated_at: string
  certificationStatus: {
    current: number
    expiring: number
    expired: number
  }
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
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
  const [retirementAge, setRetirementAge] = useState<number>(65) // Default to 65, will be updated from API

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
        // Update retirement age from system settings
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
  }

  async function fetchCertifications() {
    try {
      setLoadingCertifications(true)
      // CRITICAL: Add timestamp to bust browser cache completely
      const timestamp = new Date().getTime()
      console.log('🔄 [FETCH] Fetching certifications at:', new Date().toISOString())
      const response = await fetch(
        `/api/certifications?pilotId=${pilotId}&pageSize=100&_t=${timestamp}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        }
      )
      const data = await response.json()
      console.log('📦 [FETCH] Received certifications:', data.data?.length, 'records')

      if (data.data && data.data.length > 0) {
        console.log('📅 [FETCH] Sample expiry dates:', data.data.slice(0, 3).map((c: any) => ({
          id: c.id,
          type: c.check_type,
          expiry: c.expiry_date
        })))
      }

      if (data.success) {
        const sortedCerts = (data.data || []).sort((a: any, b: any) => {
          if (!a.expiry_date) return 1
          if (!b.expiry_date) return -1
          return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
        })
        setCertifications(sortedCerts)
        console.log('✅ [FETCH] State updated with', sortedCerts.length, 'certifications')
      }
    } catch (err) {
      console.error('❌ [FETCH] Failed to fetch certifications:', err)
    } finally {
      setLoadingCertifications(false)
    }
  }

  async function handleSaveCertification(certId: string) {
    if (!editExpiryDate) return

    try {
      setSavingCert(true)
      console.log('💾 [SAVE] Saving certification:', certId, 'with date:', editExpiryDate)

      const response = await fetch(`/api/certifications/${certId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiry_date: new Date(editExpiryDate).toISOString(),
        }),
      })

      const result = await response.json()
      console.log('📤 [SAVE] API Response:', result)

      if (result.success) {
        console.log('✅ [SAVE] Save successful, fetching updated data...')

        // Fetch updated data (with cache-busting enabled in fetchCertifications)
        await fetchCertifications()
        await fetchPilotDetails()

        // Clear editing state
        setEditingCertId(null)
        setEditExpiryDate('')

        // Refresh router to update any server components
        router.refresh()

        console.log('🎉 [SAVE] Complete - editing state cleared')
      } else {
        console.error('❌ [SAVE] Failed:', result.error)
        alert(result.error || 'Failed to update certification')
      }
    } catch (err) {
      console.error('❌ [SAVE] Exception:', err)
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

  async function handleDelete() {
    try {
      const confirmed = await confirm({
        title: 'Delete Pilot',
        description:
          'Are you sure you want to delete this pilot? This will permanently delete the pilot record and all associated certifications and leave requests. This action cannot be undone.',
        confirmText: 'Delete Pilot',
        cancelText: 'Cancel',
        variant: 'destructive',
      })

      if (!confirmed) return
    } catch (err) {
      // If confirm dialog fails to render, don't proceed with deletion
      console.error('Confirmation dialog error:', err)
      setError('Failed to show confirmation dialog')
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

    // Handle array format: ["line_captain", "training_captain"]
    if (Array.isArray(qualifications)) {
      return qualifications
        .map((q) => {
          if (q === 'line_captain') return 'Line Captain'
          if (q === 'training_captain') return 'Training Captain'
          if (q === 'examiner') return 'Examiner'
          return q
        })
        .filter(Boolean)
    }

    // Handle JSONB object format: {line_captain: true, training_captain: true, examiner: false}
    if (typeof qualifications === 'object') {
      const quals: string[] = []
      if (qualifications.line_captain === true) quals.push('Line Captain')
      if (qualifications.training_captain === true) quals.push('Training Captain')
      if (qualifications.examiner === true) quals.push('Examiner')
      return quals
    }

    return []
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
            <Plane className="h-12 w-12 animate-pulse text-primary" />
          </div>
          <p className="text-lg text-muted-foreground">Loading pilot details...</p>
        </motion.div>
      </div>
    )
  }

  if (error || !pilot) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md p-12 text-center">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-600" />
          <h3 className="mb-2 text-xl font-bold text-foreground">Error</h3>
          <p className="mb-6 text-muted-foreground">{error || 'Pilot not found'}</p>
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

  const fullName = [pilot.first_name, pilot.middle_name, pilot.last_name].filter(Boolean).join(' ')

  // Group certifications by category
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

  const sortedCategories = Object.keys(groupedCertifications).sort()

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Section with Gradient Background */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 via-primary to-sky-800 p-8 text-white shadow-2xl"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="relative">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar placeholder */}
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-4 ring-white/30">
                {pilot.role === 'Captain' ? (
                  <Star className="h-10 w-10 text-yellow-300" />
                ) : (
                  <User className="h-10 w-10 text-white" />
                )}
              </div>
              <div>
                <h1 className="mb-2 text-4xl font-bold">{fullName}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm">
                    {pilot.role}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-4 py-1.5 text-sm font-semibold backdrop-blur-sm',
                      pilot.is_active
                        ? 'bg-green-500/30 ring-1 ring-green-300/50'
                        : 'bg-gray-500/30 ring-1 ring-gray-300/50'
                    )}
                  >
                    {pilot.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {pilot.seniority_number && (
                    <span className="rounded-full bg-yellow-500/30 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm ring-1 ring-yellow-300/50">
                      Seniority #{pilot.seniority_number}
                    </span>
                  )}
                  <RetirementCountdownBadge
                    dateOfBirth={pilot.date_of_birth}
                    retirementAge={retirementAge}
                    compact={false}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Link href="/dashboard/pilots">
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <Link href={`/dashboard/pilots/${pilot.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <div className="mb-1 text-sm font-medium text-white/80">Employee ID</div>
              <div className="text-2xl font-bold">{pilot.employee_id}</div>
            </div>
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <div className="mb-1 text-sm font-medium text-white/80">Contract Type</div>
              <div className="text-2xl font-bold">{pilot.contract_type || 'Not Set'}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Certification Status Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <motion.div variants={fadeIn}>
          <Card className="group relative overflow-hidden border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 transition-all hover:shadow-lg">
            <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-green-500/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-green-700">Current</p>
                <p className="text-4xl font-bold text-green-900">{pilot.certificationStatus.current}</p>
                <p className="mt-1 text-xs text-green-600">Certifications</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn}>
          <Card className="group relative overflow-hidden border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 p-6 transition-all hover:shadow-lg">
            <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-yellow-500/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-yellow-700">Expiring Soon</p>
                <p className="text-4xl font-bold text-yellow-900">{pilot.certificationStatus.expiring}</p>
                <p className="mt-1 text-xs text-yellow-600">Within 30 days</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/20">
                <AlertCircle className="h-7 w-7 text-yellow-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn}>
          <Card className="group relative overflow-hidden border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-6 transition-all hover:shadow-lg">
            <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-red-500/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-red-700">Expired</p>
                <p className="text-4xl font-bold text-red-900">{pilot.certificationStatus.expired}</p>
                <p className="mt-1 text-xs text-red-600">Needs renewal</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
                <XCircle className="h-7 w-7 text-red-600" />
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* View Certifications Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center"
      >
        <Button
          onClick={handleOpenCertificationsModal}
          size="lg"
          className="bg-gradient-to-r from-sky-600 to-primary text-white shadow-lg transition-all hover:from-sky-700 hover:to-primary/90 hover:shadow-xl"
        >
          <FileText className="mr-2 h-5 w-5" />
          View & Edit Certifications
        </Button>
      </motion.div>

      {/* Retirement Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <RetirementInformationCard
          dateOfBirth={pilot.date_of_birth}
          commencementDate={pilot.commencement_date}
          retirementAge={retirementAge}
          pilotName={fullName}
        />
      </motion.div>

      {/* Information Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        {/* Personal Information */}
        <motion.div variants={fadeIn}>
          <Card className="h-full p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
            </div>
            <div className="space-y-4">
              <InfoRow icon={User} label="Full Name" value={fullName} />
              <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(pilot.date_of_birth)} />
              <InfoRow icon={TrendingUp} label="Age" value={calculateAge(pilot.date_of_birth)} />
              <InfoRow icon={MapPin} label="Nationality" value={pilot.nationality || 'Not specified'} />
            </div>
          </Card>
        </motion.div>

        {/* Employment Information */}
        <motion.div variants={fadeIn}>
          <Card className="h-full p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Briefcase className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Employment Details</h3>
            </div>
            <div className="space-y-4">
              <InfoRow icon={Shield} label="Employee ID" value={pilot.employee_id} />
              <InfoRow icon={Award} label="Rank" value={pilot.role} />
              <InfoRow icon={Star} label="Seniority Number" value={pilot.seniority_number ? `#${pilot.seniority_number}` : 'Not assigned'} />
              <InfoRow icon={Briefcase} label="Contract Type" value={pilot.contract_type || 'Not specified'} />
              <InfoRow icon={Calendar} label="Commencement Date" value={formatDate(pilot.commencement_date)} />
              <InfoRow icon={Clock} label="Years in Service" value={calculateYearsInService(pilot.commencement_date)} />
            </div>
          </Card>
        </motion.div>

        {/* Passport Information */}
        <motion.div variants={fadeIn}>
          <Card className="h-full p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Passport Information</h3>
            </div>
            <div className="space-y-4">
              <InfoRow icon={Shield} label="Passport Number" value={pilot.passport_number || 'Not specified'} />
              <InfoRow icon={Calendar} label="Expiry Date" value={formatDate(pilot.passport_expiry)} />
            </div>
          </Card>
        </motion.div>

        {/* Professional Details */}
        <motion.div variants={fadeIn}>
          <Card className="h-full p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/50/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Professional Details</h3>
            </div>
            <div className="space-y-4">
              {pilot.role === 'Captain' && pilot.rhs_captain_expiry && (
                <InfoRow
                  icon={Calendar}
                  label="RHS Captain Expiry"
                  value={formatDate(pilot.rhs_captain_expiry)}
                />
              )}
              {pilot.qualification_notes ? (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">Qualification Notes</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground whitespace-pre-wrap">
                      {pilot.qualification_notes}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <p className="text-sm">No qualification notes recorded</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Captain Qualifications - Only show if Captain */}
      {pilot.role === 'Captain' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Captain Qualifications</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {parseCaptainQualifications(pilot.captain_qualifications).length > 0 ? (
                parseCaptainQualifications(pilot.captain_qualifications).map((qual, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md"
                  >
                    <Star className="h-4 w-4" />
                    {qual}
                  </span>
                ))
              ) : (
                <p className="text-muted-foreground">No qualifications recorded</p>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* System Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6 transition-all hover:shadow-md">
          <div className="mb-4 flex items-center gap-3 border-b pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-500/10">
              <Clock className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">System Information</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoRow icon={Calendar} label="Record Created" value={formatDate(pilot.created_at)} />
            <InfoRow icon={Calendar} label="Last Updated" value={formatDate(pilot.updated_at)} />
          </div>
        </Card>
      </motion.div>

      {/* Certifications Modal */}
      <Dialog open={showCertificationsModal} onOpenChange={setShowCertificationsModal}>
        <DialogContent className="max-h-[80vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Certifications for {fullName}</DialogTitle>
          </DialogHeader>

          {loadingCertifications ? (
            <div className="flex items-center justify-center py-12">
              <Plane className="mr-3 h-8 w-8 animate-pulse text-primary" />
              <p className="text-muted-foreground">Loading certifications...</p>
            </div>
          ) : certifications.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
              <p className="text-muted-foreground">No certifications found for this pilot.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category Overview */}
              <Card className="bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Certification Categories</h4>
                  <div className="text-sm text-muted-foreground">
                    {sortedCategories.length} categories • {certifications.length} total certifications
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
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

// InfoRow Component
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}
