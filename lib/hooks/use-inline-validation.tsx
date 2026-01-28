/**
 * Inline Form Validation Hook
 * Author: Maurice Rondeau
 *
 * Research-backed inline validation (Baymard Institute):
 * - 22% increase in form completion rates with inline validation
 * - Validates on blur (not on change) to avoid premature errors
 * - Removes error immediately when user corrects input
 * - Shows success state when field validates
 *
 * Features:
 * - Debounced validation (500ms default)
 * - Zod schema integration
 * - Field-level and form-level validation
 * - Touch tracking for blur-based validation
 * - WCAG 2.2 accessible error messages
 */

'use client'

import * as React from 'react'
import { z } from 'zod'

// Field validation state
export type FieldState = 'idle' | 'validating' | 'valid' | 'invalid'

// Single field validation result
export interface FieldValidation {
  state: FieldState
  error?: string
  touched: boolean
}

// Form validation state
export interface FormValidationState<T extends Record<string, unknown>> {
  fields: Record<keyof T, FieldValidation>
  isValid: boolean
  isValidating: boolean
  errors: Record<keyof T, string | undefined>
}

// Hook options
export interface UseInlineValidationOptions<T extends z.ZodObject<z.ZodRawShape>> {
  schema: T
  initialValues: z.infer<T>
  debounceMs?: number
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

// Return type
export interface UseInlineValidationReturn<T extends z.ZodObject<z.ZodRawShape>> {
  values: z.infer<T>
  fields: Record<keyof z.infer<T>, FieldValidation>
  errors: Record<keyof z.infer<T>, string | undefined>
  isValid: boolean
  isValidating: boolean
  setValue: (field: keyof z.infer<T>, value: unknown) => void
  setValues: (values: Partial<z.infer<T>>) => void
  setTouched: (field: keyof z.infer<T>, touched?: boolean) => void
  validateField: (field: keyof z.infer<T>) => Promise<boolean>
  validateForm: () => Promise<boolean>
  reset: (values?: z.infer<T>) => void
  getFieldProps: (field: keyof z.infer<T>) => {
    value: unknown
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => void
    onBlur: () => void
    'aria-invalid': boolean
    'aria-describedby': string | undefined
  }
}

/**
 * Inline validation hook with Zod schema support
 *
 * @example
 * const schema = z.object({
 *   email: z.string().email('Invalid email address'),
 *   password: z.string().min(8, 'Password must be at least 8 characters'),
 * })
 *
 * const { values, errors, fields, getFieldProps, validateForm } = useInlineValidation({
 *   schema,
 *   initialValues: { email: '', password: '' },
 * })
 *
 * <input {...getFieldProps('email')} />
 * {errors.email && <span className="text-destructive">{errors.email}</span>}
 */
export function useInlineValidation<T extends z.ZodObject<z.ZodRawShape>>({
  schema,
  initialValues,
  debounceMs = 500,
  validateOnChange = true,
  validateOnBlur = true,
}: UseInlineValidationOptions<T>): UseInlineValidationReturn<T> {
  type FormValues = z.infer<T>
  type FieldName = keyof FormValues

  // State
  const [values, setValuesState] = React.useState<FormValues>(initialValues)
  const [validationState, setValidationState] = React.useState<Record<string, FieldValidation>>(
    () => {
      const initial: Record<string, FieldValidation> = {}
      for (const key of Object.keys(initialValues)) {
        initial[key] = { state: 'idle', touched: false }
      }
      return initial
    }
  )

  // Debounce timers ref
  const debounceTimers = React.useRef<Record<string, NodeJS.Timeout>>({})

  // Clear debounce timer
  const clearDebounce = React.useCallback((field: string) => {
    if (debounceTimers.current[field]) {
      clearTimeout(debounceTimers.current[field])
      delete debounceTimers.current[field]
    }
  }, [])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout)
    }
  }, [])

  // Validate a single field
  const validateField = React.useCallback(
    async (field: FieldName): Promise<boolean> => {
      const fieldKey = field as string

      // Set validating state
      setValidationState((prev) => ({
        ...prev,
        [fieldKey]: { ...prev[fieldKey], state: 'validating' },
      }))

      try {
        // Create a partial schema for just this field
        const partialSchema = z.object({ [fieldKey]: schema.shape[fieldKey] })
        await partialSchema.parseAsync({ [fieldKey]: values[field] })

        // Valid
        setValidationState((prev) => ({
          ...prev,
          [fieldKey]: { ...prev[fieldKey], state: 'valid', error: undefined },
        }))
        return true
      } catch (err) {
        // Invalid
        if (err instanceof z.ZodError) {
          const message = err.issues[0]?.message ?? 'Invalid value'
          setValidationState((prev) => ({
            ...prev,
            [fieldKey]: { ...prev[fieldKey], state: 'invalid', error: message },
          }))
        }
        return false
      }
    },
    [schema, values]
  )

  // Debounced validation
  const debouncedValidateField = React.useCallback(
    (field: FieldName) => {
      const fieldKey = field as string
      clearDebounce(fieldKey)

      // Set to validating immediately for UI feedback
      setValidationState((prev) => ({
        ...prev,
        [fieldKey]: { ...prev[fieldKey], state: 'validating' },
      }))

      debounceTimers.current[fieldKey] = setTimeout(() => {
        validateField(field)
      }, debounceMs)
    },
    [clearDebounce, debounceMs, validateField]
  )

  // Set single field value
  const setValue = React.useCallback(
    (field: FieldName, value: unknown) => {
      setValuesState((prev) => ({ ...prev, [field]: value }))

      // Clear error immediately when user starts typing (better UX)
      const fieldKey = field as string
      setValidationState((prev) => ({
        ...prev,
        [fieldKey]: {
          ...prev[fieldKey],
          state: prev[fieldKey]?.error ? 'idle' : (prev[fieldKey]?.state ?? 'idle'),
          error: undefined,
        },
      }))

      // Trigger debounced validation if enabled
      if (validateOnChange && validationState[fieldKey]?.touched) {
        debouncedValidateField(field)
      }
    },
    [validateOnChange, validationState, debouncedValidateField]
  )

  // Set multiple values at once
  const setValues = React.useCallback((newValues: Partial<FormValues>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }))
  }, [])

  // Set touched state
  const setTouched = React.useCallback(
    (field: FieldName, touched = true) => {
      const fieldKey = field as string
      setValidationState((prev) => ({
        ...prev,
        [fieldKey]: { ...prev[fieldKey], touched },
      }))

      // Validate on blur if enabled and now touched
      if (touched && validateOnBlur) {
        validateField(field)
      }
    },
    [validateOnBlur, validateField]
  )

  // Validate entire form
  const validateForm = React.useCallback(async (): Promise<boolean> => {
    // Touch all fields
    const allTouched: Record<string, FieldValidation> = {}
    for (const key of Object.keys(values)) {
      allTouched[key] = { ...validationState[key], touched: true, state: 'validating' }
    }
    setValidationState(allTouched)

    try {
      await schema.parseAsync(values)

      // All valid
      const validState: Record<string, FieldValidation> = {}
      for (const key of Object.keys(values)) {
        validState[key] = { touched: true, state: 'valid', error: undefined }
      }
      setValidationState(validState)
      return true
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newState: Record<string, FieldValidation> = {}

        for (const key of Object.keys(values)) {
          const fieldError = err.issues.find((issue) => issue.path[0] === key)
          newState[key] = {
            touched: true,
            state: fieldError ? 'invalid' : 'valid',
            error: fieldError?.message,
          }
        }
        setValidationState(newState)
      }
      return false
    }
  }, [schema, values, validationState])

  // Reset form
  const reset = React.useCallback(
    (newValues?: FormValues) => {
      setValuesState(newValues ?? initialValues)
      const resetState: Record<string, FieldValidation> = {}
      for (const key of Object.keys(initialValues)) {
        resetState[key] = { state: 'idle', touched: false }
      }
      setValidationState(resetState)
    },
    [initialValues]
  )

  // Get field props for easy binding
  const getFieldProps = React.useCallback(
    (field: FieldName) => {
      const fieldKey = field as string
      const fieldState = validationState[fieldKey]
      const hasError = fieldState?.state === 'invalid'
      const errorId = hasError ? `${fieldKey}-error` : undefined

      return {
        value: values[field] as unknown,
        onChange: (
          e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
        ) => {
          setValue(field, e.target.value)
        },
        onBlur: () => setTouched(field, true),
        'aria-invalid': hasError,
        'aria-describedby': errorId,
      }
    },
    [values, validationState, setValue, setTouched]
  )

  // Compute derived state
  const fields = validationState as Record<FieldName, FieldValidation>
  const errors = React.useMemo(() => {
    const result: Record<string, string | undefined> = {}
    for (const [key, val] of Object.entries(validationState)) {
      result[key] = val.error
    }
    return result as Record<FieldName, string | undefined>
  }, [validationState])

  const isValidating = React.useMemo(
    () => Object.values(validationState).some((f) => f.state === 'validating'),
    [validationState]
  )

  const isValid = React.useMemo(
    () =>
      Object.values(validationState).every(
        (f) => f.state === 'valid' || (f.state === 'idle' && !f.touched)
      ),
    [validationState]
  )

  return {
    values,
    fields,
    errors,
    isValid,
    isValidating,
    setValue,
    setValues,
    setTouched,
    validateField,
    validateForm,
    reset,
    getFieldProps,
  }
}

/**
 * Helper component for field error messages (WCAG compliant)
 */
interface FieldErrorProps {
  fieldName: string
  error?: string
  className?: string
}

export function FieldError({ fieldName, error, className }: FieldErrorProps) {
  if (!error) return null

  return (
    <span
      id={`${fieldName}-error`}
      role="alert"
      aria-live="polite"
      className={className ?? 'text-destructive mt-1 text-sm'}
    >
      {error}
    </span>
  )
}

/**
 * Helper component for field success indicator
 */
interface FieldSuccessProps {
  state: FieldState
  className?: string
}

export function FieldSuccess({ state, className }: FieldSuccessProps) {
  if (state !== 'valid') return null

  return (
    <span className={className ?? 'text-success ml-2'} aria-label="Field is valid">
      ✓
    </span>
  )
}

export default useInlineValidation
