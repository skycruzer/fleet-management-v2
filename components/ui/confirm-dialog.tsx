/**
 * Confirm Dialog Component
 * Reusable confirmation dialog for destructive actions
 * Provides consistent UX across the application
 */

'use client'

import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  /** Trigger button element */
  trigger: React.ReactNode
  /** Dialog title */
  title: string
  /** Dialog description/message */
  description: string
  /** Confirm button text */
  confirmText?: string
  /** Cancel button text */
  cancelText?: string
  /** Callback when user confirms */
  onConfirm: () => void | Promise<void>
  /** Whether the action is destructive (red button) */
  variant?: 'destructive' | 'default'
  /** Whether the dialog is open (controlled) */
  open?: boolean
  /** Callback when open state changes (controlled) */
  onOpenChange?: (open: boolean) => void
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'destructive',
  open,
  onOpenChange,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      await onConfirm()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {variant === 'destructive' && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
              </div>
            )}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {isLoading ? 'Processing...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * Simple confirmation hook
 * Returns a promise that resolves when user confirms, rejects when they cancel
 */
export function useConfirm() {
  const [state, setState] = React.useState<{
    open: boolean
    title: string
    description: string
    confirmText: string
    cancelText: string
    variant: 'destructive' | 'default'
    resolve?: (value: boolean) => void
  }>({
    open: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'destructive',
  })

  const confirm = React.useCallback(
    (options: {
      title: string
      description: string
      confirmText?: string
      cancelText?: string
      variant?: 'destructive' | 'default'
    }) => {
      return new Promise<boolean>((resolve) => {
        setState({
          open: true,
          title: options.title,
          description: options.description,
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          variant: options.variant || 'destructive',
          resolve,
        })
      })
    },
    []
  )

  const handleConfirm = React.useCallback(() => {
    state.resolve?.(true)
    setState((prev) => ({ ...prev, open: false }))
  }, [state.resolve])

  const handleCancel = React.useCallback(() => {
    state.resolve?.(false)
    setState((prev) => ({ ...prev, open: false }))
  }, [state.resolve])

  const ConfirmDialogComponent = React.useCallback(
    () => (
      <AlertDialog open={state.open} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              {state.variant === 'destructive' && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
                </div>
              )}
              <AlertDialogTitle>{state.title}</AlertDialogTitle>
            </div>
            <AlertDialogDescription>{state.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>{state.cancelText}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                state.variant === 'destructive'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {state.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    [state, handleConfirm, handleCancel]
  )

  return { confirm, ConfirmDialog: ConfirmDialogComponent }
}
