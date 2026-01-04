/**
 * Pilot Retirement Dialog Component
 * Modal showing detailed retirement information for a pilot
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, Award, TrendingUp } from 'lucide-react'
import {
  calculateRetirementCountdown,
  formatRetirementCountdown,
} from '@/lib/utils/retirement-utils'

interface PilotRetirementDialogProps {
  pilotId: string | null
  open: boolean
  onClose: () => void
}

interface PilotDetails {
  id: string
  employee_id: string | null
  first_name: string
  last_name: string
  role: string
  date_of_birth: string
  retirement_age: number
  seniority_number: number | null
  commencement_date: string | null
}

/**
 * Client Component that displays detailed retirement information in a modal
 * Fetches pilot details when dialog opens
 */
export function PilotRetirementDialog({ pilotId, open, onClose }: PilotRetirementDialogProps) {
  const [pilot, setPilot] = useState<PilotDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !pilotId) {
      setPilot(null)
      setError(null)
      return
    }

    const fetchPilotDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/pilots/${pilotId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch pilot details')
        }
        const data = await response.json()
        setPilot(data)
      } catch (err) {
        console.error('Error fetching pilot details:', err)
        setError('Failed to load pilot details')
      } finally {
        setLoading(false)
      }
    }

    fetchPilotDetails()
  }, [pilotId, open])

  // Calculate retirement details
  const retirementCountdown = pilot?.date_of_birth
    ? calculateRetirementCountdown(pilot.date_of_birth, pilot.retirement_age)
    : null

  const retirementDate = pilot?.date_of_birth
    ? new Date(
        new Date(pilot.date_of_birth).getFullYear() + pilot.retirement_age,
        new Date(pilot.date_of_birth).getMonth(),
        new Date(pilot.date_of_birth).getDate()
      )
    : null

  // Calculate years of service
  const yearsOfService = pilot?.commencement_date
    ? Math.floor(
        (Date.now() - new Date(pilot.commencement_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      )
    : null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pilot Retirement Details</DialogTitle>
          <DialogDescription>Comprehensive retirement information and timeline</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-4 py-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {!loading && !error && pilot && (
          <div className="space-y-6 py-4">
            {/* Pilot Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground text-xl font-semibold">
                  {pilot.first_name} {pilot.last_name}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {pilot.role}
                </Badge>
              </div>
              {pilot.employee_id && (
                <p className="text-muted-foreground text-sm">Employee ID: {pilot.employee_id}</p>
              )}
            </div>

            {/* Retirement Countdown */}
            {retirementCountdown && !retirementCountdown.isRetired && (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Time Until Retirement</span>
                </div>
                <div className="text-3xl font-bold text-purple-900">
                  {formatRetirementCountdown(retirementCountdown)}
                </div>
                <div className="mt-2 text-sm text-purple-700">
                  {retirementCountdown.years} years, {retirementCountdown.months} months,{' '}
                  {retirementCountdown.days} days
                </div>
              </div>
            )}

            {retirementCountdown?.isRetired && (
              <div className="rounded-lg border border-gray-300 bg-gray-100 p-4">
                <p className="text-sm font-medium text-gray-700">This pilot has already retired.</p>
              </div>
            )}

            {/* Retirement Date */}
            {retirementDate && (
              <div className="space-y-3">
                <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-muted-foreground text-xs">Retirement Date</div>
                    <div className="text-foreground font-medium">
                      {retirementDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
                  <Award className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-muted-foreground text-xs">Date of Birth</div>
                    <div className="text-foreground font-medium">
                      {new Date(pilot.date_of_birth).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                {yearsOfService !== null && (
                  <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="text-muted-foreground text-xs">Years of Service</div>
                      <div className="text-foreground font-medium">
                        {yearsOfService} {yearsOfService === 1 ? 'year' : 'years'}
                      </div>
                    </div>
                  </div>
                )}

                {pilot.seniority_number !== null && (
                  <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
                    <Award className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="text-muted-foreground text-xs">Seniority Number</div>
                      <div className="text-foreground font-medium">#{pilot.seniority_number}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Succession Planning Note (Admin only - placeholder) */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Contact HR for succession planning and retirement transition
                support.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
