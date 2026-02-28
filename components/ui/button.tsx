import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { ButtonSpinner } from './spinner'

const buttonVariants = cva(
  // Base styles with enhanced focus glow using design system variables
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-out motion-reduce:transition-none disabled:pointer-events-none disabled:text-[var(--color-disabled-foreground)] disabled:bg-[var(--color-disabled-bg)] [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-accent/20 aria-invalid:ring-destructive/20 aria-invalid:border-destructive active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-[0_0_20px_oklch(0.55_0.12_250/0.15)]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md focus-visible:ring-destructive/20',
        success:
          'bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:shadow-md focus-visible:ring-success/20',
        outline:
          'border border-border bg-transparent hover:bg-muted/50 hover:border-border hover:shadow-sm',
        secondary: 'bg-muted/60 text-secondary-foreground hover:bg-muted/80 hover:shadow-sm',
        ghost: 'hover:bg-muted/50 hover:text-foreground',
        link: 'text-foreground underline-offset-4 hover:underline',
        soft: 'bg-accent/15 text-accent hover:bg-accent/25 hover:shadow-sm',
        aviation:
          'bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] text-primary-foreground shadow-md hover:shadow-[0_0_25px_var(--color-primary)/0.3] hover:bg-[position:right_center] transition-all duration-500 motion-reduce:transition-none',
        critical:
          'bg-gradient-to-r from-destructive to-[var(--color-danger-600)] text-destructive-foreground shadow-md hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:from-[var(--color-danger-600)] hover:to-destructive',
      },
      size: {
        default: 'h-11 px-4 py-2 has-[>svg]:px-3', // WCAG 2.5.5: 44px touch target minimum
        sm: 'h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5', // Compact variant, use sparingly in tight UI
        lg: 'h-12 rounded-lg px-6 has-[>svg]:px-4', // Increased from h-11 for visual hierarchy
        icon: 'size-11', // WCAG 2.5.5: 44px touch target minimum
        'icon-sm': 'size-9', // Compact variant, use sparingly
        'icon-lg': 'size-12', // Increased from size-11 for consistency with lg
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Show loading spinner and disable button */
  loading?: boolean
  /** Text to display when loading */
  loadingText?: string
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'

  // If loading, show spinner and disable button
  if (loading && !asChild) {
    return (
      <button
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={true}
        aria-busy="true"
        aria-label={loadingText || 'Loading...'}
        {...props}
      >
        <ButtonSpinner />
        {loadingText || children}
      </button>
    )
  }

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }
