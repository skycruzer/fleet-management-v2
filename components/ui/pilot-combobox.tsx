/**
 * Pilot Combobox Component
 * Searchable pilot selection using Popover + Command pattern
 *
 * Author: Maurice Rondeau
 * @version 1.0.0
 * @created February 2026
 */

'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

// ===================================
// TYPES
// ===================================

export interface PilotOption {
  id: string
  first_name: string
  last_name: string
  employee_id?: string
  employee_number?: string
  role?: string
}

interface PilotComboboxProps {
  pilots: PilotOption[]
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

// ===================================
// COMPONENT
// ===================================

export function PilotCombobox({
  pilots,
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select a pilot...',
  className,
}: PilotComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  // Find the selected pilot for display
  const selectedPilot = React.useMemo(
    () => pilots.find((pilot) => pilot.id === value),
    [pilots, value]
  )

  // Filter pilots based on search query
  const filteredPilots = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return pilots
    }

    const query = searchQuery.toLowerCase()
    return pilots.filter((pilot) => {
      const fullName = `${pilot.first_name} ${pilot.last_name}`.toLowerCase()
      const employeeId = (pilot.employee_id || pilot.employee_number || '').toLowerCase()
      const role = (pilot.role || '').toLowerCase()

      return fullName.includes(query) || employeeId.includes(query) || role.includes(query)
    })
  }, [pilots, searchQuery])

  // Format pilot display name
  const formatPilotDisplay = (pilot: PilotOption) => {
    const employeeId = pilot.employee_id || pilot.employee_number || ''
    const role = pilot.role ? ` (${pilot.role})` : ''
    return `${pilot.first_name} ${pilot.last_name} - ${employeeId}${role}`
  }

  // Handle pilot selection
  const handleSelect = (pilotId: string) => {
    onValueChange(pilotId)
    setOpen(false)
    setSearchQuery('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={
            selectedPilot
              ? `Selected pilot: ${selectedPilot.first_name} ${selectedPilot.last_name}`
              : placeholder
          }
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {selectedPilot ? formatPilotDisplay(selectedPilot) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[100] w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search pilots by name or employee ID..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="border-0 focus:ring-0"
            />
          </div>
          <CommandList>
            {filteredPilots.length === 0 ? (
              <CommandEmpty>No pilots found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredPilots.map((pilot) => (
                  <CommandItem
                    key={pilot.id}
                    value={pilot.id}
                    onSelect={handleSelect}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelect(pilot.id)
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === pilot.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {pilot.first_name} {pilot.last_name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {pilot.employee_id || pilot.employee_number}
                        {pilot.role && ` • ${pilot.role}`}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
