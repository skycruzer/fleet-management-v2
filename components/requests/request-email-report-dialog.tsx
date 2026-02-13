/**
 * Request Email Report Dialog Component
 *
 * Provides a form to email filtered pilot request reports to recipients.
 * Follows the pattern from roster-email-report-dialog.tsx.
 *
 * @author Maurice Rondeau
 * @date February 2026
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Mail, Plus, X, ChevronDown, ChevronRight } from 'lucide-react'
import type { PilotRequest } from './requests-table'

// ============================================================================
// Constants
// ============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DEFAULT_MESSAGE = `Hi Team.

These are the only requests for your review and planning.

Let me know if there are no coverage issues for approval.

Regards,`

// ============================================================================
// Validation Schema
// ============================================================================

const EmailFormSchema = z.object({
  subject: z.string().optional(),
  message: z.string().optional(),
})

type EmailFormData = z.input<typeof EmailFormSchema>

// ============================================================================
// Component
// ============================================================================

interface RequestEmailReportDialogProps {
  requests: PilotRequest[]
  filterSummary?: string
  isOpen: boolean
  onClose: () => void
}

export function RequestEmailReportDialog({
  requests,
  filterSummary,
  isOpen,
  onClose,
}: RequestEmailReportDialogProps) {
  const { csrfToken } = useCsrfToken()
  const [isSending, setIsSending] = useState(false)
  const [recipients, setRecipients] = useState<string[]>([])
  const [ccRecipients, setCcRecipients] = useState<string[]>([])
  const [bccRecipients, setBccRecipients] = useState<string[]>([])
  const [currentEmail, setCurrentEmail] = useState('')
  const [currentCcEmail, setCurrentCcEmail] = useState('')
  const [currentBccEmail, setCurrentBccEmail] = useState('')
  const [showCcBcc, setShowCcBcc] = useState(false)
  const { toast } = useToast()

  const { register, handleSubmit, reset } = useForm<EmailFormData>({
    resolver: zodResolver(EmailFormSchema),
    defaultValues: {
      subject: `Pilot Requests Report${filterSummary ? ` — ${filterSummary}` : ''}`,
      message: DEFAULT_MESSAGE,
    },
  })

  // ============================================================================
  // Recipient Handlers
  // ============================================================================

  function addEmails(
    input: string,
    existing: string[],
    setter: (emails: string[]) => void,
    inputSetter: (val: string) => void,
    maxCount?: number
  ) {
    const emails = input
      .split(/[,;]/)
      .map((e) => e.trim())
      .filter(Boolean)

    if (emails.length === 0) return

    const newEmails: string[] = []

    for (const email of emails) {
      if (!EMAIL_REGEX.test(email)) {
        toast({
          variant: 'destructive',
          title: 'Invalid Email',
          description: `"${email}" is not a valid email address`,
        })
        continue
      }

      if (existing.includes(email) || newEmails.includes(email)) continue

      if (maxCount && existing.length + newEmails.length >= maxCount) {
        toast({
          variant: 'destructive',
          title: 'Limit Reached',
          description: `Maximum ${maxCount} recipients allowed`,
        })
        break
      }

      newEmails.push(email)
    }

    if (newEmails.length > 0) {
      setter([...existing, ...newEmails])
    }
    inputSetter('')
  }

  function handleAddRecipient() {
    addEmails(currentEmail, recipients, setRecipients, setCurrentEmail)
  }

  function handleAddCcRecipient() {
    addEmails(currentCcEmail, ccRecipients, setCcRecipients, setCurrentCcEmail, 10)
  }

  function handleAddBccRecipient() {
    addEmails(currentBccEmail, bccRecipients, setBccRecipients, setCurrentBccEmail, 10)
  }

  // ============================================================================
  // Submit Handler
  // ============================================================================

  async function onSubmit(data: EmailFormData) {
    if (recipients.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Recipients',
        description: 'Please add at least one recipient email address',
      })
      return
    }

    setIsSending(true)

    try {
      const response = await fetch('/api/requests/email-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        body: JSON.stringify({
          recipients,
          cc: ccRecipients.length > 0 ? ccRecipients : undefined,
          bcc: bccRecipients.length > 0 ? bccRecipients : undefined,
          subject: data.subject,
          message: data.message,
          requests: requests.map((r) => ({
            name: r.name,
            rank: r.rank,
            request_category: r.request_category,
            request_type: r.request_type,
            start_date: r.start_date,
            end_date: r.end_date,
            days_count: r.days_count,
            roster_period: r.roster_period,
            workflow_status: r.workflow_status,
          })),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send email')
      }

      toast({
        title: 'Email Sent Successfully',
        description: `Report emailed to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`,
      })

      reset()
      setRecipients([])
      setCcRecipients([])
      setBccRecipients([])
      setShowCcBcc(false)
      onClose()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Email Error',
        description: error.message || 'Failed to send email',
      })
    } finally {
      setIsSending(false)
    }
  }

  // ============================================================================
  // Email Chip Renderer
  // ============================================================================

  function renderEmailChips(
    emails: string[],
    onRemove: (email: string) => void,
    compact?: boolean
  ) {
    if (emails.length === 0) return null
    return (
      <div className={`${compact ? 'mt-2 space-y-1' : 'mt-3 space-y-2'}`}>
        {emails.map((email) => (
          <div
            key={email}
            className={`bg-muted flex items-center justify-between rounded-md border ${compact ? 'px-3 py-1.5' : 'px-3 py-2'}`}
          >
            <span className="text-sm">{email}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(email)}
              className={compact ? 'h-6 w-6 p-0' : undefined}
            >
              <X className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
            </Button>
          </div>
        ))}
      </div>
    )
  }

  // ============================================================================
  // Email Input Renderer
  // ============================================================================

  function renderEmailInput(
    id: string,
    placeholder: string,
    value: string,
    onChange: (val: string) => void,
    onAdd: () => void
  ) {
    return (
      <div className="mt-2 flex gap-2">
        <Input
          id={id}
          type="email"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onAdd()
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={onAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Email Requests Report</DialogTitle>
          <DialogDescription>
            Send {requests.length} filtered request{requests.length !== 1 ? 's' : ''} via email
            {filterSummary && (
              <span className="mt-1 block text-xs">Filters: {filterSummary}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Recipients */}
          <div>
            <Label htmlFor="recipient-input">Recipients</Label>
            {renderEmailInput(
              'recipient-input',
              'email@example.com',
              currentEmail,
              setCurrentEmail,
              handleAddRecipient
            )}
            {renderEmailChips(recipients, (email) =>
              setRecipients(recipients.filter((r) => r !== email))
            )}
          </div>

          {/* CC/BCC Collapsible */}
          <Collapsible open={showCcBcc} onOpenChange={setShowCcBcc}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground -ml-2 flex items-center gap-1"
              >
                {showCcBcc ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Add CC/BCC
                {(ccRecipients.length > 0 || bccRecipients.length > 0) && (
                  <span className="text-muted-foreground ml-1 text-xs">
                    ({ccRecipients.length + bccRecipients.length})
                  </span>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              {/* CC */}
              <div>
                <Label htmlFor="cc-input">CC</Label>
                {renderEmailInput(
                  'cc-input',
                  'cc@example.com',
                  currentCcEmail,
                  setCurrentCcEmail,
                  handleAddCcRecipient
                )}
                {renderEmailChips(
                  ccRecipients,
                  (email) => setCcRecipients(ccRecipients.filter((r) => r !== email)),
                  true
                )}
              </div>

              {/* BCC */}
              <div>
                <Label htmlFor="bcc-input">BCC</Label>
                {renderEmailInput(
                  'bcc-input',
                  'bcc@example.com',
                  currentBccEmail,
                  setCurrentBccEmail,
                  handleAddBccRecipient
                )}
                {renderEmailChips(
                  bccRecipients,
                  (email) => setBccRecipients(bccRecipients.filter((r) => r !== email)),
                  true
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" {...register('subject')} placeholder="Email subject" className="mt-2" />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              {...register('message')}
              placeholder="Add a custom message..."
              rows={5}
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSending || recipients.length === 0}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
