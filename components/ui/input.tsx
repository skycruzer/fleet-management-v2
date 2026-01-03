import * as React from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface InputProps extends React.ComponentProps<'input'> {
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
  ({ className, type, error, success, showIcon = true, autoFocusFirst = false, ...props }, ref) => {
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
            // Base styles - Linear-inspired
            'bg-background flex h-9 w-full rounded-lg border px-3 py-2 text-sm',
            'transition-all duration-200',
            'file:text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            // Default border
            'border-border',
            // Focus state - subtle indigo glow
            'focus:ring-ring/20 focus:border-foreground/30 focus:ring-2 focus:outline-none',
            // Disabled state
            'disabled:bg-muted disabled:cursor-not-allowed disabled:opacity-50',
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
            className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-red-500"
            aria-hidden="true"
          />
        )}
        {showStateIcon && success && (
          <CheckCircle2
            className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-green-500"
            aria-hidden="true"
          />
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
