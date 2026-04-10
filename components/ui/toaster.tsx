'use client'

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { useToast } from '@/hooks/use-toast'

/**
 * Toaster Component
 *
 * Renders all active toasts. This component should be added to the root layout
 * to display toast notifications throughout the application.
 *
 * Features:
 * - Automatic toast positioning (bottom-right on desktop, top on mobile)
 * - Swipe-to-dismiss gesture support
 * - Stacked toast display with animations
 * - Accessible ARIA labels
 *
 * @example
 * // In app/layout.tsx
 * import { Toaster } from '@/components/ui/toaster'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <Toaster />
 *       </body>
 *     </html>
 *   )
 * }
 */
export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
