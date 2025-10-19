/**
 * Request Deduplication Examples
 *
 * This file demonstrates various use cases for request deduplication
 * in the Fleet Management V2 application.
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDeduplicatedSubmit, useDeduplicatedAction } from '@/lib/hooks/use-deduplicated-submit'
import { deduplicatedFetch, requestDeduplicator, generateRequestKey } from '@/lib/request-deduplication'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

// ============================================================================
// EXAMPLE 1: TanStack Query Automatic Deduplication
// ============================================================================

/**
 * Multiple components rendering the same query will only trigger ONE request
 * React Query automatically deduplicates based on queryKey
 */
function PilotCountWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['pilots', { is_active: true }],
    queryFn: async () => {
      const response = await fetch('/api/pilots?status=active')
      return response.json()
    },
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-semibold">Active Pilots</h3>
      <p className="text-3xl font-bold">{data?.count || 0}</p>
    </div>
  )
}

function PilotListWidget() {
  // Same queryKey = shares the request with PilotCountWidget
  const { data } = useQuery({
    queryKey: ['pilots', { is_active: true }],
    queryFn: async () => {
      const response = await fetch('/api/pilots?status=active')
      return response.json()
    },
  })

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-semibold">Pilot List</h3>
      <ul>
        {data?.data?.slice(0, 5).map((pilot: any) => (
          <li key={pilot.id}>{pilot.first_name} {pilot.last_name}</li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Dashboard that renders both widgets
 * Result: Only ONE API call to /api/pilots, shared between both components
 */
export function DashboardWithDeduplication() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <PilotCountWidget />
      <PilotListWidget />
    </div>
  )
}

// ============================================================================
// EXAMPLE 2: Manual Request Deduplication
// ============================================================================

/**
 * Using deduplicatedFetch for one-off requests
 */
async function fetchPilotsManually() {
  // Multiple calls to this function will share the same request
  const response = await deduplicatedFetch('/api/pilots')
  return response.json()
}

/**
 * Using requestDeduplicator.deduplicate() for complex logic
 */
async function fetchPilotWithCertifications(pilotId: string) {
  const key = generateRequestKey('GET', `/api/pilots/${pilotId}/certifications`)

  return requestDeduplicator.deduplicate(key, async () => {
    const response = await fetch(`/api/pilots/${pilotId}/certifications`)
    const data = await response.json()

    // Additional processing
    return {
      ...data,
      processedAt: new Date().toISOString(),
    }
  })
}

// ============================================================================
// EXAMPLE 3: Form Submission Deduplication
// ============================================================================

/**
 * Pilot creation form with deduplication
 * Prevents duplicate pilot records when user rapidly clicks submit
 */
export function PilotCreateFormExample() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { handleSubmit, isSubmitting } = useDeduplicatedSubmit(
    async (data: { name: string; rank: string }) => {
      const response = await fetch('/api/pilots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create pilot')
      }

      return response.json()
    },
    {
      key: 'pilot-create-form',
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Pilot created successfully',
        })
        queryClient.invalidateQueries({ queryKey: ['pilots'] })
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
      },
    }
  )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        handleSubmit({
          name: formData.get('name') as string,
          rank: formData.get('rank') as string,
        })
      }}
    >
      <input name="name" placeholder="Pilot Name" required />
      <input name="rank" placeholder="Rank" required />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Pilot'}
      </Button>
    </form>
  )
}

// ============================================================================
// EXAMPLE 4: Action Button Deduplication
// ============================================================================

/**
 * Delete button with deduplication
 * Prevents multiple delete requests if user rapidly clicks
 */
