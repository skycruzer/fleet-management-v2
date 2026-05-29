import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-[9999px] border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-foreground)]',
        secondary:
          'border-transparent bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
        destructive:
          'border-transparent bg-[var(--color-destructive-muted)] text-[var(--color-destructive-muted-foreground)]',
        outline: 'border-[var(--color-border)] bg-transparent text-[var(--color-foreground)]',
        warning:
          'border-transparent bg-[var(--color-warning-muted)] text-[var(--color-warning-muted-foreground)]',
        success:
          'border-transparent bg-[var(--color-success-muted)] text-[var(--color-success-muted-foreground)]',
        info: 'border-transparent bg-[var(--color-info-bg)] text-[var(--color-info-foreground)]',
        // Dot variant with animated pulse for live status
        dot: 'pl-2.5 before:mr-1.5 before:size-1.5 before:rounded-full before:bg-current before:animate-pulse border-transparent bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
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
