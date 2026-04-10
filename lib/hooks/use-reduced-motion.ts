/**
 * Reduced Motion Hook for Accessibility
 *
 * @description Detects user's motion preference and provides animation settings
 * Supports WCAG 2.1 Success Criterion 2.3.3 (Animation from Interactions)
 *
 * @author Maurice Rondeau
 */

'use client'

import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'
import { useMemo } from 'react'
import {
  reducedMotionVariants,
  fadeInUp,
  fadeInScale,
  staggerContainer,
  dialogVariants,
  slideInRight,
  type Variants,
} from '@/lib/animations/motion-variants'

/**
 * Animation settings based on user's motion preference
 */
export interface AnimationSettings {
  /** Whether animations should be enabled */
  shouldAnimate: boolean
  /** Whether user prefers reduced motion */
  prefersReducedMotion: boolean
  /** Duration multiplier (0.01 for reduced, 1 for normal) */
  durationMultiplier: number
  /** Get appropriate variants based on motion preference */
  getVariants: (normalVariants: Variants) => Variants
}

/**
 * Hook to determine animation settings based on user's motion preference
 *
 * @example
 * ```tsx
 * function AnimatedCard() {
 *   const { shouldAnimate, getVariants } = useAnimationSettings()
 *
 *   return (
 *     <motion.div
 *       variants={getVariants(fadeInUp)}
 *       initial="hidden"
 *       animate="visible"
 *     >
 *       Content
 *     </motion.div>
 *   )
 * }
 * ```
 */
export function useAnimationSettings(): AnimationSettings {
  const prefersReducedMotion = useFramerReducedMotion()

  return useMemo(() => {
    const shouldAnimate = !prefersReducedMotion

    return {
      shouldAnimate,
      prefersReducedMotion: !!prefersReducedMotion,
      durationMultiplier: shouldAnimate ? 1 : 0.01,
      getVariants: (normalVariants: Variants) =>
        shouldAnimate ? normalVariants : reducedMotionVariants,
    }
  }, [prefersReducedMotion])
}

/**
 * Preset animation variants that automatically respect reduced motion
 *
 * @example
 * ```tsx
 * function PageSection() {
 *   const variants = usePresetVariants()
 *
 *   return (
 *     <motion.section
 *       variants={variants.staggerContainer}
 *       initial="hidden"
 *       animate="visible"
 *     >
 *       <motion.div variants={variants.fadeInUp}>Card 1</motion.div>
 *       <motion.div variants={variants.fadeInUp}>Card 2</motion.div>
 *     </motion.section>
 *   )
 * }
 * ```
 */
export function usePresetVariants() {
  const { getVariants } = useAnimationSettings()

  return useMemo(
    () => ({
      fadeInUp: getVariants(fadeInUp),
      fadeInScale: getVariants(fadeInScale),
      staggerContainer: getVariants(staggerContainer),
      dialogVariants: getVariants(dialogVariants),
      slideInRight: getVariants(slideInRight),
    }),
    [getVariants]
  )
}

/**
 * Hook to get transition props based on motion preference
 *
 * @example
 * ```tsx
 * function Button() {
 *   const transition = useAnimationTransition()
 *
 *   return (
 *     <motion.button
 *       whileHover={{ scale: 1.02 }}
 *       whileTap={{ scale: 0.98 }}
 *       transition={transition.spring}
 *     >
 *       Click me
 *     </motion.button>
 *   )
 * }
 * ```
 */
export function useAnimationTransition() {
  const { shouldAnimate } = useAnimationSettings()

  return useMemo(() => {
    if (!shouldAnimate) {
      return {
        instant: { duration: 0.01 },
        spring: { duration: 0.01 },
        normal: { duration: 0.01 },
      }
    }

    return {
      instant: { duration: 0.1 },
      spring: { type: 'spring', stiffness: 400, damping: 25 },
      normal: { duration: 0.2, ease: [0.0, 0.0, 0.2, 1] },
    }
  }, [shouldAnimate])
}

/**
 * Re-export the raw framer-motion hook for direct access
 */
export { useFramerReducedMotion as useReducedMotion }
