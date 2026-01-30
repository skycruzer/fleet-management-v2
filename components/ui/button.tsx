import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { ButtonSpinner } from './spinner'

const buttonVariants = cva(
  // Base styles with enhanced focus glow using design system variables
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-accent/20 aria-invalid:ring-destructive/20 aria-invalid:border-destructive active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
        destructive:
          'bg-destructive text-white shadow-sm hover:bg-destructive/90 hover:shadow-md focus-visible:ring-destructive/20',
        success:
          'bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:shadow-md focus-visible:ring-success/20',
        outline:
          'border border-white/10 bg-transparent hover:bg-white/5 hover:border-white/20 hover:shadow-sm',
        secondary: 'bg-white/[0.06] text-secondary-foreground hover:bg-white/[0.1] hover:shadow-sm',
        ghost: 'hover:bg-white/5 hover:text-foreground',
        link: 'text-foreground underline-offset-4 hover:underline',
        soft: 'bg-accent/15 text-accent hover:bg-accent/25 hover:shadow-sm',
        aviation:
          'bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] text-white shadow-md hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] hover:bg-[position:right_center] transition-all duration-500',
        critical:
          'bg-gradient-to-r from-destructive to-red-600 text-white shadow-md hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:from-red-600 hover:to-destructive',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-11 rounded-lg px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-11',
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
