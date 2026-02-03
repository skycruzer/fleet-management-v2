'use client'

import * as React from 'react'

import type { ToastActionElement, ToastProps } from '@/components/ui/toast'

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

// Toast duration configuration based on variant
const TOAST_DURATIONS = {
  success: 3000, // 3 seconds for success messages
  destructive: 7000, // 7 seconds for error messages
  warning: 5000, // 5 seconds for warnings
  default: 5000, // 5 seconds for default toasts
} as const

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  duration?: number // Optional custom duration in milliseconds
}

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType['ADD_TOAST']
      toast: ToasterToast
    }
  | {
      type: ActionType['UPDATE_TOAST']
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType['DISMISS_TOAST']
      toastId?: ToasterToast['id']
    }
  | {
      type: ActionType['REMOVE_TOAST']
      toastId?: ToasterToast['id']
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string, duration?: number) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    })
  }, duration || TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

// Helper function to get duration based on toast variant
function getToastDuration(variant?: string, customDuration?: number): number {
  if (customDuration !== undefined) {
    return customDuration
  }

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

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      }

    case 'DISMISS_TOAST': {
      const { toastId } = action

      if (toastId) {
        const toast = state.toasts.find((t) => t.id === toastId)
        addToRemoveQueue(toastId, toast?.duration)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id, toast.duration)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, 'id'>

/**
 * Toast Hook
 *
 * Custom hook for displaying toast notifications throughout the application.
 *
 * @example
 * // Basic usage
 * import { useToast } from '@/hooks/use-toast'
 *
 * function MyComponent() {
 *   const { toast } = useToast()
 *
 *   return (
 *     <button onClick={() => toast({ title: "Success!", description: "Your action completed" })}>
 *       Show Toast
 *     </button>
 *   )
 * }
 *
 * @example
 * // Success toast
 * toast({
 *   variant: "success",
 *   title: "Pilot Created",
 *   description: "John Doe has been added successfully",
 * })
 *
 * @example
 * // Error toast
 * toast({
 *   variant: "destructive",
 *   title: "Error",
 *   description: "Failed to save changes. Please try again.",
 * })
 *
 * @example
 * // Warning toast
 * toast({
 *   variant: "warning",
 *   title: "Warning",
 *   description: "Certification expires in 30 days",
 * })
 *
 * @example
 * // Toast with action
 * toast({
 *   title: "Pilot Deleted",
 *   description: "John Doe has been removed",
 *   action: (
 *     <ToastAction altText="Undo" onClick={() => undoDelete()}>
 *       Undo
 *     </ToastAction>
 *   ),
 * })
 *
 * @returns Object with toast methods:
 * - toast: Function to show a new toast
 * - toasts: Array of current toasts
 * - dismiss: Function to dismiss a specific toast or all toasts
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    ...state,
    toast: (props: Toast) => {
      const id = genId()

      // Calculate duration based on variant or use custom duration
      const duration = getToastDuration(props.variant as string | undefined, props.duration)

      const update = (props: ToasterToast) =>
        dispatch({
          type: 'UPDATE_TOAST',
          toast: { ...props, id },
        })
      const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })

      dispatch({
        type: 'ADD_TOAST',
        toast: {
          ...props,
          id,
          duration,
          open: true,
          onOpenChange: (open) => {
            if (!open) dismiss()
          },
        },
      })

      return {
        id: id,
        dismiss,
        update,
      }
    },
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  }
}

export { useToast, toast }

/**
 * Standalone toast function
 *
 * Can be used outside of React components for imperative toast notifications.
 * Automatically configures duration based on variant:
 * - success: 3 seconds
 * - destructive: 7 seconds
 * - warning: 5 seconds
 * - default: 5 seconds
 *
 * @example
 * // In a service file or utility function
 * import { toast } from '@/hooks/use-toast'
 *
 * export async function createPilot(data) {
 *   try {
 *     const result = await api.post('/pilots', data)
 *     toast({
 *       variant: "success",
 *       title: "Success",
 *       description: "Pilot created successfully",
 *     })
 *     return result
 *   } catch (error) {
 *     toast({
 *       variant: "destructive",
 *       title: "Error",
 *       description: error.message,
 *     })
 *     throw error
 *   }
 * }
 *
 * @example
 * // Custom duration override
 * toast({
 *   title: "Important",
 *   description: "This stays visible longer",
 *   duration: 10000, // 10 seconds
 * })
 */
function toast(props: Toast) {
  const id = genId()

  // Calculate duration based on variant or use custom duration
  const duration = getToastDuration(props.variant as string | undefined, props.duration)

  const update = (props: ToasterToast) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      duration,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}
