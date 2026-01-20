/**
 * Request Detail Actions Component
 *
 * Provides action buttons for managing a single request (Approve, Deny, Edit, Delete)
 * from the request detail page.
 *
 * @author Maurice Rondeau
 * @date November 20, 2025
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
import { CheckCircle, XCircle, Trash2, Pencil } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { RequestEditDialog } from './request-edit-dialog'

interface RequestDetailActionsProps {
  request: {
    id: string
    workflow_status: string
    request_category: string
    request_type: string
    start_date: string
    end_date: string | null
    flight_date: string | null
    reason: string | null
    notes: string | null
    source_reference: string | null
    name: string
    employee_number: string
  }
}

export function RequestDetailActions({ request }: RequestDetailActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const canApprove = request.workflow_status !== 'APPROVED' && request.workflow_status !== 'DENIED'
  const canDeny = request.workflow_status !== 'APPROVED' && request.workflow_status !== 'DENIED'
  const canEdit = request.workflow_status !== 'APPROVED' && request.workflow_status !== 'DENIED'

  const handleApprove = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/requests/${request.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve request')
      }

      toast({
        title: 'Request Approved',
        description: 'The request has been successfully approved',
      })

      // Refresh the page to show updated status
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve request',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeny = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/requests/${request.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DENIED' }),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to deny request')
      }

      toast({
        title: 'Request Denied',
        description: 'The request has been successfully denied',
      })

      // Refresh the page to show updated status
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to deny request',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/requests/${request.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete request')
      }

      toast({
        title: 'Request Deleted',
        description: 'The request has been successfully deleted',
      })

      // Navigate back to requests list
      router.push('/dashboard/requests')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete request',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        {canApprove && (
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="bg-[var(--color-status-low)] hover:bg-[var(--color-status-low)]/90"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve
          </Button>
        )}
        {canDeny && (
          <Button
            onClick={handleDeny}
            disabled={loading}
            variant="secondary"
            className="bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)] hover:bg-[var(--color-status-medium-bg)]/80"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Deny
          </Button>
        )}
        {canEdit && (
          <Button onClick={() => setEditDialogOpen(true)} disabled={loading} variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
        <Button onClick={() => setDeleteDialogOpen(true)} disabled={loading} variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      {/* Edit Request Dialog */}
      <RequestEditDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} request={request} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-[var(--color-status-high)] hover:bg-[var(--color-status-high)]/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
