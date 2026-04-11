import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-[9999px] border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-[#e0e1e6] bg-[#f0f0f3] text-[#1c2024]',
        secondary: 'border-transparent bg-[#f0f0f3] text-[#60646c]',
        destructive: 'border-transparent bg-[#fff0f0] text-[#cd2b31]',
        outline: 'border-[#e0e1e6] bg-transparent text-[#1c2024]',
        warning: 'border-transparent bg-[#fff4e0] text-[#ad5700]',
        success: 'border-transparent bg-[#e9f9ee] text-[#18794e]',
        info: 'border-transparent bg-[#edf6ff] text-[#0d74ce]',
        // Dot variant with animated pulse for live status
        dot: 'pl-2.5 before:mr-1.5 before:size-1.5 before:rounded-full before:bg-current before:animate-pulse border-transparent bg-[#f0f0f3] text-[#60646c]',
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
