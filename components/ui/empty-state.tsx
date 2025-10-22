/**
 * Empty State Component
 * Displays a helpful message when no data is available
 */

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <Card className={`p-12 text-center ${className}`}>
      {Icon && (
        <div className="flex justify-center mb-4">
          <Icon className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <div className="flex justify-center mt-6">
          {action.href ? (
            <Button onClick={action.onClick} asChild>
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </Card>
  )
}

/**
 * Search Empty State Component
 * Specialized empty state for search results
 */
interface SearchEmptyStateProps {
  searchQuery: string
  onClearSearch?: () => void
  className?: string
}

export function SearchEmptyState({
  searchQuery,
  onClearSearch,
  className = '',
}: SearchEmptyStateProps) {
  return (
    <Card className={`p-12 text-center ${className}`}>
      <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
      <p className="text-sm text-muted-foreground mb-4">
        We couldn't find anything matching{' '}
        <span className="font-medium text-foreground">"{searchQuery}"</span>
      </p>
      {onClearSearch && (
        <Button variant="outline" onClick={onClearSearch}>
          Clear search
        </Button>
      )}
    </Card>
  )
}
