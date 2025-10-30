/**
 * Pilot Personal Information Page - Server Component Version
 * View pilot's personal information and profile details only
 *
 * PERFORMANCE IMPROVEMENTS:
 * - Data fetched on server (no loading state, faster initial render)
 * - Reduced client bundle size (no useState, useEffect, client fetch)
 * - Animations moved to client wrapper component
 */

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  User,
  UserCircle,
  Mail,
  Briefcase,
  Award,
  Shield,
  Clock,
  MapPin,
  TrendingUp,
  Calendar,
  XCircle,
  Star,
  FileText,
  Plane,
} from 'lucide-react'
import { format, differenceInYears, differenceInMonths } from 'date-fns'
import { ProfileAnimationWrapper } from './profile-animation-wrapper'

interface PilotProfile {
  id: string
  first_name: string
  last_name: string
  middle_name: string | null
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
  captain_qualifications: any
  qualification_notes: string | null
  contract_type: string | null
  role: string | null
  is_active: boolean | null
  nationality: string | null
  passport_number: string | null
  passport_expiry: string | null
  rhs_captain_expiry: string | null
}

// Server-side data fetching
async function getProfile(): Promise<{ profile: PilotProfile | null; retirementAge: number; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Get all cookies to forward to API
    const cookieStore = await cookies()
    const cookieString = cookieStore.getAll()
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ')

    const response = await fetch(`${baseUrl}/api/portal/profile`, {
      headers: {
        Cookie: cookieString,
      },
      cache: 'no-store', // Always fetch fresh data
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return { profile: null, retirementAge: 65, error: result.error || 'Failed to fetch profile' }
    }

    return {
      profile: result.data,
      retirementAge: result.systemSettings?.pilot_retirement_age || 65,
    }
  } catch (err) {
    return { profile: null, retirementAge: 65, error: 'An unexpected error occurred' }
  }
}

// Utility functions (pure, no side effects)
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

const calculateYearsOfService = (commencementDate: string | null) => {
  if (!commencementDate) return 'N/A'

  const start = new Date(commencementDate)
  const now = new Date()

  const years = differenceInYears(now, start)
  const months = differenceInMonths(now, start) % 12

  if (years === 0) {
    return `${months} month${months !== 1 ? 's' : ''}`
  } else if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`
  } else {
    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`
  }
}

const calculateAge = (dateOfBirth: string | null) => {
  if (!dateOfBirth) return 'N/A'
  return differenceInYears(new Date(), new Date(dateOfBirth))
}

const parseCaptainQualifications = (qualifications: any): string[] => {
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

// InfoRow Component (Server Component)
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

// Main Server Component
export default async function ProfilePage() {
  const { profile, retirementAge, error } = await getProfile()

  if (error || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md p-12 text-center">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-600" />
          <h3 className="mb-2 text-xl font-bold text-foreground">Error</h3>
          <p className="mb-6 text-muted-foreground">{error || 'Profile not found'}</p>
        </Card>
      </div>
    )
  }

  const fullName = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ')

  return (
    <ProfileAnimationWrapper>
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <Card className="h-full p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
            </div>
            <div className="space-y-4">
              <InfoRow icon={User} label="Full Name" value={fullName} />
              <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(profile.date_of_birth)} />
              <InfoRow icon={TrendingUp} label="Age" value={`${calculateAge(profile.date_of_birth)} years`} />
              <InfoRow icon={MapPin} label="Nationality" value={profile.nationality || 'Not specified'} />
            </div>
          </Card>

          {/* Employment Information */}
          <Card className="h-full p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Briefcase className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Employment Details</h3>
            </div>
            <div className="space-y-4">
              <InfoRow icon={Shield} label="Employee ID" value={profile.employee_id || 'Not assigned'} />
              <InfoRow icon={Award} label="Rank" value={profile.rank || profile.role || 'N/A'} />
              <InfoRow icon={Star} label="Seniority Number" value={profile.seniority_number ? `#${profile.seniority_number}` : 'Not assigned'} />
              <InfoRow icon={Briefcase} label="Contract Type" value={profile.contract_type || 'Not specified'} />
              <InfoRow icon={Calendar} label="Commencement Date" value={formatDate(profile.commencement_date)} />
              <InfoRow icon={Clock} label="Years in Service" value={calculateYearsOfService(profile.commencement_date)} />
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="h-full p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
            </div>
            <div className="space-y-4">
              <InfoRow icon={Mail} label="Email Address" value={profile.email} />
              {profile.phone && (
                <InfoRow icon={Calendar} label="Phone Number" value={profile.phone} />
              )}
              {profile.address && (
                <>
                  <InfoRow icon={MapPin} label="Address" value={profile.address} />
                  {(profile.city || profile.state || profile.postal_code) && (
                    <InfoRow icon={MapPin} label="City/State" value={[profile.city, profile.state, profile.postal_code].filter(Boolean).join(', ')} />
                  )}
                  {profile.country && (
                    <InfoRow icon={MapPin} label="Country" value={profile.country} />
                  )}
                </>
              )}
              {!profile.phone && !profile.address && (
                <p className="text-muted-foreground text-sm italic">
                  No additional contact information available
                </p>
              )}
            </div>
          </Card>

          {/* Passport Information */}
          <Card className="h-full p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Passport & License Information</h3>
            </div>
            <div className="space-y-4">
              {profile.license_number && (
                <InfoRow icon={Shield} label="License Number" value={profile.license_number} />
              )}
              {profile.passport_number && (
                <InfoRow icon={Shield} label="Passport Number" value={profile.passport_number} />
              )}
              {profile.passport_expiry && (
                <InfoRow icon={Calendar} label="Passport Expiry" value={formatDate(profile.passport_expiry)} />
              )}
              {!profile.license_number && !profile.passport_number && (
                <p className="text-muted-foreground text-sm italic">
                  No passport or license information available
                </p>
              )}
            </div>
          </Card>

          {/* Professional Details */}
          <Card className="h-full p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/50/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Professional Details</h3>
            </div>
            <div className="space-y-4">
              {profile.role === 'Captain' && profile.rhs_captain_expiry && (
                <InfoRow
                  icon={Calendar}
                  label="RHS Captain Expiry"
                  value={formatDate(profile.rhs_captain_expiry)}
                />
              )}
              {profile.qualification_notes ? (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">Qualification Notes</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground whitespace-pre-wrap">
                      {profile.qualification_notes}
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
        </div>

        {/* Captain Qualifications - Only show if Captain */}
        {(profile.role === 'Captain' || profile.rank === 'Captain') && (
          <Card className="p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Captain Qualifications</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {parseCaptainQualifications(profile.captain_qualifications).length > 0 ? (
                parseCaptainQualifications(profile.captain_qualifications).map((qual, index) => (
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
        )}

        {/* Info Notice */}
        <Card className="border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start space-x-3">
            <Clock className="mt-0.5 h-5 w-5 text-primary" />
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
      </div>
    </ProfileAnimationWrapper>
  )
}
