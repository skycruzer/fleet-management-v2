/**
 * FormSelect Wrapper Component
 * Reusable wrapper for select fields with label, select, and error display
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface SelectOption {
  label: string
  value: string
}

export interface FormSelectWrapperProps {
  name: string
  label: string
  description?: string
  placeholder?: string
  options: SelectOption[]
  disabled?: boolean
  required?: boolean
  className?: string
}

export function FormSelectWrapper({
  name,
  label,
  description,
  placeholder = 'Select an option',
  options,
  disabled = false,
  required = false,
  className,
}: FormSelectWrapperProps) {
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
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
