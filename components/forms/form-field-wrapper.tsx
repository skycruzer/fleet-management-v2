/**
 * FormField Wrapper Component
 * Reusable wrapper for form fields with label, input, and error display
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
import { Input } from '@/components/ui/input'

export interface FormFieldWrapperProps {
  name: string
  label: string
  description?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  disabled?: boolean
  required?: boolean
  className?: string
}

export function FormFieldWrapper({
  name,
  label,
  description,
  placeholder,
  type = 'text',
  disabled = false,
  required = false,
  className,
}: FormFieldWrapperProps) {
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
            <Input
              placeholder={placeholder}
              type={type}
              disabled={disabled}
              required={required}
              aria-label={label}
              aria-invalid={!!fieldState.error}
              aria-describedby={description ? `${name}-description` : undefined}
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
