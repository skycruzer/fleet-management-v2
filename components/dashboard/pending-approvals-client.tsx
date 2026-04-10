/**
 * Pending Approvals Client Component
 * Developer: Maurice Rondeau
 *
 * Interactive client component for the PendingApprovalsWidget.
 * Handles approve/deny actions via PATCH /api/requests/[id].
 */

'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { csrfHeaders } from '@/lib/hooks/use-csrf-token'

interface PendingRequest {
  id: string
  pilotName: string
  rank: string
  requestType: string
  requestCategory: string
  startDate: string
  endDate: string | null
  daysCount: number | null
}

function getTypeBadgeVariant(category: string): 'default' | 'warning' | 'secondary' {
  if (category === 'LEAVE') return 'warning'
  if (category === 'FLIGHT') return 'default'
  return 'secondary'
}

function formatRequestType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function PendingApprovalsClient({ requests }: { requests: PendingRequest[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  async function handleApprove(requestId: string, pilotName: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/requests/${requestId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
          body: JSON.stringify({ status: 'APPROVED' }),
        })

        if (res.ok) {
          toast({
            title: 'Request approved',
            description: `${pilotName}'s request has been approved.`,
          })
          router.refresh()
        } else {
          const data = await res.json().catch(() => ({}))
          toast({
            title: 'Approval failed',
            description: data.error || 'Please try again.',
            variant: 'destructive',
          })
        }
      } catch {
        toast({
          title: 'Network error',
          description: 'Could not reach the server. Please try again.',
          variant: 'destructive',
        })
      }
    })
  }

  function handleDeny(requestId: string) {
    // Deny requires comments — redirect to the full request detail page
    router.push(`/dashboard/requests/${requestId}`)
  }

  return (
    <div className="divide-border space-y-0 divide-y">
      {requests.map((req) => (
        <div key={req.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-medium">{req.pilotName}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge variant={getTypeBadgeVariant(req.requestCategory)}>
                {formatRequestType(req.requestType)}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {format(new Date(req.startDate), 'MMM d')}
                {req.endDate && ` – ${format(new Date(req.endDate), 'MMM d')}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-success hover:bg-success/10 hover:text-success"
              onClick={() => handleApprove(req.id, req.pilotName)}
              disabled={isPending}
              aria-label={`Approve ${req.pilotName}'s request`}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => handleDeny(req.id)}
              aria-label={`Review and deny ${req.pilotName}'s request`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
