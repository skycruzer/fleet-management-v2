/**
 * Email Report Dialog Component
 *
 * Provides a form to email roster period reports to recipients
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Mail, Plus, X } from 'lucide-react'
import type { RosterPeriodReport } from '@/lib/services/roster-report-service'

// ============================================================================
// Validation Schema
// ============================================================================

const EmailFormSchema = z.object({
  recipients: z.array(z.string().email()).min(1, 'At least one recipient required'),
  subject: z.string().optional(),
  message: z.string().optional(),
  includeDenied: z.boolean().default(true),
  includeAvailability: z.boolean().default(true),
})

// Use z.input for form types (before defaults are applied)
type EmailFormData = z.input<typeof EmailFormSchema>

// ============================================================================
// Component
// ============================================================================

interface RosterEmailReportDialogProps {
  report: RosterPeriodReport
  rosterPeriod: string
  isOpen: boolean
  onClose: () => void
}

export function RosterEmailReportDialog({
  report,
  rosterPeriod,
  isOpen,
  onClose,
}: RosterEmailReportDialogProps) {
  const [isSending, setIsSending] = useState(false)
  const [recipients, setRecipients] = useState<string[]>([])
  const [currentEmail, setCurrentEmail] = useState('')
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmailFormData>({
    resolver: zodResolver(EmailFormSchema),
    defaultValues: {
      recipients: [],
      subject: `Roster Period Report - ${rosterPeriod} (${report.metadata.reportType})`,
      message: '',
      includeDenied: true,
      includeAvailability: true,
    },
  })

  /**
   * Add recipient email
   */
  function handleAddRecipient() {
    const email = currentEmail.trim()

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
      })
      return
    }

    if (recipients.includes(email)) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Email',
        description: 'This email is already in the recipient list',
      })
      return
    }

    setRecipients([...recipients, email])
    setCurrentEmail('')
  }

  /**
   * Remove recipient email
   */
  function handleRemoveRecipient(email: string) {
    setRecipients(recipients.filter((r) => r !== email))
  }

  /**
   * Send email
   */
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
      const response = await fetch(`/api/roster-reports/${rosterPeriod}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients,
          subject: data.subject,
          message: data.message,
          reportType: report.metadata.reportType,
          includeOptions: {
            includeDenied: data.includeDenied,
            includeAvailability: data.includeAvailability,
          },
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

      // Reset form and close dialog
      reset()
      setRecipients([])
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Email Roster Report</DialogTitle>
          <DialogDescription>
            Send the {report.metadata.reportType.toLowerCase()} report for {rosterPeriod} via email
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Recipients */}
          <div>
            <Label htmlFor="recipient-input">Recipients</Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="recipient-input"
                type="email"
                placeholder="email@example.com"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddRecipient()
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddRecipient}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {recipients.length > 0 && (
              <div className="mt-3 space-y-2">
                {recipients.map((email) => (
                  <div
                    key={email}
                    className="bg-muted flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span className="text-sm">{email}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRecipient(email)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {errors.recipients && (
              <p className="mt-1 text-sm text-red-600">{errors.recipients.message}</p>
            )}
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              {...register('subject')}
              placeholder="Email subject"
              className="mt-2"
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              {...register('message')}
              placeholder="Add a custom message to the email..."
              rows={3}
              className="mt-2"
            />
          </div>

          {/* Include Options */}
          <div className="space-y-3 rounded-lg border p-4">
            <Label>Include in Report</Label>

            <div className="flex items-center space-x-2">
              <Checkbox id="includeDenied" {...register('includeDenied')} defaultChecked />
              <label
                htmlFor="includeDenied"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Denied Requests
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeAvailability"
                {...register('includeAvailability')}
                defaultChecked
              />
              <label
                htmlFor="includeAvailability"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Crew Availability Analysis
              </label>
            </div>
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
