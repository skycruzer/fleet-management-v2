/**
 * Report Email Dialog Component
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Modal dialog for emailing reports to recipients
 * Phase 5.1: Added CC and BCC support
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
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Mail, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import type { ReportType, ReportFilters } from '@/types/reports'

const formSchema = z.object({
  recipients: z.string().min(1, 'At least one recipient is required'),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
})

interface ReportEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportType: ReportType
  filters: ReportFilters
}

export function ReportEmailDialog({
  open,
  onOpenChange,
  reportType,
  filters,
}: ReportEmailDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCcBcc, setShowCcBcc] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipients: '',
      cc: '',
      bcc: '',
      subject: '',
      message: '',
    },
  })

  const onSubmit = async (values: z.input<typeof formSchema>) => {
    setIsLoading(true)
    try {
      // Split by comma or semicolon to support both formats (Outlook uses semicolons)
      const recipients = values.recipients
        .split(/[,;]/)
        .map((email) => email.trim())
        .filter(Boolean)
      const cc = values.cc
        ? values.cc
            .split(/[,;]/)
            .map((email) => email.trim())
            .filter(Boolean)
        : undefined
      const bcc = values.bcc
        ? values.bcc
            .split(/[,;]/)
            .map((email) => email.trim())
            .filter(Boolean)
        : undefined

      const response = await fetch('/api/reports/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          filters,
          recipients,
          cc: cc?.length ? cc : undefined,
          bcc: bcc?.length ? bcc : undefined,
          subject: values.subject,
          message: values.message,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: 'Email Sent',
        description: `Report has been emailed to ${recipients.length} recipient(s)`,
      })

      onOpenChange(false)
      form.reset()
    } catch (error) {
      toast({
        title: 'Email Failed',
        description: error instanceof Error ? error.message : 'Failed to send email',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Report
          </DialogTitle>
          <DialogDescription>Send this report as a PDF attachment via email</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com, another@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter one or more email addresses separated by commas or semicolons
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CC/BCC Collapsible Section */}
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
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="cc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CC</FormLabel>
                      <FormControl>
                        <Input placeholder="cc@example.com, another@example.com" {...field} />
                      </FormControl>
                      <FormDescription>Carbon copy recipients (visible to all)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bcc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>BCC</FormLabel>
                      <FormControl>
                        <Input placeholder="bcc@example.com, another@example.com" {...field} />
                      </FormControl>
                      <FormDescription>Blind carbon copy recipients (hidden)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Auto-generated if left blank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a custom message to include in the email..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A default message will be included if left blank
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
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
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
