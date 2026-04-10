/**
 * Animated Login Shell
 * Developer: Maurice Rondeau
 *
 * Shared wrapper for login pages — provides card entrance animation
 * with fade-in + subtle scale. Respects reduced motion preferences.
 */

'use client'

import { motion } from 'framer-motion'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import { EASING, DURATION } from '@/lib/animations/motion-variants'

interface AnimatedLoginShellProps {
  children: React.ReactNode
}

export function AnimatedLoginShell({ children }: AnimatedLoginShellProps) {
  const { shouldAnimate } = useAnimationSettings()

  if (!shouldAnimate) {
    return <>{children}</>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: DURATION.slow,
        ease: EASING.easeOut,
      }}
    >
      {children}
    </motion.div>
  )
}
