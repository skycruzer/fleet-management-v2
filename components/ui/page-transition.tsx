/**
 * Page Transition Component
 *
 * @description Wrapper component for page-level animations with staggered children
 * Automatically handles reduced motion preferences
 *
 * @author Maurice Rondeau
 */

'use client'

import * as React from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import { fadeInUp, reducedMotionVariants } from '@/lib/animations'
import { cn } from '@/lib/utils'

// Pre-create motion components outside render to prevent state resets
const MotionDiv = motion.div
const MotionSection = motion.section
const MotionArticle = motion.article
const MotionMain = motion.main
const MotionAside = motion.aside

const motionComponents = {
  div: MotionDiv,
  section: MotionSection,
  article: MotionArticle,
  main: MotionMain,
  aside: MotionAside,
} as const

type PageElement = keyof typeof motionComponents

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
  /** Unique key for AnimatePresence (typically route pathname) */
  pageKey?: string
  /** Custom variants for the container */
  variants?: Variants
  /** Delay before animation starts (seconds) */
  delay?: number
}

/**
 * Page Transition Wrapper
 *
 * Wraps page content with fade-in and stagger animations.
 * Respects user's reduced motion preference.
 *
 * @example
 * ```tsx
 * // In a page component
 * export default function DashboardPage() {
 *   return (
 *     <PageTransition pageKey="dashboard">
 *       <PageHeader />
 *       <PageContent />
 *     </PageTransition>
 *   )
 * }
 * ```
 */
export function PageTransition({
  children,
  className,
  pageKey,
  variants,
  delay = 0,
}: PageTransitionProps) {
  const { shouldAnimate } = useAnimationSettings()

  const containerVariants: Variants = React.useMemo(() => {
    if (!shouldAnimate) return reducedMotionVariants

    return (
      variants || {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delay,
            when: 'beforeChildren',
            staggerChildren: 0.05,
          },
        },
        exit: {
          opacity: 0,
          transition: { duration: 0.1 },
        },
      }
    )
  }, [shouldAnimate, variants, delay])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
        className={cn('min-h-0 w-full', className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

interface PageSectionProps {
  children: React.ReactNode
  className?: string
  /** Custom variants for this section */
  variants?: Variants
  /** Render as a different HTML element */
  as?: PageElement
}

/**
 * Page Section
 *
 * Individual section within a PageTransition that animates with stagger.
 * Should be used as direct child of PageTransition.
 *
 * @example
 * ```tsx
 * <PageTransition>
 *   <PageSection>
 *     <h1>Title</h1>
 *   </PageSection>
 *   <PageSection>
 *     <DataTable />
 *   </PageSection>
 * </PageTransition>
 * ```
 */
export function PageSection({ children, className, variants, as = 'div' }: PageSectionProps) {
  const { shouldAnimate } = useAnimationSettings()
  const MotionComponent = motionComponents[as]

  return (
    <MotionComponent
      variants={shouldAnimate ? variants || fadeInUp : reducedMotionVariants}
      className={className}
    >
      {children}
    </MotionComponent>
  )
}

/**
 * Staggered List Container
 *
 * For lists of items that should animate in sequence.
 * Use with StaggeredItem children.
 *
 * @example
 * ```tsx
 * <StaggeredList>
 *   {items.map(item => (
 *     <StaggeredItem key={item.id}>
 *       <Card>{item.name}</Card>
 *     </StaggeredItem>
 *   ))}
 * </StaggeredList>
 * ```
 */
export function StaggeredList({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const { shouldAnimate } = useAnimationSettings()

  const containerVariants: Variants = React.useMemo(() => {
    if (!shouldAnimate) return reducedMotionVariants

    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          delay,
          staggerChildren: 0.04,
          delayChildren: delay,
        },
      },
    }
  }, [shouldAnimate, delay])

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Staggered Item
 *
 * Individual item within a StaggeredList.
 */
export function StaggeredItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { shouldAnimate } = useAnimationSettings()

  const itemVariants: Variants = shouldAnimate
    ? {
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.2, ease: [0, 0, 0.2, 1] },
        },
      }
    : reducedMotionVariants

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  )
}
