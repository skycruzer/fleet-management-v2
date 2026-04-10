// Maurice Rondeau — Published Rosters Page
import { Suspense } from 'react'
import { Metadata } from 'next'
import {
  getRosterWithAssignments,
  getUploadedPeriodCodes,
} from '@/lib/services/published-roster-service'
import { getActivityCodes } from '@/lib/services/activity-code-service'
import { unwrapOr } from '@/lib/types/service-response'
import { getCurrentRosterPeriodObject } from '@/lib/utils/roster-utils'
import { PublishedRostersClient } from './published-rosters-client'

export const metadata: Metadata = {
  title: 'Published Rosters | Fleet Management',
  description: 'View and manage published crew rosters',
}

function RosterSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="animate-shimmer bg-muted h-8 w-56 rounded-lg" />
        <div className="animate-shimmer bg-muted h-4 w-96 rounded-lg" />
      </div>
      <div className="animate-shimmer bg-muted h-12 w-full rounded-lg" />
      <div className="animate-shimmer bg-muted h-10 w-full rounded-lg" />
      <div className="animate-shimmer bg-muted h-[500px] w-full rounded-lg" />
    </div>
  )
}

async function PublishedRostersData() {
  const currentPeriod = getCurrentRosterPeriodObject()

  const [uploadedCodes, activityCodesResponse, rosterData] = await Promise.all([
    getUploadedPeriodCodes(),
    getActivityCodes(),
    getRosterWithAssignments(currentPeriod.code),
  ])

  return (
    <PublishedRostersClient
      initialPeriodCode={currentPeriod.code}
      initialRoster={rosterData}
      initialUploadedCodes={uploadedCodes}
      activityCodes={unwrapOr(activityCodesResponse, [])}
    />
  )
}

export default function PublishedRostersPage() {
  return (
    <Suspense fallback={<RosterSkeleton />}>
      <PublishedRostersData />
    </Suspense>
  )
}
