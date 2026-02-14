/**
 * Pilot Overview Tab Component
 *
 * Displays pilot profile information, stats, and qualifications.
 * Extracted from pilot detail page for tabbed interface.
 *
 * Developer: Maurice Rondeau
 * @version 5.0.0 - Refactored to use PilotInfoCard, hero moved to PilotProfileHeader
 * @date February 2026
 */

'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
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
  FileText,
  Plane,
  Star,
  Mail,
  Phone,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { RetirementInformationCard } from '@/components/pilots/retirement-information-card'
import { PilotInfoCard } from '@/components/pilots/pilot-info-card'
import type { Pilot } from './pilot-detail-tabs'

interface PilotOverviewTabProps {
  pilot: Pilot
  retirementAge: number
  onViewCertifications: () => void
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

export function PilotOverviewTab({
  pilot,
  retirementAge,
  onViewCertifications,
}: PilotOverviewTabProps) {
  const { shouldAnimate, getVariants } = useAnimationSettings()
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
      {/* Certification Status Cards */}
      <motion.div
        variants={getVariants(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <motion.div variants={getVariants(fadeIn)}>
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

        <motion.div variants={getVariants(fadeIn)}>
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

        <motion.div variants={getVariants(fadeIn)}>
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
        initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={shouldAnimate ? { delay: 0.3 } : { duration: 0 }}
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
        initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldAnimate ? { delay: 0.35 } : { duration: 0 }}
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
        variants={getVariants(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        {/* Personal Information */}
        <motion.div variants={getVariants(fadeIn)}>
          <PilotInfoCard
            title="Personal Information"
            icon={User}
            iconBg="bg-primary/10"
            iconColor="text-primary"
            items={[
              { icon: User, label: 'Full Name', value: fullName },
              { icon: Calendar, label: 'Date of Birth', value: formatDate(pilot.date_of_birth) },
              { icon: TrendingUp, label: 'Age', value: calculateAge(pilot.date_of_birth) },
              {
                icon: MapPin,
                label: 'Nationality',
                value: pilot.nationality || 'Not specified',
              },
              {
                icon: Mail,
                label: 'Email',
                value: pilot.email || 'No email on file',
              },
              {
                icon: Phone,
                label: 'Phone',
                value: pilot.phone_number || 'No phone on file',
              },
            ]}
          />
        </motion.div>

        {/* Employment Details */}
        <motion.div variants={getVariants(fadeIn)}>
          <PilotInfoCard
            title="Employment Details"
            icon={Briefcase}
            iconBg="bg-[var(--color-status-low)]/10"
            iconColor="text-[var(--color-status-low)]"
            items={[
              { icon: Shield, label: 'Employee ID', value: pilot.employee_id },
              { icon: Award, label: 'Rank', value: pilot.role },
              {
                icon: Star,
                label: 'Seniority Number',
                value: pilot.seniority_number ? `#${pilot.seniority_number}` : 'Not assigned',
              },
              {
                icon: Briefcase,
                label: 'Contract Type',
                value: pilot.contract_type || 'Not specified',
              },
              {
                icon: Calendar,
                label: 'Commencement Date',
                value: formatDate(pilot.commencement_date),
              },
            ]}
          />
        </motion.div>
      </motion.div>

      {/* Passport Information */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldAnimate ? { delay: 0.4 } : { duration: 0 }}
      >
        <PilotInfoCard
          title="Passport Information"
          icon={FileText}
          iconBg="bg-[var(--color-info)]/10"
          iconColor="text-[var(--color-info)]"
          columns={2}
          items={[
            {
              icon: FileText,
              label: 'Passport Number',
              value: pilot.passport_number || 'Not specified',
            },
            {
              icon: Calendar,
              label: 'Passport Expiry',
              value: formatDate(pilot.passport_expiry),
            },
          ]}
        />
      </motion.div>

      {/* Licence Information */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldAnimate ? { delay: 0.42 } : { duration: 0 }}
      >
        <PilotInfoCard
          title="Licence Information"
          icon={Plane}
          iconBg="bg-[var(--color-category-simulator)]/10"
          iconColor="text-[var(--color-category-simulator)]"
          columns={2}
          items={[
            {
              icon: Award,
              label: 'Licence Type',
              value: pilot.licence_type || 'Not specified',
            },
            {
              icon: FileText,
              label: 'Licence Number',
              value: pilot.licence_number || 'Not specified',
            },
          ]}
        />
      </motion.div>

      {/* Captain Qualifications (only for Captains) */}
      {pilot.role === 'Captain' && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldAnimate ? { delay: 0.45 } : { duration: 0 }}
        >
          <PilotInfoCard
            title="Captain Qualifications"
            icon={Award}
            iconBg="bg-[var(--color-status-medium)]/10"
            iconColor="text-[var(--color-status-medium)]"
          >
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
              <div className="mt-4 flex items-start gap-3">
                <div className="bg-muted mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-xs font-medium">RHS Captain Expiry</p>
                  <p className="text-foreground mt-0.5 truncate text-sm font-semibold">
                    {formatDate(pilot.rhs_captain_expiry)}
                  </p>
                </div>
              </div>
            )}
          </PilotInfoCard>
        </motion.div>
      )}

      {/* System Information */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldAnimate ? { delay: 0.5 } : { duration: 0 }}
      >
        <PilotInfoCard
          title="System Information"
          icon={Clock}
          iconBg="bg-muted"
          iconColor="text-muted-foreground"
          columns={2}
          items={[
            { icon: Calendar, label: 'Record Created', value: formatDate(pilot.created_at) },
            { icon: Calendar, label: 'Last Updated', value: formatDate(pilot.updated_at) },
          ]}
        />
      </motion.div>
    </div>
  )
}
