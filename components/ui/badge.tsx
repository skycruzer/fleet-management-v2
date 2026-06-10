import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-[9999px] border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // Tokenized so every variant adapts to dark mode automatically
        default: 'border-border bg-muted text-foreground',
        secondary: 'border-transparent bg-muted text-muted-foreground',
        destructive:
          'border-transparent bg-[var(--color-destructive-muted)] text-[var(--color-destructive-muted-foreground)]',
        outline: 'border-border bg-transparent text-foreground',
        warning:
          'border-transparent bg-[var(--color-warning-muted)] text-[var(--color-warning-muted-foreground)]',
        success:
          'border-transparent bg-[var(--color-success-muted)] text-[var(--color-success-muted-foreground)]',
        info: 'border-transparent bg-[var(--color-info-bg)] text-[var(--color-info)]',
        // Dot variant for live status (static dot — no continuous animation)
        dot: 'pl-2.5 before:mr-1.5 before:size-1.5 before:rounded-full before:bg-current border-transparent bg-muted text-muted-foreground',
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
