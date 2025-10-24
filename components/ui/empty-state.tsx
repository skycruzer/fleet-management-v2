/**
 * Empty State Component
 * Displays a helpful message when no data is available
 * Enhanced with professional design and smooth animations
 */

'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
  variant?: 'default' | 'compact'
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  const isCompact = variant === 'compact'

  return (
    <Card className={cn('text-center', isCompact ? 'p-8' : 'p-12', className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center"
      >
        {/* Icon with gradient background */}
        {Icon && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className={cn(
              'mb-6 flex items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700',
              isCompact ? 'h-16 w-16' : 'h-24 w-24'
            )}
            aria-hidden="true"
          >
            <Icon
              className={cn(
                'text-slate-600 dark:text-slate-400',
                isCompact ? 'h-8 w-8' : 'h-12 w-12'
              )}
            />
          </motion.div>
        )}

        {/* Title */}
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            'font-semibold text-foreground',
            isCompact ? 'text-lg mb-2' : 'text-2xl mb-3'
          )}
        >
          {title}
        </motion.h3>

        {/* Description */}
        {description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={cn(
              'text-muted-foreground max-w-md mx-auto',
              isCompact ? 'text-sm mb-4' : 'text-base mb-6'
            )}
          >
            {description}
          </motion.p>
        )}

        {/* Actions */}
        {(action || secondaryAction) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 mt-6"
          >
            {action && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                {action.href ? (
                  <Button onClick={action.onClick} asChild>
                    <a href={action.href}>{action.label}</a>
                  </Button>
                ) : (
                  <Button onClick={action.onClick}>{action.label}</Button>
                )}
              </motion.div>
            )}
            {secondaryAction && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                {secondaryAction.href ? (
                  <Button onClick={secondaryAction.onClick} variant="outline" asChild>
                    <a href={secondaryAction.href}>{secondaryAction.label}</a>
                  </Button>
                ) : (
                  <Button onClick={secondaryAction.onClick} variant="outline">
                    {secondaryAction.label}
                  </Button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>
    </Card>
  )
}

/**
 * Search Empty State Component
 * Specialized empty state for search results
 * Enhanced with animations and professional design
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
    <Card className={cn('p-12 text-center', className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center"
      >
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xl font-semibold text-foreground mb-3"
        >
          No results found
        </motion.h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground mb-6 max-w-md"
        >
          We couldn't find anything matching{' '}
          <span className="font-semibold text-foreground">"{searchQuery}"</span>
        </motion.p>
        {onClearSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button variant="outline" onClick={onClearSearch}>
              Clear search
            </Button>
          </motion.div>
        )}
      </motion.div>
    </Card>
  )
}
