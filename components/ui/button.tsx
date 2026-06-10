import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { ButtonSpinner } from './spinner'

const buttonVariants = cva(
  // Expo design system — clean, minimal buttons with subtle shadow hover
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[0.375rem] text-sm font-medium transition-shadow duration-150 ease-out motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  {
    variants: {
      variant: {
        // Tokenized — dark mode comes from the token flips in globals.css,
        // no per-variant dark: overrides needed
        // Expo default: card bg, 1px border, foreground text
        default: 'bg-card text-foreground border border-input shadow-sm hover:shadow-md',
        // Expo primary/CTA: black bg light / white bg dark, pill-shaped
        primary: 'bg-primary text-primary-foreground rounded-full shadow-sm hover:shadow-md',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:shadow-md focus-visible:ring-destructive/20',
        outline: 'border border-input bg-transparent text-foreground hover:shadow-md',
        secondary: 'bg-muted text-foreground shadow-sm hover:shadow-md',
        ghost: 'text-foreground hover:bg-muted',
        link: 'text-foreground underline-offset-4 hover:underline',
      },
      size: {
        // default matches Input height (h-10) so inline form rows align
        default: 'h-10 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 px-3 py-1.5 gap-1.5 text-xs has-[>svg]:px-2.5',
        lg: 'h-11 px-6 py-2.5 has-[>svg]:px-4',
        pill: 'h-10 rounded-full px-4 has-[>svg]:px-3',
        'pill-sm': 'h-8 rounded-full px-3 text-xs has-[>svg]:px-2',
        icon: 'size-10',
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
