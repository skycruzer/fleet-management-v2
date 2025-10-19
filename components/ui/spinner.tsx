/**
 * Spinner Component
 * Reusable loading spinner with customizable size and color
 */

import { cn } from '@/lib/utils'

interface SpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Color variant */
  variant?: 'primary' | 'white' | 'gray'
  /** Additional CSS classes */
  className?: string
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

const variantMap = {
  primary: 'border-blue-600',
  white: 'border-white',
  gray: 'border-gray-600',
}

export function Spinner({ size = 'md', variant = 'primary', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
        sizeMap[size],
        variantMap[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * Centered Spinner Component
 * Displays a spinner centered in a container with optional text
 */
interface CenteredSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Optional loading text */
  text?: string
  /** Minimum height for the container */
  minHeight?: string
}

export function CenteredSpinner({ size = 'lg', text, minHeight = '200px' }: CenteredSpinnerProps) {
  return (
    <div
      className="flex flex-col items-center justify-center space-y-4"
      style={{ minHeight }}
    >
      <Spinner size={size} variant="primary" />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  )
}

/**
 * Inline Spinner Component
 * Small spinner for inline loading states
 */
export function InlineSpinner({ className }: { className?: string }) {
  return (
    <Spinner
      size="sm"
      variant="primary"
      className={cn('inline-block', className)}
    />
  )
}

/**
 * Button Spinner Component
 * Spinner specifically designed for button loading states
 */
export function ButtonSpinner({ variant = 'white' }: { variant?: 'primary' | 'white' }) {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
