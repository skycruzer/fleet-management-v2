'use client'

/**
 * Pilot Personal Information Page
 * View pilot's personal information and profile details
 */

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  UserCircle,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Award,
  Shield,
  Clock,
  Hash,
} from 'lucide-react'
import { format } from 'date-fns'

interface PilotProfile {
  id: string
  first_name: string
  last_name: string
  rank: string
  email: string
  employee_id: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  date_of_birth: string | null
  commencement_date: string | null
  license_number: string | null
  status: string
  seniority_number: number | null
  qualifications: any
  contract_type: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<PilotProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/portal/profile')
      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to fetch profile')
        setIsLoading(false)
        return
      }

      setProfile(result.data)
      setIsLoading(false)
    } catch (err) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy')
    } catch {
      return 'Invalid date'
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
      on_leave: { color: 'bg-yellow-100 text-yellow-800', label: 'On Leave' },
      suspended: { color: 'bg-red-100 text-red-800', label: 'Suspended' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive
    return <Badge className={`${config.color} border-0`}>{config.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Card className="p-12">
          <p className="text-gray-600">Loading profile...</p>
        </Card>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Card className="p-12 text-center">
          <p className="mb-4 text-red-600">{error || 'Profile not found'}</p>
          <Link href="/portal/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-card/80 sticky top-0 z-10 border-b backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600">
                <UserCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-foreground text-xl font-bold">My Profile</h1>
                <p className="text-muted-foreground text-xs">Personal Information</p>
              </div>
            </div>
            <Link href="/portal/dashboard">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile Header Card */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600">
                <UserCircle className="h-16 w-16 text-white" />
              </div>
              <div>
                <h2 className="text-foreground text-3xl font-bold">
                  {profile.rank} {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-muted-foreground mt-1 text-lg">
                  Employee ID: {profile.employee_id || 'Not assigned'}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  {getStatusBadge(profile.status)}
                  {profile.seniority_number && (
                    <Badge variant="outline" className="text-xs">
                      Seniority #{profile.seniority_number}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Information Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Contact Information */}
          <Card className="p-6">
            <div className="mb-4 flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <h3 className="text-foreground text-lg font-semibold">Contact Information</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">Email Address</p>
                <p className="text-foreground font-medium">{profile.email}</p>
              </div>
              {profile.phone && (
                <div>
                  <p className="text-muted-foreground text-sm">Phone Number</p>
                  <p className="text-foreground font-medium">{profile.phone}</p>
                </div>
              )}
              {profile.address && (
                <div>
                  <p className="text-muted-foreground text-sm">Address</p>
                  <p className="text-foreground font-medium">{profile.address}</p>
                  {(profile.city || profile.state || profile.postal_code) && (
                    <p className="text-foreground font-medium">
                      {[profile.city, profile.state, profile.postal_code]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {profile.country && (
                    <p className="text-foreground font-medium">{profile.country}</p>
                  )}
                </div>
              )}
              {!profile.address && !profile.phone && (
                <p className="text-muted-foreground text-sm italic">
                  No additional contact information available
                </p>
              )}
            </div>
          </Card>

          {/* Employment Details */}
          <Card className="p-6">
            <div className="mb-4 flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-green-600" />
              <h3 className="text-foreground text-lg font-semibold">Employment Details</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">Rank</p>
                <p className="text-foreground text-lg font-medium">{profile.rank}</p>
              </div>
              {profile.commencement_date && (
                <div>
                  <p className="text-muted-foreground text-sm">Commencement Date</p>
                  <p className="text-foreground font-medium">
                    {formatDate(profile.commencement_date)}
                  </p>
                </div>
              )}
              {profile.contract_type && (
                <div>
                  <p className="text-muted-foreground text-sm">Contract Type</p>
                  <p className="text-foreground font-medium">{profile.contract_type}</p>
                </div>
              )}
              {profile.seniority_number && (
                <div>
                  <p className="text-muted-foreground text-sm">Seniority Number</p>
                  <p className="text-foreground font-medium">#{profile.seniority_number}</p>
                </div>
              )}
            </div>
          </Card>

          {/* License Information */}
          <Card className="p-6">
            <div className="mb-4 flex items-center space-x-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              <h3 className="text-foreground text-lg font-semibold">License Information</h3>
            </div>
            <div className="space-y-4">
              {profile.license_number && (
                <div>
                  <p className="text-muted-foreground text-sm">License Number</p>
                  <p className="text-foreground font-medium">{profile.license_number}</p>
                </div>
              )}
              {profile.date_of_birth && (
                <div>
                  <p className="text-muted-foreground text-sm">Date of Birth</p>
                  <p className="text-foreground font-medium">{formatDate(profile.date_of_birth)}</p>
                </div>
              )}
              {!profile.license_number && !profile.date_of_birth && (
                <p className="text-muted-foreground text-sm italic">
                  No license information available
                </p>
              )}
            </div>
          </Card>

          {/* Qualifications */}
          <Card className="p-6">
            <div className="mb-4 flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <h3 className="text-foreground text-lg font-semibold">Qualifications</h3>
            </div>
            <div className="space-y-3">
              {profile.qualifications && Object.keys(profile.qualifications).length > 0 ? (
                Object.entries(profile.qualifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <p className="text-foreground font-medium capitalize">
                      {key.replace(/_/g, ' ')}
                    </p>
                    {typeof value === 'boolean' ? (
                      value ? (
                        <Badge className="border-0 bg-green-100 text-green-800">Qualified</Badge>
                      ) : (
                        <Badge className="border-0 bg-gray-100 text-gray-800">Not Qualified</Badge>
                      )
                    ) : (
                      <p className="text-muted-foreground text-sm">{String(value)}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm italic">No qualifications recorded</p>
              )}
            </div>
          </Card>
        </div>

        {/* Info Notice */}
        <Card className="mt-8 border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start space-x-3">
            <Clock className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <p className="text-foreground font-medium">Update Required?</p>
              <p className="text-muted-foreground mt-1 text-sm">
                If any of your personal information needs to be updated, please contact Fleet
                Management via the Feedback page.
              </p>
              <Link href="/portal/feedback">
                <Button variant="outline" className="mt-4">
                  Contact Fleet Management
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
