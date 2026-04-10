/**
 * Custom 404 Not Found Page
 * @author Maurice Rondeau
 */

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-lg space-y-6 text-center">
        {/* 404 Number */}
        <h1 className="text-primary text-9xl font-bold">404</h1>

        {/* Title */}
        <h2 className="text-foreground text-3xl font-semibold">Page Not Found</h2>

        {/* Description */}
        <p className="text-muted-foreground text-lg">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
