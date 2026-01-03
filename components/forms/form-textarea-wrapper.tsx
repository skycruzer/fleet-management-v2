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
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && (
              <span className="text-destructive/70 ml-0.5 text-xs" aria-label="required">
                *
              </span>
            )}
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              rows={rows}
              disabled={disabled}
              required={required}
              maxLength={maxLength}
              aria-label={label}
              aria-invalid={!!fieldState.error}
              aria-describedby={description ? `${name}-description` : undefined}
              showCharCount={!!maxLength}
              {...field}
              value={field.value ?? ''}
            />
          </FormControl>
          {description && (
            <FormDescription id={`${name}-description`}>{description}</FormDescription>
          )}
          <FormMessage role="alert" aria-live="polite" />
        </FormItem>
      )}
    />
  )
}
