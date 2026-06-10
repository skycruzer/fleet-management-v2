/**
 * Global Error Handler
 * Root error boundary for the entire application
 * @author Maurice Rondeau
 *
 * IMPORTANT: global-error replaces the root layout entirely, so globals.css
 * is NOT loaded here. All styling must be inline — Tailwind classes resolve
 * to nothing on this screen. Values mirror the light-theme design tokens.
 */

'use client'

import { useEffect, type CSSProperties } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

const styles: Record<string, CSSProperties> = {
  body: {
    margin: 0,
    backgroundColor: '#f0f0f3',
    color: '#1c2024',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 16px',
  },
  card: {
    maxWidth: '32rem',
    textAlign: 'center',
  },
  iconCircle: {
    display: 'inline-flex',
    padding: '24px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    marginBottom: '24px',
  },
  title: {
    fontSize: '2.25rem',
    fontWeight: 700,
    color: '#000000',
    margin: '0 0 16px',
  },
  message: {
    fontSize: '1.125rem',
    color: '#60646c',
    margin: '0 0 8px',
    lineHeight: 1.6,
  },
  digest: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '0.875rem',
    color: '#60646c',
    margin: '8px 0 0',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '32px',
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '9999px',
    border: '1px solid #000000',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  outlineButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '9999px',
    border: '1px solid #d9d9e0',
    backgroundColor: '#ffffff',
    color: '#1c2024',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  support: {
    fontSize: '0.875rem',
    color: '#60646c',
    marginTop: '24px',
  },
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error:', error)
    }
  }, [error])

  return (
    <html lang="en">
      <body style={styles.body}>
        <div style={styles.wrapper}>
          <div style={styles.card}>
            {/* Error Icon */}
            <div style={styles.iconCircle}>
              <AlertTriangle size={64} color="#dc2626" aria-hidden="true" />
            </div>

            {/* Error Title */}
            <h1 style={styles.title}>Application Error</h1>

            {/* Error Message */}
            <p style={styles.message}>
              {process.env.NODE_ENV === 'development'
                ? error.message || 'An unexpected error occurred'
                : 'An unexpected error occurred. Please try again or contact your fleet administrator if the problem persists.'}
            </p>

            {/* Error ID (Production) */}
            {error.digest && <p style={styles.digest}>Error ID: {error.digest}</p>}

            {/* Action Buttons */}
            <div style={styles.actions}>
              <button type="button" onClick={() => reset()} style={styles.primaryButton}>
                <RefreshCw size={16} aria-hidden="true" />
                Try Again
              </button>
              <button
                type="button"
                style={styles.outlineButton}
                onClick={() => (window.location.href = '/')}
              >
                <Home size={16} aria-hidden="true" />
                Go Home
              </button>
            </div>

            {/* Support Information */}
            <p style={styles.support}>
              If this problem persists, please contact your fleet administrator
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
