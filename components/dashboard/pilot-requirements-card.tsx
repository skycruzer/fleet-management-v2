/**
 * Pilot Requirements Dashboard Card
 *
 * Displays required vs actual pilot staffing levels based on settings.
 * Shows captains, first officers, examiners and training captains as
 * required-vs-actual tiles.
 *
 * Two-tier header: a destructive alert band appears only when a role
 * is below requirements; otherwise the header stays quiet.
 *
 * Data sources:
 * - Settings: pilot_requirements table
 * - Actual counts: pilots table
 */

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  UserPlus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getPilotRequirements } from '@/lib/services/admin-service'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { cn } from '@/lib/utils'
import { EmptyState } from './empty-state'

interface PilotCounts {
  totalPilots: number
  totalCaptains: number
  totalFirstOfficers: number
  totalExaminers: number
  totalTrainingCaptains: number
}

type StaffingStatus = 'success' | 'warning' | 'critical'

const STATUS_CLASSES: Record<
  StaffingStatus,
  { border: string; tint: string; solid: string; text: string }
> = {
  success: {
    border: 'border-success/30',
    tint: 'bg-[var(--color-success-muted)]',
    solid: 'bg-success',
    text: 'text-success',
  },
  warning: {
    border: 'border-warning/30',
    tint: 'bg-[var(--color-warning-muted)]',
    solid: 'bg-warning',
    text: 'text-warning',
  },
  critical: {
    border: 'border-destructive/30',
    tint: 'bg-[var(--color-destructive-muted)]',
    solid: 'bg-destructive',
    text: 'text-destructive',
  },
}

function getStaffingStatus(percentage: number): StaffingStatus {
  if (percentage >= 100) return 'success'
  if (percentage >= 90) return 'warning'
  return 'critical'
}

function getStatusLabel(percentage: number): string {
  if (percentage >= 100) return 'Meeting requirements'
  if (percentage >= 90) return 'Near target'
  return 'Below requirements'
}

async function getPilotCounts(): Promise<PilotCounts> {
  const supabase = createServiceRoleClient()

  const { data: pilots } = await supabase
    .from('pilots')
    .select('role, captain_qualifications')
    .eq('is_active', true)

  if (!pilots) {
    return {
      totalPilots: 0,
      totalCaptains: 0,
      totalFirstOfficers: 0,
      totalExaminers: 0,
      totalTrainingCaptains: 0,
    }
  }

  const captains = pilots.filter((p) => p.role === 'Captain')
  const firstOfficers = pilots.filter((p) => p.role === 'First Officer')

  const hasQualification = (
    p: { captain_qualifications: unknown },
    qualification: string
  ): boolean =>
    Array.isArray(p.captain_qualifications) && p.captain_qualifications.includes(qualification)

  return {
    totalPilots: pilots.length,
    totalCaptains: captains.length,
    totalFirstOfficers: firstOfficers.length,
    totalExaminers: captains.filter((p) => hasQualification(p, 'examiner')).length,
    totalTrainingCaptains: captains.filter((p) => hasQualification(p, 'training_captain')).length,
  }
}

interface StatTileProps {
  icon: LucideIcon
  label: string
  actual: number
  required: number
  percentage: number
  note: string
}

function StatTile({ icon: Icon, label, actual, required, percentage, note }: StatTileProps) {
  const status = getStaffingStatus(percentage)
  const c = STATUS_CLASSES[status]
  const meetsTarget = actual >= required
  const Trend = meetsTarget ? TrendingUp : TrendingDown

  return (
    <div
      className={cn('rounded-xl border-2 p-4 shadow-sm', c.border, c.tint)}
      role="region"
      aria-label={`${label} staffing: ${actual} of ${required}, ${getStatusLabel(percentage)}`}
    >
      <span className="sr-only">Status: {getStatusLabel(percentage)}</span>
      <div className="mb-3 flex items-center justify-between">
        <div
          className={cn('flex h-10 w-10 items-center justify-center rounded-lg', c.solid)}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <div className={cn('flex items-center gap-1 text-xs font-bold', c.text)}>
          <Trend className="h-4 w-4" aria-hidden="true" />
          {percentage}%
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <p className={cn('text-3xl font-bold', c.text)}>{actual}</p>
          <span className="text-muted-foreground text-sm font-medium">/ {required}</span>
        </div>
        <p className="text-muted-foreground text-xs">{note}</p>
      </div>
    </div>
  )
}