export function DeletePilotButton({ pilotId }: { pilotId: string }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { handleAction, isProcessing } = useDeduplicatedAction(
    async () => {
      const response = await fetch(`/api/pilots/${pilotId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete pilot')
      }
    },
    {
      key: `delete-pilot-${pilotId}`,
      onSuccess: () => {
        toast({ title: 'Pilot deleted successfully' })
        queryClient.invalidateQueries({ queryKey: ['pilots'] })
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
      },
    }
  )

  return (
    <Button
      onClick={handleAction}
      disabled={isProcessing}
      variant="destructive"
    >
      {isProcessing ? 'Deleting...' : 'Delete'}
    </Button>
  )
}

// ============================================================================
// EXAMPLE 5: Leave Request Approval with Deduplication
// ============================================================================

/**
 * Approve/Reject buttons for leave requests
 * Prevents duplicate approvals if manager clicks multiple times
 */
export function LeaveRequestActions({ requestId }: { requestId: string }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { handleAction: handleApprove, isProcessing: isApproving } =
    useDeduplicatedAction(
      async () => {
        const response = await fetch(`/api/leave-requests/${requestId}/approve`, {
          method: 'POST',
        })
        if (!response.ok) throw new Error('Approval failed')
      },
      {
        key: `approve-leave-${requestId}`,
        onSuccess: () => {
          toast({ title: 'Leave request approved' })
          queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
        },
      }
    )

  const { handleAction: handleReject, isProcessing: isRejecting } =
    useDeduplicatedAction(
      async () => {
        const response = await fetch(`/api/leave-requests/${requestId}/reject`, {
          method: 'POST',
        })
        if (!response.ok) throw new Error('Rejection failed')
      },
      {
        key: `reject-leave-${requestId}`,
        onSuccess: () => {
          toast({ title: 'Leave request rejected' })
          queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
        },
      }
    )

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleApprove}
        disabled={isApproving || isRejecting}
        variant="default"
      >
        {isApproving ? 'Approving...' : 'Approve'}
      </Button>
      <Button
        onClick={handleReject}
        disabled={isApproving || isRejecting}
        variant="destructive"
      >
        {isRejecting ? 'Rejecting...' : 'Reject'}
      </Button>
    </div>
  )
}

// ============================================================================
// EXAMPLE 6: Mutation with TanStack Query
// ============================================================================

/**
 * Using TanStack Query mutations with automatic deduplication
 * Multiple calls to mutate() will be deduplicated
 */
export function PilotUpdateButton({ pilotId }: { pilotId: string }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationKey: ['update-pilot', pilotId],
    mutationFn: async (data: { is_active: boolean }) => {
      const response = await fetch(`/api/pilots/${pilotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilots'] })
    },
  })

  return (
    <Button
      onClick={() => mutation.mutate({ is_active: false })}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? 'Deactivating...' : 'Deactivate Pilot'}
    </Button>
  )
}

// ============================================================================
// EXAMPLE 7: Monitoring Deduplication
// ============================================================================

/**
 * Component to monitor pending requests (for debugging)
 */
export function RequestMonitor() {
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPendingCount(requestDeduplicator.getPendingCount())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-sm">
      Pending Requests: {pendingCount}
    </div>
  )
}

// ============================================================================
// EXAMPLE 8: Server Action with Deduplication
// ============================================================================

/**
 * Server Action wrapper with deduplication
 */
'use server'

import { createClient } from '@/lib/supabase/server'

export async function updatePilotStatusAction(
  pilotId: string,
  isActive: boolean
) {
  const key = generateRequestKey('UPDATE', `/pilots/${pilotId}`, { isActive })

  return requestDeduplicator.deduplicate(key, async () => {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('pilots')
      .update({ is_active: isActive })
      .eq('id', pilotId)
      .select()
      .single()

    if (error) throw error
    return data
  })
}

/**
 * Component using the deduplicated server action
 */
export function PilotStatusToggle({ pilotId, currentStatus }: {
  pilotId: string
  currentStatus: boolean
}) {
  const { handleAction, isProcessing } = useDeduplicatedAction(
    async () => {
      await updatePilotStatusAction(pilotId, !currentStatus)
    },
    {
      key: `toggle-pilot-status-${pilotId}`,
    }
  )

  return (
    <Button onClick={handleAction} disabled={isProcessing}>
      {isProcessing
        ? 'Updating...'
        : currentStatus
        ? 'Deactivate'
        : 'Activate'}
    </Button>
  )
}

// ============================================================================
// BEST PRACTICES SUMMARY
// ============================================================================

/**
 * 1. USE TANSTACK QUERY FOR DATA FETCHING
 *    - Automatic deduplication built-in
 *    - Use consistent queryKeys
 *    - Let React Query handle caching
 *
 * 2. USE deduplicatedFetch FOR ONE-OFF REQUESTS
 *    - Drop-in replacement for fetch()
 *    - Automatically deduplicates identical requests
 *
 * 3. USE useDeduplicatedSubmit FOR FORMS
 *    - Prevents duplicate form submissions
 *    - Provides loading state
 *    - Handles errors gracefully
 *
 * 4. USE useDeduplicatedAction FOR BUTTONS
 *    - Prevents rapid button clicks
 *    - Simpler API than useDeduplicatedSubmit
 *    - Perfect for delete/approve/reject actions
 *
 * 5. USE requestDeduplicator.deduplicate FOR COMPLEX LOGIC
 *    - Full control over deduplication
 *    - Custom request keys
 *    - Works with any async function
 */

import { useEffect, useState } from 'react'
