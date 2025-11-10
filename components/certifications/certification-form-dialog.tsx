/**
 * Certification Form Dialog Component
 * Handles create and edit certification operations in a dialog
 *
 * @version 1.0.0
 * @created 2025-10-28 - Phase 5 P1
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
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

interface Pilot {
  id: string
  first_name: string
  last_name: string
  employee_number: string
}

interface CheckType {
  id: string
  check_type: string
  description: string | null
}

interface Certification {
  id: string
  pilot_id: string
  check_type_id: string
  completion_date: string | null
  expiry_date: string | null
  notes: string | null
}

interface CertificationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  certification?: Certification
  pilots: Pilot[]
  checkTypes: CheckType[]
  mode: 'create' | 'edit'
}

// ===================================
// VALIDATION SCHEMA
// ===================================

const certificationFormSchema = z
  .object({
    pilot_id: z.string().uuid('Must select a pilot'),
    check_type_id: z.string().uuid('Must select a check type'),
    completion_date: z.string().min(1, 'Check date is required'),
    expiry_date: z.string().min(1, 'Expiry date is required'),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  })
  .refine(
    (data) => {
      if (data.completion_date && data.expiry_date) {
        const checkDate = new Date(data.completion_date)
        const expiryDate = new Date(data.expiry_date)
        return expiryDate > checkDate
      }
      return true
    },
    {
      message: 'Expiry date must be after check date',
      path: ['expiry_date'],
    }
  )

type CertificationFormData = z.infer<typeof certificationFormSchema>

// ===================================
// COMPONENT
// ===================================

export function CertificationFormDialog({
  open,
  onOpenChange,
  certification,
  pilots,
  checkTypes,
  mode,
}: CertificationFormDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { csrfToken } = useCsrfToken()

  const form = useForm<CertificationFormData>({
    resolver: zodResolver(certificationFormSchema),
    defaultValues: {
      pilot_id: certification?.pilot_id || '',
      check_type_id: certification?.check_type_id || '',
      completion_date: certification?.completion_date
        ? new Date(certification.completion_date).toISOString().split('T')[0]
        : '',
      expiry_date: certification?.expiry_date
        ? new Date(certification.expiry_date).toISOString().split('T')[0]
        : '',
      notes: certification?.notes || '',
    },
  })

  // Reset form when dialog opens/closes or certification changes
  useEffect(() => {
    if (open) {
      form.reset({
        pilot_id: certification?.pilot_id || '',
        check_type_id: certification?.check_type_id || '',
        completion_date: certification?.completion_date
          ? new Date(certification.completion_date).toISOString().split('T')[0]
          : '',
        expiry_date: certification?.expiry_date
          ? new Date(certification.expiry_date).toISOString().split('T')[0]
          : '',
        notes: certification?.notes || '',
      })
    }
  }, [open, certification, form])

  const onSubmit = async (data: CertificationFormData) => {
    // Additional validation check before submission
    const checkDate = new Date(data.completion_date)
    const expiryDate = new Date(data.expiry_date)

    if (expiryDate <= checkDate) {
      form.setError('expiry_date', {
        type: 'manual',
        message: 'Expiry date must be after check date',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Convert dates to ISO datetime format for API
      const payload = {
        pilot_id: data.pilot_id,
        check_type_id: data.check_type_id,
        completion_date: new Date(data.completion_date).toISOString(),
        expiry_date: new Date(data.expiry_date).toISOString(),
        notes: data.notes || null,
        expiry_roster_period: null, // Will be calculated by backend
      }

      const url =
        mode === 'create'
          ? '/api/certifications'
          : `/api/certifications/${certification!.id}`

      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${mode} certification`)
      }

      // Show success message immediately
      toast({
        description: `Certification ${mode === 'create' ? 'created' : 'updated'} successfully`,
        duration: 10000,
      })

      // Small delay to ensure toast is in DOM before dialog closes
      await new Promise(resolve => setTimeout(resolve, 100))

      // Close dialog
      onOpenChange(false)

      // Reset form
      form.reset()

      // Refresh page data
      router.refresh()
    } catch (error) {
      console.error(`Error ${mode}ing certification:`, error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${mode} certification`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Certification' : 'Edit Certification'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Enter the certification details below. All fields are required.'
              : 'Update the certification details below.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Pilot Selection */}
            <FormField
              control={form.control}
              name="pilot_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pilot</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={mode === 'edit'} // Can't change pilot after creation
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a pilot" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pilots.map((pilot) => (
                        <SelectItem key={pilot.id} value={pilot.id}>
                          {pilot.first_name} {pilot.last_name} ({pilot.employee_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Check Type Selection */}
            <FormField
              control={form.control}
              name="check_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Check Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a check type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {checkTypes.map((checkType) => (
                        <SelectItem key={checkType.id} value={checkType.id}>
                          {checkType.check_type}
                          {checkType.description && ` - ${checkType.description}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Check Date */}
            <FormField
              control={form.control}
              name="completion_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Check Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>Date the check was completed</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expiry Date */}
            <FormField
              control={form.control}
              name="expiry_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>Date when certification expires</FormDescription>
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
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Maximum 500 characters</FormDescription>
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
                {mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
