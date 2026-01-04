/**
 * Command Component - Simplified Implementation
 * Author: Maurice Rondeau
 *
 * Minimal command/combobox component for search and selection
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// Command Root
interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {
  shouldFilter?: boolean
}

const Command = React.forwardRef<HTMLDivElement, CommandProps>(
  ({ className, shouldFilter = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md',
          className
        )}
        {...props}
      />
    )
  }
)
Command.displayName = 'Command'

// Command Input
interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void
}

const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  ({ className, onValueChange, ...props }, ref) => {
    return (
      <div className="flex items-center border-b px-3">
        <input
          ref={ref}
          className={cn(
            'placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          onChange={(e) => onValueChange?.(e.target.value)}
          {...props}
        />
      </div>
    )
  }
)
CommandInput.displayName = 'CommandInput'

// Command List
const CommandList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('max-h-[300px] overflow-x-hidden overflow-y-auto', className)}
        {...props}
      />
    )
  }
)
CommandList.displayName = 'CommandList'

// Command Empty
const CommandEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('text-muted-foreground py-6 text-center text-sm', className)}
        {...props}
      />
    )
  }
)
CommandEmpty.displayName = 'CommandEmpty'

// Command Group
const CommandGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('text-foreground overflow-hidden p-1', className)} {...props} />
    )
  }
)
CommandGroup.displayName = 'CommandGroup'

// Command Item
interface CommandItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  value?: string
  onSelect?: (value: string) => void
}

const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(
  ({ className, onSelect, value, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          className
        )}
        onClick={() => value && onSelect?.(value)}
        {...props}
      />
    )
  }
)
CommandItem.displayName = 'CommandItem'

// Command Separator
const CommandSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('bg-border -mx-1 h-px', className)} {...props} />
  }
)
CommandSeparator.displayName = 'CommandSeparator'

// Command Shortcut
const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn('text-muted-foreground ml-auto text-xs tracking-widest', className)}
      {...props}
    />
  )
}
CommandShortcut.displayName = 'CommandShortcut'

// Command Dialog (placeholder)
const CommandDialog = ({ ...props }) => {
  return <div {...props} />
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
}
