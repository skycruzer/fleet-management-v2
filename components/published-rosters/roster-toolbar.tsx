// Maurice Rondeau — Roster Toolbar (search, activity filter, rank toggle)
'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'

interface ActivityCode {
  code: string
  name: string
  category: string
}

export type RankFilter = 'ALL' | 'CAPTAIN' | 'FIRST_OFFICER' | 'PAIRINGS'

interface RosterToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activityFilter: string[]
  onActivityFilterChange: (codes: string[]) => void
  rankFilter: RankFilter
  onRankFilterChange: (rank: RankFilter) => void
  activityCodes: ActivityCode[]
}

export function RosterToolbar({
  searchQuery,
  onSearchChange,
  activityFilter,
  onActivityFilterChange,
  rankFilter,
  onRankFilterChange,
  activityCodes,
}: RosterToolbarProps) {
  const toggleCode = (code: string) => {
    if (activityFilter.includes(code)) {
      onActivityFilterChange(activityFilter.filter((c) => c !== code))
    } else {
      onActivityFilterChange([...activityFilter, code])
    }
  }

  // Group codes by category for the filter dropdown
  const grouped = activityCodes.reduce(
    (acc, code) => {
      if (!acc[code.category]) acc[code.category] = []
      acc[code.category].push(code)
      return acc
    },
    {} as Record<string, ActivityCode[]>
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative w-64">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
        <Input
          placeholder="Search pilot..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="text-muted-foreground hover:text-foreground absolute top-2.5 right-2.5"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Activity Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            Activities
            {activityFilter.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {activityFilter.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Filter by activity</span>
            {activityFilter.length > 0 && (
              <button
                onClick={() => onActivityFilterChange([])}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {Object.entries(grouped).map(([category, codes]) => (
              <div key={category}>
                <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wider uppercase">
                  {category.replace('_', ' ')}
                </p>
                <div className="space-y-1">
                  {codes.map((code) => (
                    <label
                      key={code.code}
                      className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs"
                    >
                      <Checkbox
                        checked={activityFilter.includes(code.code)}
                        onCheckedChange={() => toggleCode(code.code)}
                      />
                      <span className="font-mono">{code.code}</span>
                      <span className="text-muted-foreground truncate">{code.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Rank Filter */}
      <Select value={rankFilter} onValueChange={(v) => onRankFilterChange(v as RankFilter)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Ranks</SelectItem>
          <SelectItem value="CAPTAIN">Captains</SelectItem>
          <SelectItem value="FIRST_OFFICER">First Officers</SelectItem>
          <SelectItem value="PAIRINGS">Pairings</SelectItem>
        </SelectContent>
      </Select>

      {/* Active filters display */}
      {activityFilter.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {activityFilter.map((code) => (
            <Badge
              key={code}
              variant="secondary"
              className="cursor-pointer gap-1 text-xs"
              onClick={() => toggleCode(code)}
            >
              {code}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
