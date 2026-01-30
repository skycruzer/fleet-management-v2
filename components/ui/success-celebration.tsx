/**
 * Success Celebration Component
 * Developer: Maurice Rondeau
 * Micro-interaction animations for successful form submissions and key moments
 */

'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Plane } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'

interface SuccessCelebrationProps {
  isVisible: boolean
  message?: string
  variant?: 'checkmark' | 'confetti' | 'plane'
  onComplete?: () => void
  className?: string
}

// Confetti particle component
function ConfettiParticle({
  color,
  delay,
  x,
  y,
  isRound,
}: {
  color: string
  delay: number
  x: number
  y: number
  isRound: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }}
      animate={{
        opacity: 0,
        y: [0, -20, 100],
        x: [0, x, x * 1.5],
        rotate: [0, 180, 720],
        scale: [1, 1.2, 0.5],
      }}
      transition={{
        duration: 1.2,
        delay,
        ease: 'easeOut',
      }}
      className="absolute"
      style={{
        width: '8px',
        height: '8px',
        borderRadius: isRound ? '50%' : '2px',
        backgroundColor: color,
      }}
    />
  )
}

// Flying plane animation
function FlyingPlane() {
  return (
    <motion.div
      initial={{ x: -100, y: 20, opacity: 0, rotate: -10 }}
      animate={{
        x: [null, 0, 100],
        y: [null, -10, 20],
        opacity: [0, 1, 1, 0],
        rotate: [-10, -5, 10],
      }}
      transition={{
        duration: 1.5,
        ease: 'easeInOut',
      }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <Plane className="text-primary h-8 w-8" />
    </motion.div>
  )
}

// Confetti colors matching the design system
const confettiColors = [
  '#3b82f6', // primary
  '#06b6d4', // accent
  '#10b981', // success
  '#fbbf24', // warning/gold
  '#f472b6', // pink
  '#a78bfa', // purple
]

// Pre-generate confetti particle data (stable across renders)
function generateConfettiData() {
  return confettiColors.flatMap((color, colorIndex) =>
    Array.from({ length: 8 }).map((_, i) => ({
      key: `${colorIndex}-${i}`,
      color,
      delay: Math.random() * 0.3,
      x: (Math.random() - 0.5) * 200,
      y: Math.random() * 50,
      isRound: Math.random() > 0.5,
    }))
  )
}

export function SuccessCelebration({
  isVisible,
  message = 'Success!',
  variant = 'checkmark',
  onComplete,
  className,
}: SuccessCelebrationProps) {
  const { shouldAnimate } = useAnimationSettings()

  // Pre-compute confetti data once when component mounts
  const confettiParticles = React.useMemo(() => generateConfettiData(), [])

  React.useEffect(() => {
    if (isVisible && onComplete) {
      const timer = setTimeout(
        () => {
          onComplete()
        },
        variant === 'confetti' ? 2000 : 1500
      )
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isVisible, onComplete, variant])

  // Don't animate if reduced motion is preferred
  if (!shouldAnimate) {
    return (
      <AnimatePresence>
        {isVisible && (
          <div
            className={cn(
              'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm',
              className
            )}
          >
            <div className="bg-card rounded-xl p-8 text-center shadow-2xl">
              <div className="bg-success/20 text-success mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <Check className="h-8 w-8" />
              </div>
              <p className="font-display text-lg font-semibold">{message}</p>
            </div>
          </div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm',
            className
          )}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-card relative rounded-xl border border-white/10 p-8 text-center shadow-2xl"
          >
            {/* Confetti variant */}
            {variant === 'confetti' && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                {confettiParticles.map((particle) => (
                  <ConfettiParticle
                    key={particle.key}
                    color={particle.color}
                    delay={particle.delay}
                    x={particle.x}
                    y={particle.y}
                    isRound={particle.isRound}
                  />
                ))}
              </div>
            )}

            {/* Plane variant */}
            {variant === 'plane' && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                <FlyingPlane />
              </div>
            )}

            {/* Success checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.1,
              }}
              className="relative z-10"
            >
              {/* Pulse ring */}
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="bg-success/30 absolute inset-0 mx-auto flex h-16 w-16 items-center justify-center rounded-full"
              />

              <div className="bg-success/20 text-success relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <motion.div
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <Check className="h-8 w-8" strokeWidth={3} />
                </motion.div>
              </div>
            </motion.div>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display relative z-10 text-lg font-semibold"
            >
              {message}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Hook for managing success celebration state
 */
export function useSuccessCelebration() {
  const [isVisible, setIsVisible] = React.useState(false)
  const [message, setMessage] = React.useState('Success!')
  const [variant, setVariant] = React.useState<'checkmark' | 'confetti' | 'plane'>('checkmark')

  const celebrate = React.useCallback(
    (options?: {
      message?: string
      variant?: 'checkmark' | 'confetti' | 'plane'
      duration?: number
    }) => {
      setMessage(options?.message || 'Success!')
      setVariant(options?.variant || 'checkmark')
      setIsVisible(true)

      const duration = options?.duration || (options?.variant === 'confetti' ? 2000 : 1500)
      setTimeout(() => {
        setIsVisible(false)
      }, duration)
    },
    []
  )

  const hide = React.useCallback(() => {
    setIsVisible(false)
  }, [])

  return {
    isVisible,
    message,
    variant,
    celebrate,
    hide,
  }
}

/**
 * Inline success indicator for forms and buttons
 */
export function InlineSuccess({
  isVisible,
  message = 'Saved',
  className,
}: {
  isVisible: boolean
  message?: string
  className?: string
}) {
  const { shouldAnimate } = useAnimationSettings()

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0, x: -10 } : { opacity: 1 }}
          animate={{ opacity: 1, x: 0 }}
          exit={shouldAnimate ? { opacity: 0, x: 10 } : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn('text-success flex items-center gap-1.5 text-sm', className)}
        >
          <motion.div
            initial={shouldAnimate ? { scale: 0 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Check className="h-4 w-4" />
          </motion.div>
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Loading plane animation for contextual loading states
 */
export function LoadingPlane({ className }: { className?: string }) {
  const { shouldAnimate } = useAnimationSettings()

  if (!shouldAnimate) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <Plane className="text-primary h-6 w-6" />
      </div>
    )
  }

  return (
    <div className={cn('relative h-8 overflow-hidden', className)}>
      <motion.div
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-y-0 flex items-center"
      >
        <Plane className="text-primary h-6 w-6" />
      </motion.div>
      {/* Contrail */}
      <motion.div
        animate={{
          x: ['-120%', '80%'],
          opacity: [0, 0.3, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-y-0 flex items-center"
      >
        <div className="via-primary/30 h-0.5 w-16 bg-gradient-to-r from-transparent to-transparent" />
      </motion.div>
    </div>
  )
}
