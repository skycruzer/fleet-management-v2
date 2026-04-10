import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-primary/20 bg-primary/10 text-primary',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
        outline: 'border-border text-foreground',
        warning: 'border-warning/20 bg-warning/10 text-warning',
        success: 'border-success/20 bg-success/10 text-success',
        info: 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-foreground)]',
        // Dot variant with animated pulse for live status
        dot: 'pl-2.5 before:mr-1.5 before:size-1.5 before:rounded-full before:bg-current before:animate-pulse border-transparent bg-secondary text-secondary-foreground',
      },
      size: {
        sm: 'px-1.5 py-0 text-[0.65rem]',
        default: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

export { Badge, badgeVariants }
