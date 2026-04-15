import * as React from 'react'
import { cn } from '@/lib/utils'

const Kbd = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <kbd
      ref={ref}
      className={cn(
        'border-border bg-muted text-muted-foreground inline-flex items-center justify-center rounded border px-1.5 py-0 font-mono text-[11px] leading-[1.4]',
        className
      )}
      {...props}
    />
  )
)
Kbd.displayName = 'Kbd'

export { Kbd }
