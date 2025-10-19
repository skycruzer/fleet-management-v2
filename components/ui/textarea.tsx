import * as React from "react"
import { CheckCircle2, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  "aria-label"?: string
  "aria-describedby"?: string
  "aria-required"?: boolean
  "aria-invalid"?: boolean
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
            "flex min-h-[60px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none",
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
            // Character count padding
            showCharCount && "pb-8",
            className
          )}
          ref={ref}
          maxLength={maxLength}
          aria-required={props.required || props["aria-required"]}
          aria-invalid={error || props["aria-invalid"] ? "true" : "false"}
          onChange={handleChange}
          {...props}
        />
        {/* Validation icons */}
        {showStateIcon && error && (
          <AlertCircle
            className="absolute right-3 top-3 h-4 w-4 text-red-500"
            aria-hidden="true"
          />
        )}
        {showStateIcon && success && (
          <CheckCircle2
            className="absolute right-3 top-3 h-4 w-4 text-green-500"
            aria-hidden="true"
          />
        )}
        {/* Character count */}
        {showCharCount && (
          <div
            className={cn(
              "absolute bottom-2 right-3 text-xs transition-colors",
              isAtLimit && "text-red-600 font-semibold",
              isNearLimit && !isAtLimit && "text-orange-600",
              !isNearLimit && "text-muted-foreground"
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
Textarea.displayName = "Textarea"

export { Textarea }
