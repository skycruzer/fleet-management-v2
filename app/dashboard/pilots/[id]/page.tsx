/**
 * Pilot Detail View Page
 * Displays comprehensive pilot information
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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

  const [pilot, setPilot] = useState<Pilot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  async function handleDelete() {
    if (
      !confirm(
        'Are you sure you want to delete this pilot? This will also delete all associated certifications and leave requests.'
      )
    ) {
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
    const years = Math.floor(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    )
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
            <p className="text-gray-600">Loading pilot details...</p>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600">{error || 'Pilot not found'}</p>
            </div>
            <Link href="/dashboard/pilots">
              <Button variant="outline">← Back to Pilots</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const fullName = [pilot.first_name, pilot.middle_name, pilot.last_name]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900">{fullName}</h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                pilot.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {pilot.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-gray-600 mt-1">
            {pilot.role} • Employee ID: {pilot.employee_id}
            {pilot.seniority_number && ` • Seniority #${pilot.seniority_number}`}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/dashboard/pilots">
            <Button variant="outline">← Back to Pilots</Button>
          </Link>
          <Link href={`/dashboard/pilots/${pilot.id}/edit`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Edit Pilot</Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 hover:bg-red-50 border-red-200"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Certification Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">✅</span>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {pilot.certificationStatus.current}
              </p>
              <p className="text-sm font-medium text-gray-600">Current Certifications</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {pilot.certificationStatus.expiring}
              </p>
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">❌</span>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {pilot.certificationStatus.expired}
              </p>
              <p className="text-sm font-medium text-gray-600">Expired Certifications</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="p-6 bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
            Basic Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Employee ID:</span>
              <span className="font-medium text-gray-900">{pilot.employee_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Full Name:</span>
              <span className="font-medium text-gray-900">{fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rank:</span>
              <span className="font-medium text-gray-900">{pilot.role}</span>
            </div>
            {pilot.seniority_number && (
              <div className="flex justify-between">
                <span className="text-gray-600">Seniority Number:</span>
                <span className="font-medium text-gray-900">#{pilot.seniority_number}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-gray-900">
                {pilot.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </Card>

        {/* Employment Information */}
        <Card className="p-6 bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
            Employment Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Contract Type:</span>
              <span className="font-medium text-gray-900">
                {pilot.contract_type || 'Not specified'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Commencement Date:</span>
              <span className="font-medium text-gray-900">
                {formatDate(pilot.commencement_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Years in Service:</span>
              <span className="font-medium text-gray-900">
                {calculateYearsInService(pilot.commencement_date)}
              </span>
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="p-6 bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
            Personal Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Date of Birth:</span>
              <span className="font-medium text-gray-900">
                {formatDate(pilot.date_of_birth)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Age:</span>
              <span className="font-medium text-gray-900">
                {calculateAge(pilot.date_of_birth)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Nationality:</span>
              <span className="font-medium text-gray-900">
                {pilot.nationality || 'Not specified'}
              </span>
            </div>
          </div>
        </Card>

        {/* Passport Information */}
        <Card className="p-6 bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
            Passport Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Passport Number:</span>
              <span className="font-medium text-gray-900">
                {pilot.passport_number || 'Not specified'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Passport Expiry:</span>
              <span className="font-medium text-gray-900">
                {formatDate(pilot.passport_expiry)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Captain Qualifications - Only show if Captain */}
      {pilot.role === 'Captain' && (
        <Card className="p-6 bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
            Captain Qualifications
          </h3>
          <div className="flex flex-wrap gap-2">
            {parseCaptainQualifications(pilot.captain_qualifications).length > 0 ? (
              parseCaptainQualifications(pilot.captain_qualifications).map((qual, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {qual}
                </span>
              ))
            ) : (
              <p className="text-gray-600">No qualifications specified</p>
            )}
          </div>
        </Card>
      )}

      {/* System Information */}
      <Card className="p-6 bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span className="font-medium text-gray-900">
              {formatDate(pilot.created_at)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last Updated:</span>
            <span className="font-medium text-gray-900">
              {formatDate(pilot.updated_at)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
