'use client'

/**
 * InlineAlert Component
 *
 * A compact inline alert for use within forms and cards.
 * Supports success, warning, error, and info variants using CSS variable tokens.
 */

import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type InlineAlertVariant = 'success' | 'warning' | 'error' | 'info'

interface InlineAlertProps {
  variant: InlineAlertVariant
  message: string
  className?: string
}

const VARIANT_STYLES: Record<
  InlineAlertVariant,
  { border: string; bg: string; text: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  success: {
    border: 'border-[var(--color-success-500)]/20',
    bg: 'bg-[var(--color-success-muted)]',
    text: 'text-[var(--color-success-600)]',
    Icon: CheckCircle2,
  },
  warning: {
    border: 'border-[var(--color-warning-500)]/20',
    bg: 'bg-[var(--color-warning-muted)]',
    text: 'text-[var(--color-warning-400)]',
    Icon: AlertTriangle,
  },
  error: {
    border: 'border-[var(--color-danger-500)]/20',
    bg: 'bg-[var(--color-destructive-muted)]',
    text: 'text-[var(--color-danger-600)]',
    Icon: AlertCircle,
  },
  info: {
    border: 'border-[var(--color-info-border)]',
    bg: 'bg-[var(--color-info-bg)]',
    text: 'text-[var(--color-info)]',
    Icon: Info,
  },
}

export function InlineAlert({ variant, message, className }: InlineAlertProps) {
  const { border, bg, text, Icon } = VARIANT_STYLES[variant]

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border p-3 text-sm',
        border,
        bg,
        text,
        className
      )}
      role="alert"
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
