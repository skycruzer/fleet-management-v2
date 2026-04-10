/**
 * Dashboard Error Fallback
 * Developer: Maurice Rondeau
 *
 * Client component for error boundary fallbacks on the dashboard.
 * Must be a client component because it uses onClick for reload.
 */
'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

export function DashboardErrorFallback({ section }: { section: string }) {
  const router = useRouter()

  return (
    <div
      role="alert"
      className="border-destructive/20 bg-destructive/5 flex items-center gap-2 rounded-xl border p-4"
    >
      <AlertCircle className="text-destructive h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="text-destructive text-sm">Failed to load {section}.</span>
      <button
        onClick={() => router.refresh()}
        className="text-primary text-xs underline hover:no-underline"
        aria-label={`Reload ${section}`}
      >
        Reload
      </button>
    </div>
  )
}
