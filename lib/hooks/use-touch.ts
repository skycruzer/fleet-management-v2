/**
 * Touch Interaction Hooks
 * Reusable hooks for touch-optimized interactions
 */

import { useRef, useCallback, useEffect } from 'react'

interface SwipeConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number // Minimum distance for swipe (default: 50px)
  preventDefaultTouchmoveEvent?: boolean
}

/**
 * useSwipe Hook
 * Detect swipe gestures in all directions
 */
export function useSwipe(config: SwipeConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouchmoveEvent = false,
  } = config

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndX = useRef(0)
  const touchEndY = useRef(0)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (preventDefaultTouchmoveEvent) {
        e.preventDefault()
      }
      touchEndX.current = e.touches[0].clientX
      touchEndY.current = e.touches[0].clientY
    },
    [preventDefaultTouchmoveEvent]
  )

  const handleTouchEnd = useCallback(() => {
    const diffX = touchStartX.current - touchEndX.current
    const diffY = touchStartY.current - touchEndY.current

    const absX = Math.abs(diffX)
    const absY = Math.abs(diffY)

    // Horizontal swipe
    if (absX > absY && absX > threshold) {
      if (diffX > 0) {
        onSwipeLeft?.()
      } else {
        onSwipeRight?.()
      }
    }
    // Vertical swipe
    else if (absY > threshold) {
      if (diffY > 0) {
        onSwipeUp?.()
      } else {
        onSwipeDown?.()
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }
}

interface LongPressConfig {
  onLongPress: () => void
  delay?: number // Milliseconds to hold (default: 500ms)
  onPressStart?: () => void
  onPressEnd?: () => void
}

/**
 * useLongPress Hook
 * Detect long press gestures
 */
export function useLongPress(config: LongPressConfig) {
  const { onLongPress, delay = 500, onPressStart, onPressEnd } = config
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isPressed = useRef(false)

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault()
      isPressed.current = true
      onPressStart?.()

      timerRef.current = setTimeout(() => {
        if (isPressed.current) {
          onLongPress()
        }
      }, delay)
    },
    [onLongPress, delay, onPressStart]
  )

  const stop = useCallback(() => {
    isPressed.current = false
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    onPressEnd?.()
  }, [onPressEnd])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  }
}

interface DoubleTapConfig {
  onDoubleTap: () => void
  delay?: number // Max time between taps (default: 300ms)
}

/**
 * useDoubleTap Hook
 * Detect double tap gestures
 */
export function useDoubleTap(config: DoubleTapConfig) {
  const { onDoubleTap, delay = 300 } = config
  const lastTapRef = useRef(0)

  const handleTap = useCallback(() => {
    const now = Date.now()
    const timeSinceLastTap = now - lastTapRef.current

    if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
      onDoubleTap()
      lastTapRef.current = 0
    } else {
      lastTapRef.current = now
    }
  }, [onDoubleTap, delay])

  return {
    onTouchEnd: handleTap,
    onClick: handleTap,
  }
}

interface PinchZoomConfig {
  onPinchZoom: (scale: number) => void
  minScale?: number
  maxScale?: number
}

/**
 * usePinchZoom Hook
 * Detect pinch-to-zoom gestures
 */
export function usePinchZoom(config: PinchZoomConfig) {
  const { onPinchZoom, minScale = 0.5, maxScale = 3 } = config
  const initialDistanceRef = useRef(0)
  const currentScaleRef = useRef(1)

  const getDistance = (touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      initialDistanceRef.current = getDistance(e.touches)
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const currentDistance = getDistance(e.touches)
        const scale = currentDistance / initialDistanceRef.current
        const newScale = Math.min(Math.max(scale * currentScaleRef.current, minScale), maxScale)
        onPinchZoom(newScale)
      }
    },
    [onPinchZoom, minScale, maxScale]
  )

  const handleTouchEnd = useCallback(() => {
    initialDistanceRef.current = 0
  }, [])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }
}

/**
 * useTouchFeedback Hook
 * Add visual/haptic feedback for touch interactions
 */
export function useTouchFeedback() {
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 50
      navigator.vibrate(duration)
    }
  }, [])

  const addRipple = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement
    const ripple = document.createElement('span')
    const rect = target.getBoundingClientRect()

    const x = (e as React.TouchEvent).touches
      ? (e as React.TouchEvent).touches[0].clientX - rect.left
      : (e as React.MouseEvent).clientX - rect.left

    const y = (e as React.TouchEvent).touches
      ? (e as React.TouchEvent).touches[0].clientY - rect.top
      : (e as React.MouseEvent).clientY - rect.top

    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      pointer-events: none;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      left: ${x}px;
      top: ${y}px;
      width: 1px;
      height: 1px;
    `

    target.style.position = 'relative'
    target.style.overflow = 'hidden'
    target.appendChild(ripple)

    setTimeout(() => ripple.remove(), 600)
  }, [])

  return {
    triggerHaptic,
    addRipple,
  }
}

/**
 * usePreventPullToRefresh Hook
 * Prevent pull-to-refresh on mobile browsers
 */
export function usePreventPullToRefresh(elementRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    let startY = 0

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY
      const diff = currentY - startY

      // Prevent pull-to-refresh if scrolling down at the top
      if (diff > 0 && element.scrollTop === 0) {
        e.preventDefault()
      }
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
    }
  }, [elementRef])
}
