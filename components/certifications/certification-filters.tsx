/**
 * Certification Filters Component
 * Unified search and filter bar for certifications
 *
 * @author Maurice Rondeau
 * @version 1.0.0
 * @created 2025-12-19
 */

'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search, X } from 'lucide-react'
import type { CertificationStats } from './certification-stat-cards'

interface CertificationFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: 'all' | 'current' | 'expiring' | 'expired'
  onStatusFilterChange: (status: 'all' | 'current' | 'expiring' | 'expired') => void
  categoryFilter?: string
  onCategoryFilterChange?: (category: string) => void
  categories?: string[]
  stats: CertificationStats
}

export function CertificationFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categories = [],
  stats,
}: CertificationFiltersProps) {
  const hasActiveFilters =
    searchQuery || statusFilter !== 'all' || (categoryFilter && categoryFilter !== 'all')

  const clearFilters = () => {
    onSearchChange('')
    onStatusFilterChange('all')
    onCategoryFilterChange?.('all')
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by pilot name or check type..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({stats.total})</SelectItem>
            <SelectItem value="current">Current ({stats.current})</SelectItem>
            <SelectItem value="expiring">Expiring ({stats.expiring})</SelectItem>
            <SelectItem value="expired">Expired ({stats.expired})</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter (optional) */}
        {categories.length > 0 && onCategoryFilterChange && (
          <Select value={categoryFilter || 'all'} onValueChange={onCategoryFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </Card>
  )
}
