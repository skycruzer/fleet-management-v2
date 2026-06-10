'use client'

/**
 * Theme-aware sonner Toaster.
 *
 * Wraps sonner's Toaster with next-themes so toasts follow the active
 * light/dark theme (sonner defaults to light otherwise). Must be rendered
 * inside the app's ThemeProvider (app/providers.tsx).
 */

import { useTheme } from 'next-themes'
import { Toaster as SonnerToaster } from 'sonner'

type ToasterProps = React.ComponentProps<typeof SonnerToaster>

export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme()

  return <SonnerToaster theme={(resolvedTheme as ToasterProps['theme']) ?? 'system'} {...props} />
}
