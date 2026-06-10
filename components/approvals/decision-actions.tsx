'use client'

/**
 * Approvals Hub action row — approve / deny / needs-info + keyboard review.
 *
 * Keyboard: ↑/↓ move through the queue, A approve (confirm), D deny (comment
 * dialog), N needs-info. After a decision the selection advances to the next
 * queued item automatically.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts'
import {
  approveRequestAction,
  denyRequestAction,
  needsInfoRequestAction,
} from '@/app/dashboard/approvals/actions'

interface DecisionActionsProps {
  requestId: string
  orderedIds: string[]
  tab: string
  /** True when the eligibility engine says approval would breach minimums. */
  blocked: boolean
}

export function DecisionActions({ requestId, orderedIds, tab, blocked }: DecisionActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [denyOpen, setDenyOpen] = useState(false)
  const [denyComment, setDenyComment] = useState('')
  const { confirm, ConfirmDialog: ApproveConfirmDialog } = useConfirm()

  const index = orderedIds.indexOf(requestId)
  const position = index >= 0 ? `${index + 1} of ${orderedIds.length}` : ''

  const goTo = (id: string | undefined) => {
    if (id) {
      router.replace(`/dashboard/approvals?tab=${tab}&sel=${id}`, { scroll: false })
    } else {
      router.replace(`/dashboard/approvals?tab=${tab}`, { scroll: false })
    }
  }

  const advanceAfterDecision = () => {
    const remaining = orderedIds.filter((id) => id !== requestId)
    goTo(remaining[Math.min(index, remaining.length - 1)])
    router.refresh()
  }

  const runDecision = (
    action: () => Promise<{ success: boolean; error?: string }>,
    successMessage: string
  ) => {
    startTransition(async () => {
      const result = await action()
      if (result.success) {
        toast.success(successMessage)
        advanceAfterDecision()
      } else {
        toast.error(result.error || 'Action failed')
        router.refresh()
      }
    })
  }

  const handleApprove = async () => {
    const confirmed = await confirm({
      title: blocked ? 'Approve despite crew shortage?' : 'Approve request?',
      description: blocked
        ? 'The eligibility engine reports this approval would breach minimum crew levels. The service will re-check atomically and may still reject it.'
        : 'The pilot will be notified of the approval.',
      confirmText: 'Approve',
      variant: blocked ? 'destructive' : 'default',
    })
    if (confirmed) {
      runDecision(() => approveRequestAction(requestId), 'Request approved')
    }
  }

  const submitDeny = () => {
    setDenyOpen(false)
    runDecision(() => denyRequestAction(requestId, denyComment.trim()), 'Request denied')
    setDenyComment('')
  }

  const handleNeedsInfo = () => {
    runDecision(() => needsInfoRequestAction(requestId), 'Marked as in review')
  }

  useKeyboardShortcuts([
    { key: 'ArrowDown', action: () => goTo(orderedIds[index + 1]), ignoreInputs: true },
    { key: 'ArrowUp', action: () => goTo(orderedIds[index - 1]), ignoreInputs: true },
    { key: 'a', action: () => void handleApprove(), ignoreInputs: true },
    { key: 'd', action: () => setDenyOpen(true), ignoreInputs: true },
    { key: 'n', action: handleNeedsInfo, ignoreInputs: true },
  ])

  return (
    <div className="border-border flex items-center gap-2 border-t-2 px-5 py-3.5">
      <Button variant="primary" size="sm" onClick={handleApprove} loading={isPending}>
        Approve
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive"
        onClick={() => setDenyOpen(true)}
        disabled={isPending}
      >
        Deny…
      </Button>
      <Button variant="outline" size="sm" onClick={handleNeedsInfo} disabled={isPending}>
        Needs info
      </Button>
      <span className="text-muted-foreground ml-auto text-xs">
        {position} · ↑↓ move · A approve · D deny · N needs info
      </span>

      <Dialog open={denyOpen} onOpenChange={setDenyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny request</DialogTitle>
            <DialogDescription>
              The comment below is sent to the pilot with the denial.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={denyComment}
            onChange={(e) => setDenyComment(e.target.value)}
            placeholder="Reason for denial (visible to the pilot)"
            rows={3}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDenyOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={submitDeny} loading={isPending}>
              Deny request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ApproveConfirmDialog />
    </div>
  )
}
