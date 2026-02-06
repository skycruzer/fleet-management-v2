import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/15 text-primary',
        secondary: 'border-transparent bg-white/[0.06] text-muted-foreground',
        destructive: 'border-transparent bg-destructive/15 text-destructive',
        outline: 'border-white/[0.1] text-foreground',
        warning: 'border-transparent bg-warning/15 text-warning',
        success: 'border-transparent bg-success/15 text-success',
        // Dot variant for minimal status indicators
        dot: 'pl-2.5 before:mr-1.5 before:size-1.5 before:rounded-full before:bg-current border-transparent bg-white/[0.06] text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
