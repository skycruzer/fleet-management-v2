/**
 * Delete Account Dialog Component
 * Dialog for account deletion with safety checks and confirmation
 */

'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '../../lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'

interface DeleteAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
}

export function DeleteAccountDialog({ open, onOpenChange, userEmail }: DeleteAccountDialogProps) {
  const { csrfToken } = useCsrfToken()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [acknowledgeWarnings, setAcknowledgeWarnings] = useState({
    permanent: false,
    dataLoss: false,
    noRecovery: false,
  })
  const supabase = createClient()
  const router = useRouter()

  const allWarningsAcknowledged =
    acknowledgeWarnings.permanent && acknowledgeWarnings.dataLoss && acknowledgeWarnings.noRecovery

  const confirmationMatch = confirmText === 'DELETE MY ACCOUNT'

  const handleDelete = async () => {
    if (!allWarningsAcknowledged || !confirmationMatch) {
      toast.error('Please acknowledge all warnings and confirm deletion')
      return
    }

    setIsDeleting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Not authenticated')
        return
      }

      // Call delete account API endpoint
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete account')
      }

      // Sign out after successful deletion
      await supabase.auth.signOut()

      toast.success('Account deleted successfully')

      // Redirect to home page
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete account. Please contact support.'
      )
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[600px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-red-900">Delete Account</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4 pt-4">
            <p className="font-semibold text-red-900">
              This action is permanent and cannot be undone!
            </p>
            <p>When you delete your account, the following will happen:</p>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li>All your personal information will be permanently deleted</li>
              <li>Your certification records will be anonymized but retained for compliance</li>
              <li>Your leave request history will be removed</li>
              <li>You will lose access to all pilot portal features</li>
              <li>Any active sessions will be terminated immediately</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6 py-4">
          {/* Warning Acknowledgements */}
          <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">
              Please acknowledge the following warnings:
            </p>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="permanent"
                  checked={acknowledgeWarnings.permanent}
                  onCheckedChange={(checked) =>
                    setAcknowledgeWarnings((prev) => ({ ...prev, permanent: checked as boolean }))
                  }
                />
                <Label
                  htmlFor="permanent"
                  className="cursor-pointer text-sm font-normal leading-tight text-red-900"
                >
                  I understand this action is permanent and cannot be reversed
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="dataLoss"
                  checked={acknowledgeWarnings.dataLoss}
                  onCheckedChange={(checked) =>
                    setAcknowledgeWarnings((prev) => ({ ...prev, dataLoss: checked as boolean }))
                  }
                />
                <Label
                  htmlFor="dataLoss"
                  className="cursor-pointer text-sm font-normal leading-tight text-red-900"
                >
                  I understand all my data will be permanently deleted
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="noRecovery"
                  checked={acknowledgeWarnings.noRecovery}
                  onCheckedChange={(checked) =>
                    setAcknowledgeWarnings((prev) => ({ ...prev, noRecovery: checked as boolean }))
                  }
                />
                <Label
                  htmlFor="noRecovery"
                  className="cursor-pointer text-sm font-normal leading-tight text-red-900"
                >
                  I understand there is no way to recover my account after deletion
                </Label>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirm-delete" className="text-sm font-semibold">
              Type <span className="font-mono font-bold">DELETE MY ACCOUNT</span> to confirm:
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="font-mono"
              disabled={!allWarningsAcknowledged}
            />
            {confirmText && !confirmationMatch && (
              <p className="text-xs text-red-600">Text must match exactly (case-sensitive)</p>
            )}
          </div>

          {/* User Email Confirmation */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-600">Account being deleted:</p>
            <p className="font-mono text-sm font-semibold">{userEmail}</p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!allWarningsAcknowledged || !confirmationMatch || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting Account...
              </>
            ) : (
              'Delete Account Permanently'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
