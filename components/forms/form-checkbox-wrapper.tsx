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
      render={({ field }) => (
        <FormItem className={`flex flex-row items-start space-x-3 space-y-0 ${className}`}>
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
