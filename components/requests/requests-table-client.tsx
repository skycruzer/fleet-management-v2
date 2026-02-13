/**
 * Requests Table Client Component
 *
 * Client component that wraps RequestsTable and provides action handlers
 * for CRUD operations (update status, delete, bulk actions).
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RequestsTable, type PilotRequest } from './requests-table'
import { RequestExportToolbar } from './request-export-toolbar'
import { useToast } from '@/hooks/use-toast'

interface RequestsTableClientProps {
  requests: PilotRequest[]
}

export function RequestsTableClient({ requests }: RequestsTableClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // ============================================================================
  // Action Handlers
  // ============================================================================

  const handleUpdateStatus = async (
    requestId: string,
    status: PilotRequest['workflow_status'],
    comments?: string
  ) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comments }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update status')
      }

      toast({
        title: 'Status Updated',
        description: `Request status changed to ${status}`,
      })

      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete request')
      }

      toast({
        title: 'Request Deleted',
        description: 'The request has been successfully deleted',
      })

      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete request',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAction = async (requestIds: string[], action: 'approve' | 'deny' | 'delete') => {
    setLoading(true)
    try {
      const response = await fetch('/api/requests/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_ids: requestIds, action }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to perform bulk action')
      }

      const result = await response.json()

      toast({
        title: 'Bulk Action Complete',
        description: `${action === 'delete' ? 'Deleted' : action === 'approve' ? 'Approved' : 'Denied'} ${result.affected_count} request(s)`,
      })

      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to perform bulk action',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewRequest = (request: PilotRequest) => {
    // Navigate to request detail page
    router.push(`/dashboard/requests/${request.id}`)
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-4">
      <RequestExportToolbar requests={requests} />
      <RequestsTable
        requests={requests}
        loading={loading}
        onViewRequest={handleViewRequest}
        onUpdateStatus={handleUpdateStatus}
        onDeleteRequest={handleDeleteRequest}
        onBulkAction={handleBulkAction}
        enableSelection={true}
      />
    </div>
  )
}
