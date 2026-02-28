import * as React from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const inputVariants = cva(
  // Base styles - Dark premium
  [
    'bg-muted/40 flex w-full rounded-lg border px-3 py-2 text-sm text-foreground',
    'transition-all duration-200 motion-reduce:transition-none',
    'file:text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'placeholder:text-muted-foreground',
    'border-border',
    'focus:ring-primary/20 focus:border-primary/50 focus:ring-2 focus:outline-none',
    'disabled:bg-[var(--color-disabled-bg)] disabled:text-[var(--color-disabled-foreground)] disabled:cursor-not-allowed',
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
