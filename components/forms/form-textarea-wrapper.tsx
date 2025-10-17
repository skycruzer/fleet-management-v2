/**
 * FormTextarea Wrapper Component
 * Reusable wrapper for textarea fields with label, textarea, and error display
 *
 * @version 1.0.0
 * @since 2025-10-17
 */

'use client'

import { useFormContext } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'

export interface FormTextareaWrapperProps {
  name: string
  label: string
  description?: string
  placeholder?: string
  rows?: number
  disabled?: boolean
  required?: boolean
  maxLength?: number
  className?: string
}

export function FormTextareaWrapper({
  name,
  label,
  description,
  placeholder,
  rows = 4,
  disabled = false,
  required = false,
  maxLength,
  className,
}: FormTextareaWrapperProps) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              rows={rows}
              disabled={disabled}
              maxLength={maxLength}
              {...field}
              value={field.value ?? ''}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          {maxLength && field.value && (
            <p className="text-xs text-muted-foreground text-right">
              {field.value.length}/{maxLength}
            </p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
