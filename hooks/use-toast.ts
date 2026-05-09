'use client'

/**
 * useToast — Sonner adapter (Plan E10 consolidation 2026-05-08).
 *
 * Previously this file ran an in-house reducer-based toast system rendered
 * by `components/ui/toaster.tsx`. The codebase has been migrating to
 * `sonner` for newer call-sites; we now have a single source of truth: this
 * hook adapts the existing `{ title, description, variant }` API onto sonner
 * so all 36 callers keep working without each being rewritten.
 *
 * Migration plan: new code SHOULD import `toast` directly from 'sonner';
 * legacy callers using `useToast()` continue to work via this shim.
 */
import * as React from 'react'
import { toast as sonnerToast } from 'sonner'
import type { ToastActionElement, ToastProps } from '@/components/ui/toast'

// Toast duration configuration based on variant (matches the legacy hook)
const TOAST_DURATIONS = {
  success: 3000,
  destructive: 7000,
  warning: 5000,
  default: 5000,
} as const

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  duration?: number
}

type Toast = Omit<ToasterToast, 'id'>

function getToastDuration(variant?: string, customDuration?: number): number {
  if (customDuration !== undefined) return customDuration
  switch (variant) {
    case 'success':
      return TOAST_DURATIONS.success
    case 'destructive':
      return TOAST_DURATIONS.destructive
    case 'warning':
      return TOAST_DURATIONS.warning
    default:
      return TOAST_DURATIONS.default
  }
}

function reactNodeToString(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  // For richer ReactNode (elements/arrays), sonner accepts ReactNode directly
  // for description; for the headline we coerce to a string. This keeps the
  // legacy callers' templates intact.
  return ''
}

function emit(props: Toast): { id: string; dismiss: () => void; update: (p: Toast) => void } {
  const variant = props.variant as string | undefined
  const duration = getToastDuration(variant, props.duration)
  const title =
    typeof props.title === 'string' || typeof props.title === 'number'
      ? String(props.title)
      : reactNodeToString(props.title) || ' '

  const sonnerOptions: Parameters<typeof sonnerToast>[1] = {
    description: props.description as React.ReactNode,
    duration,
  }

  let sonnerId: string | number
  switch (variant) {
    case 'success':
      sonnerId = sonnerToast.success(title, sonnerOptions)
      break
    case 'destructive':
      sonnerId = sonnerToast.error(title, sonnerOptions)
      break
    case 'warning':
      sonnerId = sonnerToast.warning(title, sonnerOptions)
      break
    default:
      sonnerId = sonnerToast(title, sonnerOptions)
  }

  return {
    id: String(sonnerId),
    dismiss: () => sonnerToast.dismiss(sonnerId),
    update: (next: Toast) => {
      // Sonner doesn't have an in-place update API as ergonomic as the old
      // reducer; emit a new toast and dismiss the prior one.
      sonnerToast.dismiss(sonnerId)
      emit(next)
    },
  }
}

/**
 * Hook variant — mirrors the legacy API shape so callers like
 * `const { toast } = useToast()` keep compiling.
 */
function useToast() {
  return React.useMemo(
    () => ({
      toast: emit,
      // The legacy `toasts` array and `dismiss` helpers were used only by
      // the legacy <Toaster /> renderer. Sonner renders its own `<Toaster />`,
      // so these are stubs that satisfy the type contract for any callers.
      toasts: [] as ToasterToast[],
      dismiss: (toastId?: string) => sonnerToast.dismiss(toastId),
    }),
    []
  )
}

/**
 * Standalone imperative form. Same call shape as the legacy export.
 */
function toast(props: Toast) {
  return emit(props)
}

export { useToast, toast }
