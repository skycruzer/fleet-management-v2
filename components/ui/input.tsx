import * as React from "react"
import { CheckCircle2, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  "aria-label"?: string
  "aria-describedby"?: string
  "aria-required"?: boolean
  "aria-invalid"?: boolean
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
            "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            // Default border
            "border-input",
            // Error state
            error && "border-red-500 focus-visible:ring-red-500 text-red-900 placeholder:text-red-300",
            // Success state
            success && "border-green-500 focus-visible:ring-green-500",
            // Icon padding
            showStateIcon && "pr-10",
            // Focus ring default
            !error && !success && "focus-visible:ring-ring",
            className
          )}
          ref={inputRef}
          aria-required={props.required || props["aria-required"]}
          aria-invalid={error || props["aria-invalid"] ? "true" : "false"}
          {...props}
        />
        {/* Validation icons */}
        {showStateIcon && error && (
          <AlertCircle
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500"
            aria-hidden="true"
          />
        )}
        {showStateIcon && success && (
          <CheckCircle2
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500"
            aria-hidden="true"
          />
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
