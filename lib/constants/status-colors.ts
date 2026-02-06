/**
 * Status Colors Constant
 * Author: Maurice Rondeau
 *
 * Single source of truth for semantic status color classes.
 * All components should reference these instead of raw Tailwind color classes.
 * Maps to CSS variables defined in globals.css @theme block.
 */

export const STATUS_COLORS = {
  success: {
    text: 'text-[var(--color-success-500)]',
    bg: 'bg-[var(--color-success-muted)]',
    border: 'border-[var(--color-status-low-border)]',
  },
  warning: {
    text: 'text-[var(--color-warning-500)]',
    bg: 'bg-[var(--color-warning-muted)]',
    border: 'border-[var(--color-status-medium-border)]',
  },
  danger: {
    text: 'text-[var(--color-danger-500)]',
    bg: 'bg-[var(--color-destructive-muted)]',
    border: 'border-[var(--color-status-high-border)]',
  },
  info: {
    text: 'text-[var(--color-info)]',
    bg: 'bg-[var(--color-info-bg)]',
    border: 'border-[var(--color-info-border)]',
  },
  neutral: {
    text: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-border',
  },
} as const

export type StatusColorKey = keyof typeof STATUS_COLORS
