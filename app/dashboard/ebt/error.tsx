'use client'

// Segment error boundary for the authenticated app shell. Catches any error thrown during render
// or from a Server Action whose rejected transition wasn't handled in-component (the components
// handle their own failures gracefully; this is the safety net so an unexpected throw degrades to a
// retry prompt instead of a blank page). Next.js sanitizes the error message in production.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-500">
        The page hit an unexpected error. Your saved work is not affected — try again.
      </p>
      {error.digest && <p className="mt-1 text-xs text-slate-400">Reference: {error.digest}</p>}
      <button
        onClick={reset}
        className="mt-6 rounded bg-[#7c1d3f] px-4 py-2 text-sm font-medium text-white hover:bg-[#6a1836]"
      >
        Try again
      </button>
    </div>
  )
}
