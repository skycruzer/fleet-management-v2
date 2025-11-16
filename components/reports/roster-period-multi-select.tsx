/**
 * Roster Period Multi-Select Component
 * Author: Maurice Rondeau
 *
 * Modern multi-select dropdown with:
 * - Searchable list
 * - Selected items shown as removable badges
 * - Select All / Clear All actions
 * - Clean, intuitive UX
 */

'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

interface RosterPeriodMultiSelectProps {
  periods: string[]
  selectedPeriods: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  disabled?: boolean
}

export function RosterPeriodMultiSelect({
  periods,
  selectedPeriods,
  onChange,
  placeholder = 'Select roster periods...',
  disabled = false,
}: RosterPeriodMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSelect = (period: string) => {
    if (selectedPeriods.includes(period)) {
      onChange(selectedPeriods.filter((p) => p !== period))
    } else {
      onChange([...selectedPeriods, period])
    }
  }

  const handleRemove = (period: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    onChange(selectedPeriods.filter((p) => p !== period))
  }

  const handleSelectAll = () => {
    onChange(periods)
  }

  const handleClearAll = () => {
    onChange([])
  }

  // Filter periods based on search query
  const filteredPeriods = periods.filter((period) =>
    period.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between h-auto min-h-10',
              selectedPeriods.length === 0 && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <span className="flex-1 text-left truncate">
              {selectedPeriods.length === 0
                ? placeholder
                : `${selectedPeriods.length} period${selectedPeriods.length === 1 ? '' : 's'} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search periods..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No period found.</CommandEmpty>
              <CommandGroup>
                {/* Select All / Clear All Actions */}
                <div className="flex gap-2 p-2 border-b">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="flex-1 h-7 text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="flex-1 h-7 text-xs"
                    disabled={selectedPeriods.length === 0}
                  >
                    Clear All
                  </Button>
                </div>

                {/* Period List */}
                <div className="max-h-64 overflow-auto">
                  {filteredPeriods.map((period) => {
                    const isSelected = selectedPeriods.includes(period)
                    return (
                      <CommandItem
                        key={period}
                        value={period}
                        onSelect={() => handleSelect(period)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="flex-1">{period}</span>
                      </CommandItem>
                    )
                  })}
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Badges */}
      {selectedPeriods.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30">
          {selectedPeriods.map((period) => (
            <Badge
              key={period}
              variant="secondary"
              className="gap-1 pr-1 hover:bg-secondary/80"
            >
              <span>{period}</span>
              <button
                type="button"
                onClick={(e) => handleRemove(period, e)}
                className="ml-1 rounded-sm hover:bg-secondary-foreground/20 p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
