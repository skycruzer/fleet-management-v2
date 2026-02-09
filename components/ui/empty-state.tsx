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
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import { EASING } from '@/lib/animations/motion-variants'

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
  const { shouldAnimate } = useAnimationSettings()

  // Animation variants that respect reduced motion
  const containerVariants = shouldAnimate
    ? { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
    : { initial: { opacity: 1 }, animate: { opacity: 1 } }

  const iconVariants = shouldAnimate
    ? { initial: { scale: 0 }, animate: { scale: 1 } }
    : { initial: { scale: 1 }, animate: { scale: 1 } }

  return (
    <Card className={cn('text-center', isCompact ? 'p-8' : 'p-12', className)}>
      <motion.div
        initial={containerVariants.initial}
        animate={containerVariants.animate}
        transition={shouldAnimate ? { duration: 0.3, ease: EASING.easeOut } : { duration: 0 }}
        className="flex flex-col items-center"
      >
        {/* Icon with accent-tinted gradient background */}
        {Icon && (
          <motion.div
            initial={iconVariants.initial}
            animate={iconVariants.animate}
            transition={
              shouldAnimate
                ? { delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }
                : { duration: 0 }
            }
            className={cn(
              'mb-6 flex items-center justify-center rounded-full',
              'from-primary/15 to-primary/5 bg-gradient-to-br',
              isCompact ? 'h-16 w-16' : 'h-24 w-24'
            )}
            aria-hidden="true"
          >
            <Icon className={cn('text-primary', isCompact ? 'h-8 w-8' : 'h-12 w-12')} />
          </motion.div>
        )}

        {/* Title */}
        <motion.h3
          initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={shouldAnimate ? { delay: 0.15 } : { duration: 0 }}
          className={cn(
            'text-foreground font-semibold',
            isCompact ? 'mb-2 text-lg' : 'mb-3 text-2xl'
          )}
        >
          {title}
        </motion.h3>

        {/* Description */}
        {description && (
          <motion.p
            initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={shouldAnimate ? { delay: 0.2 } : { duration: 0 }}
            className={cn(
              'text-muted-foreground mx-auto max-w-md',
              isCompact ? 'mb-4 text-sm' : 'mb-6 text-base'
            )}
          >
            {description}
          </motion.p>
        )}

        {/* Actions */}
        {(action || secondaryAction) && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={shouldAnimate ? { delay: 0.25 } : { duration: 0 }}
            className="mt-6 flex items-center gap-3"
          >
            {action && (
              <motion.div
                whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
              >
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
              <motion.div
                whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
              >
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
  const { shouldAnimate } = useAnimationSettings()

  return (
    <Card className={cn('p-12 text-center', className)}>
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldAnimate ? { duration: 0.3, ease: EASING.easeOut } : { duration: 0 }}
        className="flex flex-col items-center"
      >
        <motion.h3
          initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={shouldAnimate ? { delay: 0.1 } : { duration: 0 }}
          className="text-foreground mb-3 text-xl font-semibold"
        >
          No results found
        </motion.h3>
        <motion.p
          initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={shouldAnimate ? { delay: 0.15 } : { duration: 0 }}
          className="text-muted-foreground mb-6 max-w-md text-sm"
        >
          We couldn't find anything matching{' '}
          <span className="text-accent font-semibold">"{searchQuery}"</span>
        </motion.p>
        {onClearSearch && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={shouldAnimate ? { delay: 0.2 } : { duration: 0 }}
            whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
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
