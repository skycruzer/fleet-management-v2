'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export interface CheckboxProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> {
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-required'?: boolean
}

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        // Linear-inspired: clean checkbox with accent color
        'peer grid h-4 w-4 shrink-0 place-content-center',
        'border-border bg-background rounded border',
        'transition-all duration-150',
        'focus-visible:ring-ring/20 focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:outline-none',
        'data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-white',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      aria-required={props.required || props['aria-required']}
      {...props}
    >
      <CheckboxPrimitive.Indicator className={cn('grid place-content-center text-current')}>
        <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
)
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
