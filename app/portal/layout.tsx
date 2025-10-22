import { ErrorBoundary } from '@/components/error-boundary'

/**
 * Portal Layout
 * Base layout for all pilot portal pages (public and protected)
 * Authentication is handled in individual route group layouts:
 * - (public)/layout.tsx - No authentication
 * - (protected)/layout.tsx - With authentication
 * Wrapped with ErrorBoundary for graceful error handling
 */

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
