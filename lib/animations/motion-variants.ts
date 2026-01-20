/**
 * Centralized Animation Presets for Fleet Management System
 *
 * @description Framer Motion animation variants following Linear/Notion design patterns
 * All animations are designed to be subtle, professional, and respect reduced motion preferences
 *
 * @author Maurice Rondeau
 */

import type { Variants as FramerVariants, Transition } from 'framer-motion'

// Re-export Variants type for use in other modules
export type Variants = FramerVariants

// ============================================================================
// TIMING & EASING CONSTANTS
// ============================================================================

/**
 * Standard easing curves matching the design system
 * - easeOut: Natural deceleration for entries
 * - easeInOut: Smooth for state transitions
 * - spring: Bouncy, organic feel for interactive elements
 */
export const EASING = {
  easeOut: [0.0, 0.0, 0.2, 1] as const,
  easeInOut: [0.4, 0.0, 0.2, 1] as const,
  spring: { type: 'spring', stiffness: 400, damping: 25 } as const,
  gentleSpring: { type: 'spring', stiffness: 300, damping: 30 } as const,
} as const

/**
 * Standard durations matching CSS variables in globals.css
 * --transition-fast: 150ms
 * --transition-normal: 200ms
 * --transition-slow: 300ms
 */
export const DURATION = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  enter: 0.25,
  exit: 0.15,
} as const

// ============================================================================
// FADE VARIANTS
// ============================================================================

/**
 * Simple fade in/out - most basic animation
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.normal, ease: EASING.easeOut },
  },
  exit: { opacity: 0, transition: { duration: DURATION.exit } },
}

/**
 * Fade in with upward movement - primary page/section entrance
 */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.enter, ease: EASING.easeOut },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: DURATION.exit },
  },
}

/**
 * Fade in from below with scale - for modals/dialogs
 */
export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { ...EASING.spring },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: DURATION.exit },
  },
}

/**
 * Slide in from right - for side panels, toasts
 */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.enter, ease: EASING.easeOut },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: DURATION.exit },
  },
}

/**
 * Slide in from left - for navigation panels
 */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.enter, ease: EASING.easeOut },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: DURATION.exit },
  },
}

/**
 * Slide in from top - for dropdown menus, mobile toasts
 */
export const slideInDown: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.fast, ease: EASING.easeOut },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: DURATION.exit },
  },
}

// ============================================================================
// CONTAINER VARIANTS (For staggered children)
// ============================================================================

/**
 * Stagger container - wraps children that should animate in sequence
 * Use with children that have fadeInUp or similar variants
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
}

/**
 * Slower stagger for larger lists (grids, tables)
 */
export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

/**
 * Child item for stagger containers - simple fade up
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASING.easeOut },
  },
}

// ============================================================================
// INTERACTIVE HOVER/TAP VARIANTS
// ============================================================================

/**
 * Card hover effect - subtle lift with shadow (used in CSS too)
 * Apply to cards, clickable panels
 */
export const cardHover = {
  y: -4,
  scale: 1.01,
  transition: EASING.spring,
}

/**
 * Button/interactive element tap feedback
 */
export const buttonTap = {
  scale: 0.98,
  transition: { duration: 0.1 },
}

/**
 * Subtle hover for table rows, list items
 */
export const rowHover = {
  backgroundColor: 'var(--color-muted)',
  transition: { duration: DURATION.fast },
}

/**
 * Icon button hover - scale up slightly
 */
export const iconButtonHover = {
  scale: 1.05,
  transition: EASING.spring,
}

// ============================================================================
// STATUS/FEEDBACK ANIMATIONS
// ============================================================================

/**
 * Success pulse animation (use with CSS keyframe fallback)
 */
export const successPulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.4, times: [0, 0.5, 1] },
  },
}

/**
 * Error shake animation
 */
export const errorShake: Variants = {
  initial: { x: 0 },
  animate: {
    x: [-4, 4, -4, 4, 0],
    transition: { duration: 0.4, times: [0, 0.25, 0.5, 0.75, 1] },
  },
}

/**
 * Loading pulse - subtle opacity change
 */
export const loadingPulse: Variants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },
}

// ============================================================================
// MODAL/DIALOG VARIANTS
// ============================================================================

/**
 * Dialog/modal overlay backdrop
 */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.fast },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.exit, delay: 0.05 },
  },
}

/**
 * Dialog content with spring physics
 */
export const dialogVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: EASING.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 5,
    transition: { duration: DURATION.exit },
  },
}

// ============================================================================
// LIST/TABLE VARIANTS
// ============================================================================

/**
 * List container for animated list items
 */
export const listContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      staggerChildren: 0.04,
    },
  },
}

/**
 * Individual list item
 */
export const listItem: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.fast },
  },
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a delayed version of any variant
 */
export function withDelay<T extends Variants>(variants: T, delay: number): Variants {
  return {
    ...variants,
    visible: {
      ...(typeof variants.visible === 'object' ? variants.visible : {}),
      transition: {
        ...(typeof variants.visible === 'object' && 'transition' in variants.visible
          ? (variants.visible.transition as Transition)
          : {}),
        delay,
      },
    },
  }
}

/**
 * Creates variants with custom duration
 */
export function withDuration<T extends Variants>(variants: T, duration: number): Variants {
  return {
    ...variants,
    visible: {
      ...(typeof variants.visible === 'object' ? variants.visible : {}),
      transition: {
        ...(typeof variants.visible === 'object' && 'transition' in variants.visible
          ? (variants.visible.transition as Transition)
          : {}),
        duration,
      },
    },
  }
}

/**
 * Returns empty variants for reduced motion
 * Use with useReducedMotion hook
 */
export const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
  exit: { opacity: 0, transition: { duration: 0.01 } },
}
