/**
 * Request Edit Dialog Component
 * Handles editing pilot request details in a dialog
 *
 * @author Maurice Rondeau
 * @date December 2025
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

// ===================================
// TYPES
// ===================================

interface PilotRequest {
  id: string
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

interface RequestEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: PilotRequest
}

// ===================================
// VALIDATION SCHEMA
// ===================================

const requestEditFormSchema = z
  .object({
    request_type: z.string().min(1, 'Request type is required'),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().optional().nullable(),
    flight_date: z.string().optional().nullable(),
    reason: z.string().max(1000, 'Reason cannot exceed 1000 characters').optional().nullable(),
    notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional().nullable(),
    source_reference: z
      .string()
      .max(500, 'Source reference cannot exceed 500 characters')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        const startDate = new Date(data.start_date)
        const endDate = new Date(data.end_date)
        return endDate >= startDate
      }
      return true
    },
    {
      message: 'End date must be on or after start date',
      path: ['end_date'],
    }
  )

type RequestEditFormData = z.infer<typeof requestEditFormSchema>

// Request type options by category
const REQUEST_TYPE_OPTIONS = {
  LEAVE: [
    { value: 'ANNUAL', label: 'Annual Leave' },
    { value: 'SICK', label: 'Sick Leave' },
    { value: 'LSL', label: 'Long Service Leave' },
    { value: 'LWOP', label: 'Leave Without Pay' },
    { value: 'MATERNITY', label: 'Maternity Leave' },
    { value: 'COMPASSIONATE', label: 'Compassionate Leave' },
  ],
  FLIGHT: [
    { value: 'RDO', label: 'Rostered Day Off' },
    { value: 'SDO', label: 'Substitute Day Off' },
    { value: 'FLIGHT_REQUEST', label: 'Flight Request' },
    { value: 'SCHEDULE_CHANGE', label: 'Schedule Change' },
  ],
  LEAVE_BID: [{ value: 'ANNUAL', label: 'Annual Leave Bid' }],
}

// ===================================
// COMPONENT
// ===================================

export function RequestEditDialog({ open, onOpenChange, request }: RequestEditDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const requestTypeOptions =
    REQUEST_TYPE_OPTIONS[request.request_category as keyof typeof REQUEST_TYPE_OPTIONS] ||
    REQUEST_TYPE_OPTIONS.LEAVE

  const form = useForm<RequestEditFormData>({
    resolver: zodResolver(requestEditFormSchema),
    defaultValues: {
      request_type: request.request_type || '',
      start_date: request.start_date
        ? new Date(request.start_date).toISOString().split('T')[0]
        : '',
      end_date: request.end_date ? new Date(request.end_date).toISOString().split('T')[0] : null,
      flight_date: request.flight_date
        ? new Date(request.flight_date).toISOString().split('T')[0]
        : null,
      reason: request.reason || null,
      notes: request.notes || null,
      source_reference: request.source_reference || null,
    },
  })

  // Reset form when dialog opens or request changes
  useEffect(() => {
    if (open) {
      form.reset({
        request_type: request.request_type || '',
        start_date: request.start_date
          ? new Date(request.start_date).toISOString().split('T')[0]
          : '',
        end_date: request.end_date ? new Date(request.end_date).toISOString().split('T')[0] : null,
        flight_date: request.flight_date
          ? new Date(request.flight_date).toISOString().split('T')[0]
          : null,
        reason: request.reason || null,
        notes: request.notes || null,
        source_reference: request.source_reference || null,
      })
    }
  }, [open, request, form])

  const onSubmit = async (data: RequestEditFormData) => {
    setIsSubmitting(true)

    try {
      // Build payload with only changed fields
      const payload: Record<string, unknown> = {}

      if (data.request_type !== request.request_type) {
        payload.request_type = data.request_type
      }
      if (data.start_date !== request.start_date?.split('T')[0]) {
        payload.start_date = data.start_date
      }
      if (data.end_date !== (request.end_date?.split('T')[0] || null)) {
        payload.end_date = data.end_date || null
      }
      if (data.flight_date !== (request.flight_date?.split('T')[0] || null)) {
        payload.flight_date = data.flight_date || null
      }
      if (data.reason !== request.reason) {
        payload.reason = data.reason || null
      }
      if (data.notes !== request.notes) {
        payload.notes = data.notes || null
      }
      if (data.source_reference !== request.source_reference) {
        payload.source_reference = data.source_reference || null
      }

      // Check if any changes were made
      if (Object.keys(payload).length === 0) {
        toast({
          description: 'No changes were made',
        })
        onOpenChange(false)
        return
      }

      const response = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update request')
      }

      toast({
        description: 'Request updated successfully',
        duration: 5000,
      })

      // Small delay to ensure toast is visible
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Close dialog
      onOpenChange(false)

      // Reset form
      form.reset()

      // Refresh page data
      router.refresh()
    } catch (error) {
      console.error('Error updating request:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update request',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Request</DialogTitle>
          <DialogDescription>
            Update the request details for {request.name} ({request.employee_number})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Request Type */}
            <FormField
              control={form.control}
              name="request_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select request type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {requestTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Fields */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormDescription>Leave blank for single-day requests</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Flight Date (only for FLIGHT category) */}
            {request.request_category === 'FLIGHT' && (
              <FormField
                control={form.control}
                name="flight_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flight Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the reason for this request..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormDescription>Maximum 1000 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes..."
                      className="resize-none"
                      rows={2}
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormDescription>Maximum 2000 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Source Reference */}
            <FormField
              control={form.control}
              name="source_reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Reference (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Email thread ID, phone call reference"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormDescription>Reference to original request source</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
