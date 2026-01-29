/**
 * Report Email Dialog Component
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Modal dialog for emailing reports to recipients
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
import { Mail, Loader2 } from 'lucide-react'
import type { ReportType, ReportFilters } from '@/types/reports'

const formSchema = z.object({
  recipients: z.string().min(1, 'At least one recipient is required'),
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
  const { toast } = useToast()

  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipients: '',
      subject: '',
      message: '',
    },
  })

  const onSubmit = async (values: z.input<typeof formSchema>) => {
    setIsLoading(true)
    try {
      const recipients = values.recipients.split(',').map((email) => email.trim())

      const response = await fetch('/api/reports/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          filters,
          recipients,
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
                  <FormLabel>Recipients</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com, another@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter one or more email addresses separated by commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
