'use client'

import { motion, type Variants } from 'framer-motion'

/**
 * Client Component Wrapper for Profile Page Animations
 *
 * This component handles framer-motion animations for the profile page.
 * It's separated as a client component to keep the main page as a Server Component,
 * which improves performance by reducing the client bundle size.
 *
 * PERFORMANCE BENEFITS:
 * - Server Component fetches data on server (no loading state)
 * - Only animation logic runs on client
 * - Smaller client bundle (no useState, useEffect, fetch logic)
 */

interface ProfileAnimationWrapperProps {
  children: React.ReactNode
}

// Animation variants
const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1], // cubic-bezier easing curve
    },
  },
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export function ProfileAnimationWrapper({ children }: ProfileAnimationWrapperProps) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="w-full">
      <motion.div variants={fadeIn}>{children}</motion.div>
    </motion.div>
  )
}
