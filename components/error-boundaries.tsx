'use client'

/**
 * Section-Specific Error Boundary Components
 *
 * Pre-configured error boundaries for common use cases with
 * contextual error messages and appropriate fallback UI.
 */

import { ReactNode } from 'react'
import { ErrorBoundary } from './error-boundary'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface SectionErrorBoundaryProps {
  children: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * Form Error Boundary
 * Specialized for form components with data recovery message
 */
export function FormErrorBoundary({ children, onError }: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <Card className="border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] p-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="rounded-full bg-[var(--color-status-high-bg)] p-3">
              <AlertTriangle className="h-8 w-8 text-[var(--color-status-high)]" />
            </div>
            <div>
              <h3 className="text-foreground mb-2 text-xl font-semibold">Form Error</h3>
              <p className="text-muted-foreground mb-4">
                There was an error loading the form. Your data has not been lost. Please try
                refreshing the page or contact support if the issue persists.
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => window.location.reload()} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
              </Button>
              <Button onClick={() => window.history.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </div>
        </Card>
      }
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Widget Error Boundary
 * Specialized for dashboard widgets - allows partial failures
 */
export function WidgetErrorBoundary({ children, onError }: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <Card className="border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-[var(--color-status-medium)]" />
            <p className="text-muted-foreground text-sm">
              Unable to load this widget. Other sections are still available.
            </p>
          </div>
        </Card>
      }
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Table Error Boundary
 * Specialized for data tables and lists
 */
export function TableErrorBoundary({ children, onError }: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <Card className="border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] p-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            <AlertTriangle className="h-8 w-8 text-[var(--color-status-medium)]" />
            <div>
              <h3 className="text-foreground mb-2 text-lg font-semibold">Unable to Load Data</h3>
              <p className="text-muted-foreground mb-4">
                There was an error loading the table data. Please try refreshing the page.
              </p>
            </div>
            <Button onClick={() => window.location.reload()} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
          </div>
        </Card>
      }
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Modal/Dialog Error Boundary
 * Specialized for modal dialogs and popups
 */
export function DialogErrorBoundary({ children, onError }: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="rounded-lg border border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--color-status-high)]" />
            <div className="flex-1">
              <h4 className="text-foreground mb-1 font-semibold">Error Loading Dialog</h4>
              <p className="text-muted-foreground mb-3 text-sm">
                There was an error loading this dialog. Please close and try again.
              </p>
              <Button onClick={() => window.location.reload()} size="sm" variant="outline">
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      }
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Page Section Error Boundary
 * Specialized for major page sections (header, sidebar, content)
 */
export function PageSectionErrorBoundary({
  children,
  onError,
  sectionName = 'section',
}: SectionErrorBoundaryProps & { sectionName?: string }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="rounded-lg border border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-[var(--color-status-medium)]" />
            <div>
              <p className="text-foreground text-sm font-medium">Unable to load {sectionName}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                The rest of the page is still functional.
              </p>
            </div>
          </div>
        </div>
      }
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Chart Error Boundary
 * Specialized for charts and visualizations
 */
export function ChartErrorBoundary({ children, onError }: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <Card className="border-border p-6">
          <div className="flex min-h-[200px] flex-col items-center justify-center space-y-3 text-center">
            <AlertTriangle className="text-muted-foreground h-8 w-8" />
            <div>
              <p className="text-foreground text-sm font-medium">Unable to load visualization</p>
              <p className="text-muted-foreground mt-1 text-xs">Chart data could not be rendered</p>
            </div>
            <Button onClick={() => window.location.reload()} size="sm" variant="outline">
              <RefreshCw className="mr-2 h-3 w-3" />
              Retry
            </Button>
          </div>
        </Card>
      }
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Navigation Error Boundary
 * Specialized for navigation components (sidebar, header, menu)
 */
export function NavigationErrorBoundary({ children, onError }: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="m-4 rounded-lg border border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-[var(--color-status-high)]" />
            <div>
              <p className="text-foreground text-sm font-medium">Navigation Error</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Unable to load navigation. Please refresh the page.
              </p>
            </div>
          </div>
        </div>
      }
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  )
}
