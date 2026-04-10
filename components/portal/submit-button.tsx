/**
 * Submit Button Component
 * Reusable submit button with loading state for portal forms
 * Uses the enhanced Button component with loading prop
 */

import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SubmitButtonProps {
  isSubmitting: boolean
  loadingText?: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
}

/**
 * Legacy SubmitButton - maintained for backward compatibility
 * Consider using Button with loading prop for new implementations
 */
export function SubmitButton({
  isSubmitting,
  loadingText = 'Submitting...',
  children,
  variant = 'primary',
  className = '',
}: SubmitButtonProps) {
  // Map legacy variant to Button variant
  const buttonVariant = variant === 'primary' ? 'default' : 'outline'

  return (
    <Button
      type="submit"
      variant={buttonVariant}
      loading={isSubmitting}
      loadingText={loadingText}
      size="lg"
      className={cn('px-8 py-3', className)}
    >
      {children}
    </Button>
  )
}

/**
 * Enhanced Submit Button using new Button props directly
 * Recommended for new implementations
 */
export function EnhancedSubmitButton({
  loading,
  loadingText,
  children,
  variant = 'default',
  size = 'lg',
  className,
  ...props
}: ButtonProps) {
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      loading={loading}
      loadingText={loadingText}
      className={className}
      {...props}
    >
      {children}
    </Button>
  )
}
