/**
 * Pilot Requirements Dashboard Card
 *
 * Displays required vs actual pilot staffing levels based on settings.
 * Shows:
 * - Total required pilots (captains + first officers)
 * - Required examiners (based on ratio)
 * - Required training captains (based on ratio)
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
import { getPilotRequirements } from '@/lib/services/admin-service'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface PilotCounts {
  totalPilots: number
  totalCaptains: number
  totalFirstOfficers: number
  totalExaminers: number
  totalTrainingCaptains: number
}

async function getPilotCounts(): Promise<PilotCounts> {
  const supabase = await createClient()

  // Get all active pilots
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

  // Count examiners (captains with examiner qualification in captain_qualifications array)
  const examiners = captains.filter((p) => {
    if (!p.captain_qualifications || !Array.isArray(p.captain_qualifications)) return false
    return p.captain_qualifications.includes('examiner')
  })

  // Count training captains (captains with training_captain qualification in captain_qualifications array)
  const trainingCaptains = captains.filter((p) => {
    if (!p.captain_qualifications || !Array.isArray(p.captain_qualifications)) return false
    return p.captain_qualifications.includes('training_captain')
  })

  return {
    totalPilots: pilots.length,
    totalCaptains: captains.length,
    totalFirstOfficers: firstOfficers.length,
    totalExaminers: examiners.length,
    totalTrainingCaptains: trainingCaptains.length,
  }
}

export async function PilotRequirementsCard() {
  const requirements = await getPilotRequirements()
  const counts = await getPilotCounts()

  // Calculate required totals
  const requiredCaptains = requirements.captains_per_hull * requirements.number_of_aircraft
  const requiredFirstOfficers =
    requirements.first_officers_per_hull * requirements.number_of_aircraft
  const requiredTotalPilots = requiredCaptains + requiredFirstOfficers

  // Calculate required examiners and training captains
  const requiredExaminers = Math.ceil(counts.totalPilots / requirements.examiners_per_pilots)
  const requiredTrainingCaptains = Math.ceil(
    counts.totalPilots / requirements.training_captains_per_pilots
  )

  // Calculate compliance percentages
  const captainsPercentage = Math.round((counts.totalCaptains / requiredCaptains) * 100)
  const firstOfficersPercentage = Math.round(
    (counts.totalFirstOfficers / requiredFirstOfficers) * 100
  )
  const examinersPercentage = Math.round((counts.totalExaminers / requiredExaminers) * 100)
  const trainingCaptainsPercentage = Math.round(
    (counts.totalTrainingCaptains / requiredTrainingCaptains) * 100
  )

  // Determine status colors and accessible labels
  const getPilotStatus = (percentage: number) => {
    if (percentage >= 100) return 'success'
    if (percentage >= 90) return 'warning'
    return 'danger'
  }

  const getStatusLabel = (percentage: number) => {
    if (percentage >= 100) return 'Meeting requirements'
    if (percentage >= 90) return 'Near target'
    return 'Below requirements'
  }

  const captainsStatus = getPilotStatus(captainsPercentage)
  const firstOfficersStatus = getPilotStatus(firstOfficersPercentage)
  const examinersStatus = getPilotStatus(examinersPercentage)
  const trainingCaptainsStatus = getPilotStatus(trainingCaptainsPercentage)

  // Empty state when no pilots exist
  if (counts.totalPilots === 0) {
    return (
      <Card className="border-border bg-card overflow-hidden border shadow-lg">
        {/* Header */}
        <div className="bg-primary px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary-foreground/20 flex h-10 w-10 items-center justify-center rounded-lg backdrop-blur-sm">
                <Users className="text-primary-foreground h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-primary-foreground text-sm font-semibold">
                  Pilot Staffing Requirements
                </h3>
                <p className="text-primary-foreground/70 text-xs">Required vs Actual Levels</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State Content */}
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <UserPlus className="text-muted-foreground h-8 w-8" aria-hidden="true" />
          </div>
          <h4 className="text-foreground mb-2 text-lg font-semibold">No Pilots Registered</h4>
          <p className="text-muted-foreground mb-4 max-w-sm text-sm">
            Add pilots to your fleet to track staffing requirements and compliance levels.
          </p>
          <Link
            href="/dashboard/pilots/new"
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
            aria-label="Add your first pilot"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Add First Pilot
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card overflow-hidden border shadow-lg">
      {/* Header */}
      <div className="bg-primary px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-foreground/20 flex h-10 w-10 items-center justify-center rounded-lg backdrop-blur-sm">
              <Users className="text-primary-foreground h-5 w-5" />
            </div>
            <div>
              <h3 className="text-primary-foreground text-sm font-semibold">
                Pilot Staffing Requirements
              </h3>
              <p className="text-primary-foreground/70 text-xs">Required vs Actual Levels</p>
            </div>
          </div>
          <Badge className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold shadow-md backdrop-blur-sm">
            CRITICAL
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Captains */}
          <div
            className={`rounded-xl border-2 p-4 shadow-sm transition-all hover:scale-[1.02] ${
              captainsStatus === 'success'
                ? 'border-success-200 from-success-50 dark:border-success-800 dark:from-success-950/50 bg-gradient-to-br to-emerald-50 dark:to-emerald-950/50'
                : captainsStatus === 'warning'
                  ? 'border-warning-200 from-warning-50 dark:border-warning-800 dark:from-warning-950/50 bg-gradient-to-br to-orange-50 dark:to-orange-950/50'
                  : 'border-danger-200 from-danger-50 dark:border-danger-800 dark:from-danger-950/50 bg-gradient-to-br to-red-50 dark:to-red-950/50'
            }`}
            role="region"
            aria-label={`Captains staffing: ${counts.totalCaptains} of ${requiredCaptains}, ${getStatusLabel(captainsPercentage)}`}
          >
            {/* Screen reader status announcement */}
            <span className="sr-only">Status: {getStatusLabel(captainsPercentage)}</span>
            <div className="mb-3 flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  captainsStatus === 'success'
                    ? 'bg-success-500'
                    : captainsStatus === 'warning'
                      ? 'bg-warning-500'
                      : 'bg-danger-500'
                }`}
                aria-hidden="true"
              >
                <Users className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-1">
                {counts.totalCaptains >= requiredCaptains ? (
                  <TrendingUp
                    className="text-success-600 dark:text-success-400 h-4 w-4"
                    aria-hidden="true"
                  />
                ) : (
                  <TrendingDown
                    className="text-danger-600 dark:text-danger-400 h-4 w-4"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`text-xs font-bold ${
                    captainsStatus === 'success'
                      ? 'text-success-700 dark:text-success-400'
                      : captainsStatus === 'warning'
                        ? 'text-warning-700 dark:text-warning-400'
                        : 'text-danger-700 dark:text-danger-400'
                  }`}
                >
                  {captainsPercentage}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Captains
              </p>
              <div className="flex items-baseline gap-2">
                <p
                  className={`text-3xl font-black ${
                    captainsStatus === 'success'
                      ? 'text-success-700 dark:text-success-400'
                      : captainsStatus === 'warning'
                        ? 'text-warning-700 dark:text-warning-400'
                        : 'text-danger-700 dark:text-danger-400'
                  }`}
                >
                  {counts.totalCaptains}
                </p>
                <span className="text-muted-foreground text-sm font-medium">
                  / {requiredCaptains}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {counts.totalCaptains >= requiredCaptains
                  ? `+${counts.totalCaptains - requiredCaptains} surplus`
                  : `${requiredCaptains - counts.totalCaptains} short`}
              </p>
            </div>
          </div>

          {/* First Officers */}
          <div
            className={`rounded-xl border-2 p-4 shadow-sm transition-all hover:scale-[1.02] ${
              firstOfficersStatus === 'success'
                ? 'border-success-200 from-success-50 dark:border-success-800 dark:from-success-950/50 bg-gradient-to-br to-emerald-50 dark:to-emerald-950/50'
                : firstOfficersStatus === 'warning'
                  ? 'border-warning-200 from-warning-50 dark:border-warning-800 dark:from-warning-950/50 bg-gradient-to-br to-orange-50 dark:to-orange-950/50'
                  : 'border-danger-200 from-danger-50 dark:border-danger-800 dark:from-danger-950/50 bg-gradient-to-br to-red-50 dark:to-red-950/50'
            }`}
            role="region"
            aria-label={`First Officers staffing: ${counts.totalFirstOfficers} of ${requiredFirstOfficers}, ${getStatusLabel(firstOfficersPercentage)}`}
          >
            {/* Screen reader status announcement */}
            <span className="sr-only">Status: {getStatusLabel(firstOfficersPercentage)}</span>
            <div className="mb-3 flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  firstOfficersStatus === 'success'
                    ? 'bg-success-500'
                    : firstOfficersStatus === 'warning'
                      ? 'bg-warning-500'
                      : 'bg-danger-500'
                }`}
                aria-hidden="true"
              >
                <Users className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-1">
                {counts.totalFirstOfficers >= requiredFirstOfficers ? (
                  <TrendingUp
                    className="text-success-600 dark:text-success-400 h-4 w-4"
                    aria-hidden="true"
                  />
                ) : (
                  <TrendingDown
                    className="text-danger-600 dark:text-danger-400 h-4 w-4"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`text-xs font-bold ${
                    firstOfficersStatus === 'success'
                      ? 'text-success-700 dark:text-success-400'
                      : firstOfficersStatus === 'warning'
                        ? 'text-warning-700 dark:text-warning-400'
                        : 'text-danger-700 dark:text-danger-400'
                  }`}
                >
                  {firstOfficersPercentage}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                First Officers
              </p>
              <div className="flex items-baseline gap-2">
                <p
                  className={`text-3xl font-black ${
                    firstOfficersStatus === 'success'
                      ? 'text-success-700 dark:text-success-400'
                      : firstOfficersStatus === 'warning'
                        ? 'text-warning-700 dark:text-warning-400'
                        : 'text-danger-700 dark:text-danger-400'
                  }`}
                >
                  {counts.totalFirstOfficers}
                </p>
                <span className="text-muted-foreground text-sm font-medium">
                  / {requiredFirstOfficers}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {counts.totalFirstOfficers >= requiredFirstOfficers
                  ? `+${counts.totalFirstOfficers - requiredFirstOfficers} surplus`
                  : `${requiredFirstOfficers - counts.totalFirstOfficers} short`}
              </p>
            </div>
          </div>

          {/* Examiners */}
          <div
            className={`rounded-xl border-2 p-4 shadow-sm transition-all hover:scale-[1.02] ${
              examinersStatus === 'success'
                ? 'border-success-200 from-success-50 dark:border-success-800 dark:from-success-950/50 bg-gradient-to-br to-emerald-50 dark:to-emerald-950/50'
                : examinersStatus === 'warning'
                  ? 'border-warning-200 from-warning-50 dark:border-warning-800 dark:from-warning-950/50 bg-gradient-to-br to-orange-50 dark:to-orange-950/50'
                  : 'border-danger-200 from-danger-50 dark:border-danger-800 dark:from-danger-950/50 bg-gradient-to-br to-red-50 dark:to-red-950/50'
            }`}
            role="region"
            aria-label={`Examiners staffing: ${counts.totalExaminers} of ${requiredExaminers}, ${getStatusLabel(examinersPercentage)}`}
          >
            {/* Screen reader status announcement */}
            <span className="sr-only">Status: {getStatusLabel(examinersPercentage)}</span>
            <div className="mb-3 flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  examinersStatus === 'success'
                    ? 'bg-success-500'
                    : examinersStatus === 'warning'
                      ? 'bg-warning-500'
                      : 'bg-danger-500'
                }`}
                aria-hidden="true"
              >
                <ClipboardCheck className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-1">
                {counts.totalExaminers >= requiredExaminers ? (
                  <TrendingUp
                    className="text-success-600 dark:text-success-400 h-4 w-4"
                    aria-hidden="true"
                  />
                ) : (
                  <TrendingDown
                    className="text-danger-600 dark:text-danger-400 h-4 w-4"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`text-xs font-bold ${
                    examinersStatus === 'success'
                      ? 'text-success-700 dark:text-success-400'
                      : examinersStatus === 'warning'
                        ? 'text-warning-700 dark:text-warning-400'
                        : 'text-danger-700 dark:text-danger-400'
                  }`}
                >
                  {examinersPercentage}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Examiners
              </p>
              <div className="flex items-baseline gap-2">
                <p
                  className={`text-3xl font-black ${
                    examinersStatus === 'success'
                      ? 'text-success-700 dark:text-success-400'
                      : examinersStatus === 'warning'
                        ? 'text-warning-700 dark:text-warning-400'
                        : 'text-danger-700 dark:text-danger-400'
                  }`}
                >
                  {counts.totalExaminers}
                </p>
                <span className="text-muted-foreground text-sm font-medium">
                  / {requiredExaminers}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                1 per {requirements.examiners_per_pilots} pilots
              </p>
            </div>
          </div>

          {/* Training Captains */}
          <div
            className={`rounded-xl border-2 p-4 shadow-sm transition-all hover:scale-[1.02] ${
              trainingCaptainsStatus === 'success'
                ? 'border-success-200 from-success-50 dark:border-success-800 dark:from-success-950/50 bg-gradient-to-br to-emerald-50 dark:to-emerald-950/50'
                : trainingCaptainsStatus === 'warning'
                  ? 'border-warning-200 from-warning-50 dark:border-warning-800 dark:from-warning-950/50 bg-gradient-to-br to-orange-50 dark:to-orange-950/50'
                  : 'border-danger-200 from-danger-50 dark:border-danger-800 dark:from-danger-950/50 bg-gradient-to-br to-red-50 dark:to-red-950/50'
            }`}
            role="region"
            aria-label={`Training Captains staffing: ${counts.totalTrainingCaptains} of ${requiredTrainingCaptains}, ${getStatusLabel(trainingCaptainsPercentage)}`}
          >
            {/* Screen reader status announcement */}
            <span className="sr-only">Status: {getStatusLabel(trainingCaptainsPercentage)}</span>
            <div className="mb-3 flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  trainingCaptainsStatus === 'success'
                    ? 'bg-success-500'
                    : trainingCaptainsStatus === 'warning'
                      ? 'bg-warning-500'
                      : 'bg-danger-500'
                }`}
                aria-hidden="true"
              >
                <GraduationCap className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-1">
                {counts.totalTrainingCaptains >= requiredTrainingCaptains ? (
                  <TrendingUp
                    className="text-success-600 dark:text-success-400 h-4 w-4"
                    aria-hidden="true"
                  />
                ) : (
                  <TrendingDown
                    className="text-danger-600 dark:text-danger-400 h-4 w-4"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`text-xs font-bold ${
                    trainingCaptainsStatus === 'success'
                      ? 'text-success-700 dark:text-success-400'
                      : trainingCaptainsStatus === 'warning'
                        ? 'text-warning-700 dark:text-warning-400'
                        : 'text-danger-700 dark:text-danger-400'
                  }`}
                >
                  {trainingCaptainsPercentage}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Training Captains
              </p>
              <div className="flex items-baseline gap-2">
                <p
                  className={`text-3xl font-black ${
                    trainingCaptainsStatus === 'success'
                      ? 'text-success-700 dark:text-success-400'
                      : trainingCaptainsStatus === 'warning'
                        ? 'text-warning-700 dark:text-warning-400'
                        : 'text-danger-700 dark:text-danger-400'
                  }`}
                >
                  {counts.totalTrainingCaptains}
                </p>
                <span className="text-muted-foreground text-sm font-medium">
                  / {requiredTrainingCaptains}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                1 per {requirements.training_captains_per_pilots} pilots
              </p>
            </div>
          </div>
        </div>

        {/* Footer with settings info */}
        <div className="bg-muted mt-4 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between text-xs">
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
