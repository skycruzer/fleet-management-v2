/**
 * Requests Table Client Component
 *
 * Client component that wraps RequestsTable and provides action handlers
 * for CRUD operations (update status, delete, bulk actions).
 * Includes force-approve dialog for crew shortage overrides.
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle } from 'lucide-react'
import { csrfHeaders } from '@/lib/hooks/use-csrf-token'

interface RequestsTableClientProps {
  requests: PilotRequest[]
}

export function RequestsTableClient({ requests }: RequestsTableClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Force-approve override state
  const [forceApproveDialogOpen, setForceApproveDialogOpen] = useState(false)
  const [crewShortageMessage, setCrewShortageMessage] = useState('')
  const [pendingApprovalId, setPendingApprovalId] = useState<string | null>(null)
  const [pendingApprovalComments, setPendingApprovalComments] = useState<string | undefined>()

  // ============================================================================
  // Action Handlers
  // ============================================================================

  const handleUpdateStatus = async (
    requestId: string,
    status: PilotRequest['workflow_status'],
    comments?: string,
    force?: boolean
  ) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify({ status, comments, ...(force && { force: true }) }),
      })

      if (!response.ok) {
        const error = await response.json()
        const errorMessage = error.error || 'Failed to update status'

        // If crew shortage on approve, show force-approve dialog
        if (
          !force &&
          status === 'APPROVED' &&
          typeof errorMessage === 'string' &&
          errorMessage.startsWith('Cannot approve:')
        ) {
          setCrewShortageMessage(errorMessage)
          setPendingApprovalId(requestId)
          setPendingApprovalComments(comments)
          setForceApproveDialogOpen(true)
          setLoading(false)
          return
        }

        throw new Error(errorMessage)
      }

      setForceApproveDialogOpen(false)
      setCrewShortageMessage('')
      setPendingApprovalId(null)

      toast({
        title: 'Status Updated',
        description: force
          ? 'Request force-approved despite crew shortage'
          : `Request status changed to ${status}`,
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

  const handleForceApprove = async () => {
    if (pendingApprovalId) {
      await handleUpdateStatus(pendingApprovalId, 'APPROVED', pendingApprovalComments, true)
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'DELETE',
        headers: { ...csrfHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
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

      {/* Force Approve Override Dialog */}
      <AlertDialog
        open={forceApproveDialogOpen}
        onOpenChange={(open) => {
          setForceApproveDialogOpen(open)
          if (!open) {
            setCrewShortageMessage('')
            setPendingApprovalId(null)
            setPendingApprovalComments(undefined)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--color-warning-500)]" />
              Crew Shortage Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {crewShortageMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md border border-[var(--color-warning-500)]/30 bg-[var(--color-warning-muted)] p-3 text-sm text-[var(--color-warning-600)]">
            Approving this request will reduce crew below the minimum threshold. This action will be
            logged for audit purposes.
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceApprove}
              className="bg-[var(--color-warning-500)] text-white hover:bg-[var(--color-warning-600)]"
            >
              Override &amp; Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
