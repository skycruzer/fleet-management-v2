/**
 * FormDatePicker Wrapper Component
 * Reusable wrapper for date picker fields with label, calendar, and error display
 *
 * @version 1.0.0
 * @since 2025-10-17
 */

'use client'

import { useFormContext } from 'react-hook-form'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface FormDatePickerWrapperProps {
  name: string
  label: string
  description?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  disableFuture?: boolean
  disablePast?: boolean
}

export function FormDatePickerWrapper({
  name,
  label,
  description,
  placeholder = 'Pick a date',
  disabled = false,
  required = false,
  className,
  disableFuture = false,
  disablePast = false,
}: FormDatePickerWrapperProps) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={cn('flex flex-col', className)}>
          <FormLabel>
            {label}
            {required && (
              <span className="text-destructive ml-1" aria-label="required">
                *
              </span>
            )}
          </FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  disabled={disabled}
                  className={cn(
                    'w-full pl-3 text-left font-normal',
                    !field.value && 'text-muted-foreground'
                  )}
                  aria-label={`${label}, ${field.value ? format(new Date(field.value), 'PPP') : placeholder}`}
                  aria-invalid={!!fieldState.error}
                  aria-describedby={description ? `${name}-description` : undefined}
                  aria-required={required}
                  role="combobox"
                  aria-haspopup="dialog"
                >
                  {field.value ? (
                    format(new Date(field.value), 'PPP')
                  ) : (
                    <span>{placeholder}</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" aria-hidden="true" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" role="dialog" aria-label={`${label} calendar`}>
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={(date) => {
                  // Format as YYYY-MM-DD to match validation schema
                  field.onChange(date ? format(date, 'yyyy-MM-dd') : null)
                }}
                disabled={(date) => {
                  if (disableFuture && date > new Date()) return true
                  if (disablePast && date < new Date()) return true
                  return false
                }}
                initialFocus
                aria-label={`Select ${label}`}
              />
            </PopoverContent>
          </Popover>
          {description && (
            <FormDescription id={`${name}-description`}>{description}</FormDescription>
          )}
          <FormMessage role="alert" aria-live="polite" />
        </FormItem>
      )}
    />
  )
}
