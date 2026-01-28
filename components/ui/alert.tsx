import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const alertVariants = cva(
  // Dark theme: left border accent, alpha backgrounds
  'relative w-full rounded-lg border-l-4 border px-4 py-3 text-sm transition-colors [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default:
          'bg-white/[0.03] border-l-white/20 border-white/[0.06] text-foreground [&>svg]:text-foreground',
        destructive:
          'bg-red-500/10 border-l-red-500 border-red-500/20 text-red-400 [&>svg]:text-red-400',
        warning:
          'bg-amber-500/10 border-l-amber-500 border-amber-500/20 text-amber-400 [&>svg]:text-amber-400',
        success:
          'bg-emerald-500/10 border-l-emerald-500 border-emerald-500/20 text-emerald-400 [&>svg]:text-emerald-400',
        info: 'bg-sky-500/10 border-l-sky-500 border-sky-500/20 text-sky-400 [&>svg]:text-sky-400',
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
