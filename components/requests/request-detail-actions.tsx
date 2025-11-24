/**
 * Request Detail Actions Component
 *
 * Provides action buttons for managing a single request (Approve, Deny, Delete)
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
import { CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface RequestDetailActionsProps {
  request: {
    id: string
    workflow_status: string
    request_category: string
  }
}

export function RequestDetailActions({ request }: RequestDetailActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const canApprove =
    request.workflow_status !== 'APPROVED' && request.workflow_status !== 'DENIED'
  const canDeny = request.workflow_status !== 'APPROVED' && request.workflow_status !== 'DENIED'

  const handleApprove = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/requests/${request.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
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
          <Button onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        )}
        {canDeny && (
          <Button
            onClick={handleDeny}
            disabled={loading}
            variant="secondary"
            className="bg-yellow-100 text-yellow-900 hover:bg-yellow-200"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Deny
          </Button>
        )}
        <Button
          onClick={() => setDeleteDialogOpen(true)}
          disabled={loading}
          variant="destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

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
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
