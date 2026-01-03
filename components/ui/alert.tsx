import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const alertVariants = cva(
  // Linear-inspired: left border accent, subtle background
  'relative w-full rounded-lg border-l-4 border px-4 py-3 text-sm transition-colors [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default:
          'bg-muted/30 border-l-border border-border text-foreground [&>svg]:text-foreground',
        destructive:
          'bg-destructive/5 border-l-destructive border-destructive/20 text-destructive [&>svg]:text-destructive',
        warning:
          'bg-warning/5 border-l-warning border-warning/20 text-warning-foreground [&>svg]:text-warning',
        success:
          'bg-success/5 border-l-success border-success/20 text-success-foreground [&>svg]:text-success',
        info: 'bg-accent/5 border-l-accent border-accent/20 text-accent [&>svg]:text-accent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
))
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 leading-none font-medium tracking-tight', className)}
      {...props}
    />
  )
)
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
