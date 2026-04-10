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

/**
 * Badge color tokens for colored badge variants.
 * Maps to --color-badge-* CSS variables in globals.css.
 */
export const BADGE_COLORS = {
  blue: {
    text: 'text-[var(--color-badge-blue)]',
    bg: 'bg-[var(--color-badge-blue-bg)]',
    border: 'border-[var(--color-badge-blue-border)]',
  },
  purple: {
    text: 'text-[var(--color-badge-purple)]',
    bg: 'bg-[var(--color-badge-purple-bg)]',
    border: 'border-[var(--color-badge-purple-border)]',
  },
  pink: {
    text: 'text-[var(--color-badge-pink)]',
    bg: 'bg-[var(--color-badge-pink-bg)]',
    border: 'border-[var(--color-badge-pink-border)]',
  },
  cyan: {
    text: 'text-[var(--color-badge-cyan)]',
    bg: 'bg-[var(--color-badge-cyan-bg)]',
    border: 'border-[var(--color-badge-cyan-border)]',
  },
  indigo: {
    text: 'text-[var(--color-badge-indigo)]',
    bg: 'bg-[var(--color-badge-indigo-bg)]',
    border: 'border-[var(--color-badge-indigo-border)]',
  },
  orange: {
    text: 'text-[var(--color-badge-orange)]',
    bg: 'bg-[var(--color-badge-orange-bg)]',
    border: 'border-[var(--color-badge-orange-border)]',
  },
} as const

export type BadgeColorKey = keyof typeof BADGE_COLORS

/**
 * Category color tokens for training/certification categories.
 * Maps to --color-category-* CSS variables in globals.css.
 */
export const CATEGORY_COLORS = {
  flight: {
    text: 'text-[var(--color-category-flight)]',
    bg: 'bg-[var(--color-category-flight-bg)]',
    border: 'border-[var(--color-category-flight-border)]',
  },
  simulator: {
    text: 'text-[var(--color-category-simulator)]',
    bg: 'bg-[var(--color-category-simulator-bg)]',
    border: 'border-[var(--color-category-simulator-border)]',
  },
  ground: {
    text: 'text-[var(--color-category-ground)]',
    bg: 'bg-[var(--color-category-ground-bg)]',
    border: 'border-[var(--color-category-ground-border)]',
  },
  medical: {
    text: 'text-[var(--color-category-medical)]',
    bg: 'bg-[var(--color-category-medical-bg)]',
    border: 'border-[var(--color-category-medical-border)]',
  },
} as const

export type CategoryColorKey = keyof typeof CATEGORY_COLORS

/**
 * Priority color tokens for priority levels.
 * Reuses status/danger tokens for semantic consistency.
 */
export const PRIORITY_COLORS = {
  low: {
    text: 'text-[var(--color-success-500)]',
    bg: 'bg-[var(--color-success-muted)]',
    border: 'border-[var(--color-status-low-border)]',
  },
  medium: {
    text: 'text-[var(--color-warning-500)]',
    bg: 'bg-[var(--color-warning-muted)]',
    border: 'border-[var(--color-status-medium-border)]',
  },
  high: {
    text: 'text-[var(--color-danger-500)]',
    bg: 'bg-[var(--color-destructive-muted)]',
    border: 'border-[var(--color-status-high-border)]',
  },
  critical: {
    text: 'text-[var(--color-danger-600)]',
    bg: 'bg-[var(--color-danger-600)]',
    border: 'border-[var(--color-status-high-border)]',
  },
} as const

export type PriorityColorKey = keyof typeof PRIORITY_COLORS

/**
 * Portal accent color tokens for pilot portal differentiation.
 * Maps to --color-portal-accent-* CSS variables in globals.css.
 */
export const PORTAL_COLORS = {
  accent: {
    text: 'text-[var(--color-portal-accent)]',
    bg: 'bg-[var(--color-portal-accent)]',
    border: 'border-[var(--color-portal-accent)]',
  },
} as const
