/**
 * FormCheckbox Wrapper Component
 * Reusable wrapper for checkbox fields with checkbox, label, and error display
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
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export interface FormCheckboxWrapperProps {
  name: string
  label: string
  description?: string
  disabled?: boolean
  className?: string
}

export function FormCheckboxWrapper({
  name,
  label,
  description,
  disabled = false,
  className,
}: FormCheckboxWrapperProps) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={cn('flex flex-row items-center gap-2.5', className)}>
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              aria-label={label}
              aria-describedby={description ? `${name}-description` : undefined}
              aria-invalid={!!fieldState.error}
            />
          </FormControl>
          <div className="space-y-0.5 leading-none">
            <FormLabel className="cursor-pointer font-normal">{label}</FormLabel>
            {description && (
              <FormDescription id={`${name}-description`}>{description}</FormDescription>
            )}
            <FormMessage role="alert" aria-live="polite" />
          </div>
        </FormItem>
      )}
    />
  )
}
