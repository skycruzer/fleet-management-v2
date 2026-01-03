import * as React from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface TextareaProps extends React.ComponentProps<'textarea'> {
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-required'?: boolean
  'aria-invalid'?: boolean
  error?: boolean
  success?: boolean
  showIcon?: boolean
  showCharCount?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, error, success, showIcon = true, showCharCount = false, maxLength, ...props },
    ref
  ) => {
    const [charCount, setCharCount] = React.useState(0)
    const hasState = error || success
    const showStateIcon = showIcon && hasState && !props.disabled

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length)
      if (props.onChange) {
        props.onChange(e)
      }
    }

    React.useEffect(() => {
      if (props.value) {
        setCharCount(String(props.value).length)
      } else if (props.defaultValue) {
        setCharCount(String(props.defaultValue).length)
      }
    }, [props.value, props.defaultValue])

    const isNearLimit = maxLength && charCount >= maxLength * 0.9
    const isAtLimit = maxLength && charCount >= maxLength

    return (
      <div className="relative">
        <textarea
          className={cn(
            // Linear-inspired: clean border, subtle focus glow
            'bg-background flex min-h-[60px] w-full rounded-lg border px-3 py-2 text-sm',
            'transition-all duration-200',
            'placeholder:text-muted-foreground',
            'resize-none',
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
            // Character count padding
            showCharCount && 'pb-8',
            className
          )}
          ref={ref}
          maxLength={maxLength}
          aria-required={props.required || props['aria-required']}
          aria-invalid={error || props['aria-invalid'] ? 'true' : 'false'}
          onChange={handleChange}
          {...props}
        />
        {/* Validation icons */}
        {showStateIcon && error && (
          <AlertCircle className="absolute top-3 right-3 h-4 w-4 text-red-500" aria-hidden="true" />
        )}
        {showStateIcon && success && (
          <CheckCircle2
            className="absolute top-3 right-3 h-4 w-4 text-green-500"
            aria-hidden="true"
          />
        )}
        {/* Character count */}
        {showCharCount && (
          <div
            className={cn(
              'absolute right-3 bottom-2 text-xs transition-colors',
              isAtLimit && 'font-semibold text-red-600',
              isNearLimit && !isAtLimit && 'text-orange-600',
              !isNearLimit && 'text-muted-foreground'
            )}
            aria-live="polite"
            aria-atomic="true"
          >
            {charCount}
            {maxLength && ` / ${maxLength}`}
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
