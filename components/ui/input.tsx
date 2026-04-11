import * as React from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const inputVariants = cva(
  // Base styles - Expo monochromatic
  [
    'flex w-full rounded-[0.375rem] border border-[#d9d9e0] bg-white px-3 py-2 text-sm text-[#1c2024]',
    'transition-all duration-200 motion-reduce:transition-none',
    'file:text-[#1c2024] file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'placeholder:text-[#60646c]',
    'focus:border-[#3b82f6] focus:ring-[3px] focus:ring-[#3b82f6]/20 focus:outline-none',
    'disabled:bg-[#f8f8f8] disabled:text-[#a0a0a0] disabled:cursor-not-allowed',
  ],
  {
    variants: {
      size: {
        default: 'h-10',
        sm: 'h-9 text-xs',
        lg: 'h-11',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<'input'>, 'size'>, VariantProps<typeof inputVariants> {
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-required'?: boolean
  'aria-invalid'?: boolean
  error?: boolean
  success?: boolean
  showIcon?: boolean
  autoFocusFirst?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, size, error, success, showIcon = true, autoFocusFirst = false, ...props },
    ref
  ) => {
    const hasState = error || success
    const showStateIcon = showIcon && hasState && !props.disabled
    const localRef = React.useRef<HTMLInputElement>(null)
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || localRef

    // Auto-focus first input if specified
    React.useEffect(() => {
      if (autoFocusFirst && inputRef.current && !props.disabled) {
        inputRef.current.focus()
      }
    }, [autoFocusFirst, inputRef, props.disabled])

    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            inputVariants({ size }),
            // Error state
            error &&
              'border-destructive focus:ring-destructive/20 focus:border-destructive text-destructive',
            // Success state
            success && 'border-success focus:ring-success/20 focus:border-success',
            // Icon padding
            showStateIcon && 'pr-10',
            className
          )}
          ref={inputRef}
          aria-required={props.required || props['aria-required']}
          aria-invalid={error || props['aria-invalid'] ? 'true' : 'false'}
          {...props}
        />
        {/* Validation icons */}
        {showStateIcon && error && (
          <AlertCircle
            className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--color-status-high)]"
            aria-hidden="true"
          />
        )}
        {showStateIcon && success && (
          <CheckCircle2
            className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--color-status-low)]"
            aria-hidden="true"
          />
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input, inputVariants }
