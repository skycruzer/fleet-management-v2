import * as React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const List = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('border-border bg-card overflow-hidden rounded-lg border', className)}
      {...props}
    />
  )
)
List.displayName = 'List'

interface ListHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  columns: string[]
}

const ListHeader = React.forwardRef<HTMLDivElement, ListHeaderProps>(
  ({ className, columns, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'border-border bg-muted/40 text-muted-foreground grid grid-cols-[100px_1fr_160px_140px_32px] gap-3 border-b px-4 py-2 text-[11px] font-medium tracking-wide uppercase',
        className
      )}
      {...props}
    >
      {columns.map((c, i) => (
        <span key={i}>{c}</span>
      ))}
    </div>
  )
)
ListHeader.displayName = 'ListHeader'

interface ListRowProps {
  id?: React.ReactNode
  name: React.ReactNode
  sub?: React.ReactNode
  status?: React.ReactNode
  meta?: React.ReactNode
  href?: string
  onClick?: () => void
  className?: string
}

function ListRow({ id, name, sub, status, meta, href, onClick, className }: ListRowProps) {
  const content = (
    <>
      <span className="text-muted-foreground truncate font-mono text-xs">{id}</span>
      <div className="min-w-0">
        <div className="text-foreground truncate font-medium">{name}</div>
        {sub && <div className="text-muted-foreground mt-0.5 truncate text-xs">{sub}</div>}
      </div>
      <div className="flex items-center">{status}</div>
      <div className="text-muted-foreground truncate text-sm">{meta}</div>
      <ChevronRight className="text-muted-foreground/60 h-4 w-4" aria-hidden="true" />
    </>
  )

  const rowClasses = cn(
    'grid cursor-pointer grid-cols-[100px_1fr_160px_140px_32px] items-center gap-3 border-b border-border px-4 py-2.5 text-sm transition-colors last:border-b-0 hover:bg-muted/40',
    className
  )

  if (href) {
    return (
      <Link href={href} className={rowClasses}>
        {content}
      </Link>
    )
  }

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={rowClasses}
    >
      {content}
    </div>
  )
}

export { List, ListHeader, ListRow }
