/**
 * Pilot Overview Tab Component
 *
 * Displays pilot profile information, stats, and qualifications.
 * Extracted from pilot detail page for tabbed interface.
 *
 * Developer: Maurice Rondeau
 * @date December 6, 2025
 */

'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
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
import { RetirementCountdownBadge } from '@/components/pilots/RetirementCountdownBadge'
import { RetirementInformationCard } from '@/components/pilots/RetirementInformationCard'
import type { Pilot } from './pilot-detail-tabs'

interface PilotOverviewTabProps {
  pilot: Pilot
  retirementAge: number
  onPilotDelete: () => Promise<void>
  onViewCertifications: () => void
  isDeleting: boolean
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

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Not specified'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function calculateAge(dateOfBirth: string | null): string {
  if (!dateOfBirth) return 'Unknown'
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return `${age} years`
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-muted mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
        <Icon className="text-muted-foreground h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <p className="text-foreground mt-0.5 truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}

export function PilotOverviewTab({
  pilot,
  retirementAge,
  onPilotDelete,
  onViewCertifications,
  isDeleting,
}: PilotOverviewTabProps) {
  const fullName = [pilot.first_name, pilot.middle_name, pilot.last_name].filter(Boolean).join(' ')

  // Parse captain qualifications
  function getCaptainQualifications(): string[] {
    const qualifications = pilot.captain_qualifications

    if (Array.isArray(qualifications)) {
      return qualifications.filter((q): q is string => typeof q === 'string')
    }

    if (qualifications && typeof qualifications === 'object') {
      const quals: string[] = []
      if ((qualifications as Record<string, boolean>).line_captain === true)
        quals.push('Line Captain')
      if ((qualifications as Record<string, boolean>).training_captain === true)
        quals.push('Training Captain')
      if ((qualifications as Record<string, boolean>).examiner === true) quals.push('Examiner')
      return quals
    }

    return []
  }

  const captainQualifications = getCaptainQualifications()

  return (
    <div className="space-y-6">
      {/* Hero Section with Gradient Background */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="via-primary relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-accent-600)] to-[var(--color-accent-800)] p-8 text-white shadow-2xl"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="relative">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar placeholder */}
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30 backdrop-blur-sm">
                {pilot.role === 'Captain' ? (
                  <Star className="h-10 w-10 text-[var(--color-warning-500)]" />
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
                        ? 'bg-[var(--color-status-low)]/30 ring-1 ring-[var(--color-status-low)]/50'
                        : 'bg-white/20 ring-1 ring-white/30'
                    )}
                  >
                    {pilot.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {pilot.seniority_number && (
                    <span className="rounded-full bg-[var(--color-warning-muted)] px-4 py-1.5 text-sm font-semibold ring-1 ring-[var(--color-warning-500)]/50 backdrop-blur-sm">
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
              <Button variant="destructive" size="sm" onClick={onPilotDelete} disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
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
          <Card className="group relative overflow-hidden border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] p-6 transition-all hover:shadow-lg">
            <div className="absolute top-0 right-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-[var(--color-status-low)]/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-[var(--color-status-low)]">Current</p>
                <p className="text-4xl font-bold text-[var(--color-status-low)]">
                  {pilot.certificationStatus.current}
                </p>
                <p className="mt-1 text-xs text-[var(--color-status-low)]">Certifications</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-status-low)]/20">
                <CheckCircle2 className="h-7 w-7 text-[var(--color-status-low)]" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn}>
          <Card className="group relative overflow-hidden border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] p-6 transition-all hover:shadow-lg">
            <div className="absolute top-0 right-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-[var(--color-status-medium)]/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-[var(--color-status-medium)]">
                  Expiring Soon
                </p>
                <p className="text-4xl font-bold text-[var(--color-status-medium)]">
                  {pilot.certificationStatus.expiring}
                </p>
                <p className="mt-1 text-xs text-[var(--color-status-medium)]">Within 30 days</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-status-medium)]/20">
                <AlertCircle className="h-7 w-7 text-[var(--color-status-medium)]" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn}>
          <Card className="group relative overflow-hidden border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] p-6 transition-all hover:shadow-lg">
            <div className="absolute top-0 right-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-[var(--color-status-high)]/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-[var(--color-status-high)]">Expired</p>
                <p className="text-4xl font-bold text-[var(--color-status-high)]">
                  {pilot.certificationStatus.expired}
                </p>
                <p className="mt-1 text-xs text-[var(--color-status-high)]">Needs renewal</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-status-high)]/20">
                <XCircle className="h-7 w-7 text-[var(--color-status-high)]" />
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
          onClick={onViewCertifications}
          size="lg"
          className="to-primary hover:to-primary/90 bg-gradient-to-r from-[var(--color-accent-600)] text-white shadow-lg transition-all hover:from-[var(--color-accent-700)] hover:shadow-xl"
        >
          <FileText className="mr-2 h-5 w-5" />
          View & Edit All Certifications
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
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <User className="text-primary h-5 w-5" />
              </div>
              <h3 className="text-foreground text-lg font-semibold">Personal Information</h3>
            </div>
            <div className="space-y-4">
              <InfoRow icon={User} label="Full Name" value={fullName} />
              <InfoRow
                icon={Calendar}
                label="Date of Birth"
                value={formatDate(pilot.date_of_birth)}
              />
              <InfoRow icon={TrendingUp} label="Age" value={calculateAge(pilot.date_of_birth)} />
              <InfoRow
                icon={MapPin}
                label="Nationality"
                value={pilot.nationality || 'Not specified'}
              />
            </div>
          </Card>
        </motion.div>

        {/* Employment Information */}
        <motion.div variants={fadeIn}>
          <Card className="h-full p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-status-low)]/10">
                <Briefcase className="h-5 w-5 text-[var(--color-status-low)]" />
              </div>
              <h3 className="text-foreground text-lg font-semibold">Employment Details</h3>
            </div>
            <div className="space-y-4">
              <InfoRow icon={Shield} label="Employee ID" value={pilot.employee_id} />
              <InfoRow icon={Award} label="Rank" value={pilot.role} />
              <InfoRow
                icon={Star}
                label="Seniority Number"
                value={pilot.seniority_number ? `#${pilot.seniority_number}` : 'Not assigned'}
              />
              <InfoRow
                icon={Briefcase}
                label="Contract Type"
                value={pilot.contract_type || 'Not specified'}
              />
              <InfoRow
                icon={Calendar}
                label="Commencement Date"
                value={formatDate(pilot.commencement_date)}
              />
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Passport Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 transition-all hover:shadow-md">
          <div className="mb-4 flex items-center gap-3 border-b pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-info)]/10">
              <FileText className="h-5 w-5 text-[var(--color-info)]" />
            </div>
            <h3 className="text-foreground text-lg font-semibold">Passport Information</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoRow
              icon={FileText}
              label="Passport Number"
              value={pilot.passport_number || 'Not specified'}
            />
            <InfoRow
              icon={Calendar}
              label="Passport Expiry"
              value={formatDate(pilot.passport_expiry)}
            />
          </div>
        </Card>
      </motion.div>

      {/* Licence Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
      >
        <Card className="p-6 transition-all hover:shadow-md">
          <div className="mb-4 flex items-center gap-3 border-b pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-category-simulator)]/10">
              <Plane className="h-5 w-5 text-[var(--color-category-simulator)]" />
            </div>
            <h3 className="text-foreground text-lg font-semibold">Licence Information</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoRow
              icon={Award}
              label="Licence Type"
              value={pilot.licence_type || 'Not specified'}
            />
            <InfoRow
              icon={FileText}
              label="Licence Number"
              value={pilot.licence_number || 'Not specified'}
            />
          </div>
        </Card>
      </motion.div>

      {/* Captain Qualifications (only for Captains) */}
      {pilot.role === 'Captain' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-status-medium)]/10">
                <Award className="h-5 w-5 text-[var(--color-status-medium)]" />
              </div>
              <h3 className="text-foreground text-lg font-semibold">Captain Qualifications</h3>
            </div>
            <div className="space-y-4">
              {captainQualifications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {captainQualifications.map((qual, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-status-medium-bg)] px-3 py-1.5 text-sm font-medium text-[var(--color-status-medium)]"
                    >
                      <Star className="h-3.5 w-3.5" />
                      {qual}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No qualifications recorded</p>
              )}
              {pilot.qualification_notes && (
                <div className="bg-muted/50 mt-4 rounded-lg p-3">
                  <p className="text-muted-foreground text-sm">{pilot.qualification_notes}</p>
                </div>
              )}
              {pilot.rhs_captain_expiry && (
                <InfoRow
                  icon={Calendar}
                  label="RHS Captain Expiry"
                  value={formatDate(pilot.rhs_captain_expiry)}
                />
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
            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
              <Clock className="text-muted-foreground h-5 w-5" />
            </div>
            <h3 className="text-foreground text-lg font-semibold">System Information</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoRow icon={Calendar} label="Record Created" value={formatDate(pilot.created_at)} />
            <InfoRow icon={Calendar} label="Last Updated" value={formatDate(pilot.updated_at)} />
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
