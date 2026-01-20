/**
 * Animated Section Component
 *
 * @description Section wrapper with intersection observer for scroll-triggered animations
 * Automatically handles reduced motion preferences
 *
 * @author Maurice Rondeau
 */

'use client'

import * as React from 'react'
import { motion, useInView, type Variants } from 'framer-motion'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import { reducedMotionVariants, EASING, DURATION } from '@/lib/animations'
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

type AnimatedElement = keyof typeof motionComponents

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  /** Custom animation variants */
  variants?: Variants
  /** Render as a different HTML element */
  as?: AnimatedElement
  /** How much of the element should be visible before triggering (0-1) */
  threshold?: number
  /** Only animate once when entering view */
  once?: boolean
  /** Additional margin around the trigger area */
  rootMargin?: string
  /** Delay before animation starts (seconds) */
  delay?: number
}

/**
 * Animated Section
 *
 * A section that animates when it enters the viewport.
 * Uses IntersectionObserver for efficient scroll-triggered animations.
 *
 * @example
 * ```tsx
 * <AnimatedSection>
 *   <h2>Section Title</h2>
 *   <p>Content that fades in when scrolled into view</p>
 * </AnimatedSection>
 *
 * // With custom options
 * <AnimatedSection
 *   as="section"
 *   threshold={0.3}
 *   delay={0.2}
 *   once
 * >
 *   <FeatureGrid />
 * </AnimatedSection>
 * ```
 */
export function AnimatedSection({
  children,
  className,
  variants,
  as = 'div',
  threshold = 0.1,
  once = true,
  rootMargin = '-50px',
  delay = 0,
}: AnimatedSectionProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const { shouldAnimate } = useAnimationSettings()

  const isInView = useInView(ref, {
    amount: threshold,
    once,
    margin: rootMargin as `${number}px`,
  })

  const MotionComponent = motionComponents[as]

  const sectionVariants: Variants = React.useMemo(() => {
    if (!shouldAnimate) return reducedMotionVariants

    return (
      variants || {
        hidden: { opacity: 0, y: 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: DURATION.enter,
            ease: EASING.easeOut,
            delay,
          },
        },
      }
    )
  }, [shouldAnimate, variants, delay])

  return (
    <MotionComponent
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={sectionVariants}
      className={className}
    >
      {children}
    </MotionComponent>
  )
}

interface AnimatedCardGridProps {
  children: React.ReactNode
  className?: string
  /** Stagger delay between cards (seconds) */
  staggerDelay?: number
  /** Only animate once */
  once?: boolean
}

/**
 * Animated Card Grid
 *
 * A grid container that staggers the animation of its children when in view.
 * Perfect for card grids, feature lists, etc.
 *
 * @example
 * ```tsx
 * <AnimatedCardGrid>
 *   <Card>Card 1</Card>
 *   <Card>Card 2</Card>
 *   <Card>Card 3</Card>
 * </AnimatedCardGrid>
 * ```
 */
export function AnimatedCardGrid({
  children,
  className,
  staggerDelay = 0.05,
  once = true,
}: AnimatedCardGridProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const { shouldAnimate } = useAnimationSettings()
  const isInView = useInView(ref, { amount: 0.1, once })

  const containerVariants: Variants = React.useMemo(() => {
    if (!shouldAnimate) return reducedMotionVariants

    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: 0.1,
        },
      },
    }
  }, [shouldAnimate, staggerDelay])

  const itemVariants: Variants = React.useMemo(() => {
    if (!shouldAnimate) return reducedMotionVariants

    return {
      hidden: { opacity: 0, y: 16, scale: 0.98 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: DURATION.enter,
          ease: EASING.easeOut,
        },
      },
    }
  }, [shouldAnimate])

  // Wrap children with motion.div for animation
  const animatedChildren = React.Children.map(children, (child, index) => (
    <motion.div key={index} variants={itemVariants}>
      {child}
    </motion.div>
  ))

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
      className={className}
    >
      {animatedChildren}
    </motion.div>
  )
}

interface FadeInProps {
  children: React.ReactNode
  className?: string
  /** Animation direction */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  /** Distance to travel (pixels) */
  distance?: number
  /** Animation duration (seconds) */
  duration?: number
  /** Animation delay (seconds) */
  delay?: number
  /** Only animate once */
  once?: boolean
}

/**
 * Simple Fade In
 *
 * A lightweight component for simple fade-in effects.
 *
 * @example
 * ```tsx
 * <FadeIn direction="up" delay={0.2}>
 *   <Card>Content</Card>
 * </FadeIn>
 * ```
 */
export function FadeIn({
  children,
  className,
  direction = 'up',
  distance = 20,
  duration = DURATION.enter,
  delay = 0,
  once = true,
}: FadeInProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const { shouldAnimate } = useAnimationSettings()
  const isInView = useInView(ref, { amount: 0.1, once })

  const getInitialPosition = () => {
    if (!shouldAnimate) return {}
    switch (direction) {
      case 'up':
        return { y: distance }
      case 'down':
        return { y: -distance }
      case 'left':
        return { x: distance }
      case 'right':
        return { x: -distance }
      default:
        return {}
    }
  }

  const variants: Variants = shouldAnimate
    ? {
        hidden: { opacity: 0, ...getInitialPosition() },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: {
            duration,
            delay,
            ease: EASING.easeOut,
          },
        },
      }
    : reducedMotionVariants

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  )
}
