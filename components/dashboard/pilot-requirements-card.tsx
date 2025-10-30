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
import { Users, GraduationCap, ClipboardCheck, TrendingUp, TrendingDown } from 'lucide-react'
import { getPilotRequirements } from '@/lib/services/admin-service'
import { createClient } from '@/lib/supabase/server'

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
  const requiredFirstOfficers = requirements.first_officers_per_hull * requirements.number_of_aircraft
  const requiredTotalPilots = requiredCaptains + requiredFirstOfficers

  // Calculate required examiners and training captains
  const requiredExaminers = Math.ceil(counts.totalPilots / requirements.examiners_per_pilots)
  const requiredTrainingCaptains = Math.ceil(
    counts.totalPilots / requirements.training_captains_per_pilots
  )

  // Calculate compliance percentages
  const captainsPercentage = Math.round((counts.totalCaptains / requiredCaptains) * 100)
  const firstOfficersPercentage = Math.round((counts.totalFirstOfficers / requiredFirstOfficers) * 100)
  const examinersPercentage = Math.round((counts.totalExaminers / requiredExaminers) * 100)
  const trainingCaptainsPercentage = Math.round(
    (counts.totalTrainingCaptains / requiredTrainingCaptains) * 100
  )

  // Determine status colors
  const getPilotStatus = (percentage: number) => {
    if (percentage >= 100) return 'success'
    if (percentage >= 90) return 'warning'
    return 'danger'
  }

  const captainsStatus = getPilotStatus(captainsPercentage)
  const firstOfficersStatus = getPilotStatus(firstOfficersPercentage)
  const examinersStatus = getPilotStatus(examinersPercentage)
  const trainingCaptainsStatus = getPilotStatus(trainingCaptainsPercentage)

  return (
    <Card className="overflow-hidden border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-lg dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4 dark:from-indigo-700 dark:to-purple-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/90">Pilot Staffing Requirements</h3>
              <p className="text-xs text-white/70">Required vs Actual Levels</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-xs font-bold text-white shadow-md backdrop-blur-sm">
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
                ? 'border-success-200 bg-gradient-to-br from-success-50 to-emerald-50 dark:border-success-800 dark:from-success-950/50 dark:to-emerald-950/50'
                : captainsStatus === 'warning'
                  ? 'border-warning-200 bg-gradient-to-br from-warning-50 to-orange-50 dark:border-warning-800 dark:from-warning-950/50 dark:to-orange-950/50'
                  : 'border-danger-200 bg-gradient-to-br from-danger-50 to-red-50 dark:border-danger-800 dark:from-danger-950/50 dark:to-red-950/50'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  captainsStatus === 'success'
                    ? 'bg-success-500'
                    : captainsStatus === 'warning'
                      ? 'bg-warning-500'
                      : 'bg-danger-500'
                }`}
              >
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-1">
                {counts.totalCaptains >= requiredCaptains ? (
                  <TrendingUp className="h-4 w-4 text-success-600 dark:text-success-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-danger-600 dark:text-danger-400" />
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
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
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
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  / {requiredCaptains}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {counts.totalCaptains >= requiredCaptains ? `+${counts.totalCaptains - requiredCaptains} surplus` : `${requiredCaptains - counts.totalCaptains} short`}
              </p>
            </div>
          </div>

          {/* First Officers */}
          <div
            className={`rounded-xl border-2 p-4 shadow-sm transition-all hover:scale-[1.02] ${
              firstOfficersStatus === 'success'
                ? 'border-success-200 bg-gradient-to-br from-success-50 to-emerald-50 dark:border-success-800 dark:from-success-950/50 dark:to-emerald-950/50'
                : firstOfficersStatus === 'warning'
                  ? 'border-warning-200 bg-gradient-to-br from-warning-50 to-orange-50 dark:border-warning-800 dark:from-warning-950/50 dark:to-orange-950/50'
                  : 'border-danger-200 bg-gradient-to-br from-danger-50 to-red-50 dark:border-danger-800 dark:from-danger-950/50 dark:to-red-950/50'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  firstOfficersStatus === 'success'
                    ? 'bg-success-500'
                    : firstOfficersStatus === 'warning'
                      ? 'bg-warning-500'
                      : 'bg-danger-500'
                }`}
              >
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-1">
                {counts.totalFirstOfficers >= requiredFirstOfficers ? (
                  <TrendingUp className="h-4 w-4 text-success-600 dark:text-success-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-danger-600 dark:text-danger-400" />
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
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
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
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  / {requiredFirstOfficers}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {counts.totalFirstOfficers >= requiredFirstOfficers ? `+${counts.totalFirstOfficers - requiredFirstOfficers} surplus` : `${requiredFirstOfficers - counts.totalFirstOfficers} short`}
              </p>
            </div>
          </div>

          {/* Examiners */}
          <div
            className={`rounded-xl border-2 p-4 shadow-sm transition-all hover:scale-[1.02] ${
              examinersStatus === 'success'
                ? 'border-success-200 bg-gradient-to-br from-success-50 to-emerald-50 dark:border-success-800 dark:from-success-950/50 dark:to-emerald-950/50'
                : examinersStatus === 'warning'
                  ? 'border-warning-200 bg-gradient-to-br from-warning-50 to-orange-50 dark:border-warning-800 dark:from-warning-950/50 dark:to-orange-950/50'
                  : 'border-danger-200 bg-gradient-to-br from-danger-50 to-red-50 dark:border-danger-800 dark:from-danger-950/50 dark:to-red-950/50'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  examinersStatus === 'success'
                    ? 'bg-success-500'
                    : examinersStatus === 'warning'
                      ? 'bg-warning-500'
                      : 'bg-danger-500'
                }`}
              >
                <ClipboardCheck className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-1">
                {counts.totalExaminers >= requiredExaminers ? (
                  <TrendingUp className="h-4 w-4 text-success-600 dark:text-success-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-danger-600 dark:text-danger-400" />
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
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
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
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  / {requiredExaminers}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                1 per {requirements.examiners_per_pilots} pilots
              </p>
            </div>
          </div>

          {/* Training Captains */}
          <div
            className={`rounded-xl border-2 p-4 shadow-sm transition-all hover:scale-[1.02] ${
              trainingCaptainsStatus === 'success'
                ? 'border-success-200 bg-gradient-to-br from-success-50 to-emerald-50 dark:border-success-800 dark:from-success-950/50 dark:to-emerald-950/50'
                : trainingCaptainsStatus === 'warning'
                  ? 'border-warning-200 bg-gradient-to-br from-warning-50 to-orange-50 dark:border-warning-800 dark:from-warning-950/50 dark:to-orange-950/50'
                  : 'border-danger-200 bg-gradient-to-br from-danger-50 to-red-50 dark:border-danger-800 dark:from-danger-950/50 dark:to-red-950/50'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  trainingCaptainsStatus === 'success'
                    ? 'bg-success-500'
                    : trainingCaptainsStatus === 'warning'
                      ? 'bg-warning-500'
                      : 'bg-danger-500'
                }`}
              >
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-1">
                {counts.totalTrainingCaptains >= requiredTrainingCaptains ? (
                  <TrendingUp className="h-4 w-4 text-success-600 dark:text-success-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-danger-600 dark:text-danger-400" />
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
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
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
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  / {requiredTrainingCaptains}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                1 per {requirements.training_captains_per_pilots} pilots
              </p>
            </div>
          </div>
        </div>

        {/* Footer with settings info */}
        <div className="mt-4 rounded-lg bg-slate-100 px-4 py-3 dark:bg-slate-800/50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Aircraft:</span>
                <span className="ml-1 font-bold text-slate-900 dark:text-white">
                  {requirements.number_of_aircraft}
                </span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">
                  Capt/Hull:
                </span>
                <span className="ml-1 font-bold text-slate-900 dark:text-white">
                  {requirements.captains_per_hull}
                </span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">FO/Hull:</span>
                <span className="ml-1 font-bold text-slate-900 dark:text-white">
                  {requirements.first_officers_per_hull}
                </span>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              From system settings (Admin → Settings)
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
