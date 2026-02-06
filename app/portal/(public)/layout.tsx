import type { Metadata } from 'next'
import { ErrorBoundary } from '@/components/error-boundary'

/**
 * Public Portal Layout
 * Layout for public portal pages (login, register) that don't require authentication
 */

export const metadata: Metadata = {
  title: 'Pilot Portal | Fleet Management',
  description: 'Self-service portal for pilots',
}

export default function PublicPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <div className="bg-background min-h-screen">
        <main id="main-content" suppressHydrationWarning>
          {children}
        </main>
      </div>
    </ErrorBoundary>
  )
}
