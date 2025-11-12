/**
 * Requests Table Wrapper Component
 *
 * Server component wrapper that fetches pilot requests based on searchParams
 * and passes the data to the client RequestsTable component.
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

import { RequestsTable } from './requests-table'
import { RequestsTableClient } from './requests-table-client'
import {
  getAllPilotRequests,
  type PilotRequestFilters,
  type WorkflowStatus,
  type RequestCategory,
  type SubmissionChannel,
} from '@/lib/services/unified-request-service'

interface RequestsTableWrapperProps {
  searchParams: Promise<{
    roster_period?: string
    pilot_id?: string
    status?: string
    category?: string
    channel?: string
    is_late?: string
    is_past_deadline?: string
  }>
}

export async function RequestsTableWrapper({ searchParams }: RequestsTableWrapperProps) {
  // Await searchParams in Next.js 16
  const params = await searchParams

  // Convert searchParams to filters
  const filters: PilotRequestFilters = {
    roster_period: params.roster_period
      ? params.roster_period.split(',').filter(Boolean)
      : undefined,
    pilot_id: params.pilot_id,
    status: params.status
      ? (params.status.split(',').filter(Boolean) as WorkflowStatus[])
      : undefined,
    request_category: params.category
      ? (params.category.split(',').filter(Boolean) as RequestCategory[])
      : undefined,
    submission_channel: params.channel
      ? (params.channel.split(',').filter(Boolean) as SubmissionChannel[])
      : undefined,
    is_late_request: params.is_late === 'true' ? true : undefined,
    is_past_deadline: params.is_past_deadline === 'true' ? true : undefined,
  }

  // Fetch requests from service layer
  const response = await getAllPilotRequests(filters)

  // Handle error state
  if (!response.success || !response.data) {
    return (
      <div className="flex items-center justify-center py-12 border border-dashed rounded-lg">
        <div className="text-center space-y-3">
          <p className="text-lg font-medium text-red-600">Error loading requests</p>
          <p className="text-sm text-muted-foreground">
            {response.error || 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    )
  }

  // Pass data to client component
  return <RequestsTableClient requests={response.data} />
}
