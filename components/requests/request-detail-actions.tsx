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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  const [denyDialogOpen, setDenyDialogOpen] = useState(false)
  const [denyComments, setDenyComments] = useState('')
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
    if (!denyComments.trim()) {
      toast({
        title: 'Comments Required',
        description: 'Please provide a reason for denying this request',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/requests/${request.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DENIED', comments: denyComments.trim() }),
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

      setDenyDialogOpen(false)
      setDenyComments('')

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
            onClick={() => setDenyDialogOpen(true)}
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

      {/* Deny Confirmation Dialog */}
      <AlertDialog
        open={denyDialogOpen}
        onOpenChange={(open) => {
          setDenyDialogOpen(open)
          if (!open) setDenyComments('')
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deny Request</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for denying this request. This will be visible to the pilot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="deny-comments" className="text-sm font-medium">
              Reason for Denial
            </Label>
            <Textarea
              id="deny-comments"
              placeholder="Enter the reason for denying this request..."
              value={denyComments}
              onChange={(e) => setDenyComments(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeny}
              disabled={!denyComments.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deny Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