export async function PilotRequirementsCard() {
  const requirements = await getPilotRequirements()
  const counts = await getPilotCounts()

  // Empty state when no pilots exist
  if (counts.totalPilots === 0) {
    return (
      <Card className="flex h-full flex-col overflow-hidden">
        <div className="border-border flex items-center gap-2 border-b px-4 py-3">
          <Users className="text-muted-foreground h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <h3 className="text-sm font-semibold">Pilot Staffing Requirements</h3>
        </div>
        <div className="flex-1 p-4">
          <EmptyState
            icon={UserPlus}
            title="No pilots registered"
            description="Add pilots to your fleet to track staffing requirements and compliance."
            action={{ href: '/dashboard/pilots/new', label: 'Add first pilot' }}
          />
        </div>
      </Card>
    )
  }

  // Required totals
  const requiredCaptains = requirements.captains_per_hull * requirements.number_of_aircraft
  const requiredFirstOfficers =
    requirements.first_officers_per_hull * requirements.number_of_aircraft
  const requiredExaminers = Math.ceil(counts.totalPilots / requirements.examiners_per_pilots)
  const requiredTrainingCaptains = Math.ceil(
    counts.totalPilots / requirements.training_captains_per_pilots
  )

  const captainsPct = Math.round((counts.totalCaptains / requiredCaptains) * 100)
  const firstOfficersPct = Math.round((counts.totalFirstOfficers / requiredFirstOfficers) * 100)
  const examinersPct = Math.round((counts.totalExaminers / requiredExaminers) * 100)
  const trainingCaptainsPct = Math.round(
    (counts.totalTrainingCaptains / requiredTrainingCaptains) * 100
  )

  const surplusOrShort = (actual: number, required: number) =>
    actual >= required ? `+${actual - required} surplus` : `${required - actual} short`

  // Two-tier header: alert band only when a role is below requirements.
  const statuses = [captainsPct, firstOfficersPct, examinersPct, trainingCaptainsPct].map(
    getStaffingStatus
  )
  const understaffed = statuses.includes('critical')
  const needsReview = !understaffed && statuses.includes('warning')
  const headerBadge = understaffed
    ? { label: 'ACTION NEEDED', variant: 'destructive' as const }
    : needsReview
      ? { label: 'REVIEW', variant: 'warning' as const }
      : { label: 'ON TARGET', variant: 'success' as const }

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {/* Header — alert band only when staffing is below requirements */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-3',
          understaffed ? 'bg-destructive text-destructive-foreground' : 'border-border border-b'
        )}
      >
        <Users
          className={cn('h-4 w-4 flex-shrink-0', understaffed ? '' : 'text-muted-foreground')}
          aria-hidden="true"
        />
        <h3 className="flex-1 text-sm font-semibold">Pilot Staffing Requirements</h3>
        <Badge variant={headerBadge.variant} className="text-xs font-semibold">
          {headerBadge.label}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon={Users}
            label="Captains"
            actual={counts.totalCaptains}
            required={requiredCaptains}
            percentage={captainsPct}
            note={surplusOrShort(counts.totalCaptains, requiredCaptains)}
          />
          <StatTile
            icon={Users}
            label="First Officers"
            actual={counts.totalFirstOfficers}
            required={requiredFirstOfficers}
            percentage={firstOfficersPct}
            note={surplusOrShort(counts.totalFirstOfficers, requiredFirstOfficers)}
          />
          <StatTile
            icon={ClipboardCheck}
            label="Examiners"
            actual={counts.totalExaminers}
            required={requiredExaminers}
            percentage={examinersPct}
            note={`1 per ${requirements.examiners_per_pilots} pilots`}
          />
          <StatTile
            icon={GraduationCap}
            label="Training Captains"
            actual={counts.totalTrainingCaptains}
            required={requiredTrainingCaptains}
            percentage={trainingCaptainsPct}
            note={`1 per ${requirements.training_captains_per_pilots} pilots`}
          />
        </div>

        {/* Footer with settings info */}
        <div className="bg-muted mt-4 rounded-lg px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-muted-foreground font-medium">Aircraft:</span>
                <span className="text-foreground ml-1 font-bold">
                  {requirements.number_of_aircraft}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Capt/Hull:</span>
                <span className="text-foreground ml-1 font-bold">
                  {requirements.captains_per_hull}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">FO/Hull:</span>
                <span className="text-foreground ml-1 font-bold">
                  {requirements.first_officers_per_hull}
                </span>
              </div>
            </div>
            <p className="text-muted-foreground">From system settings (Admin → Settings)</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
