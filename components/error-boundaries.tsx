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
        <Card className="p-8 border-red-200 bg-red-50">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Form Error
              </h3>
              <p className="text-gray-600 mb-4">
                There was an error loading the form. Your data has not been lost.
                Please try refreshing the page or contact support if the issue persists.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => window.location.reload()}
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
              </Button>
              <Button
                onClick={() => window.history.back()}
                variant="outline"
              >
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
        <Card className="p-6 border-yellow-200 bg-yellow-50">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-gray-600">
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
        <Card className="p-8 border-yellow-200 bg-yellow-50">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Unable to Load Data
              </h3>
              <p className="text-gray-600 mb-4">
                There was an error loading the table data. Please try refreshing the page.
              </p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              variant="default"
            >
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
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                Error Loading Dialog
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                There was an error loading this dialog. Please close and try again.
              </p>
              <Button
                onClick={() => window.location.reload()}
                size="sm"
                variant="outline"
              >
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
  sectionName = 'section'
}: SectionErrorBoundaryProps & { sectionName?: string }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Unable to load {sectionName}
              </p>
              <p className="text-xs text-gray-600 mt-1">
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
        <Card className="p-6 border-gray-200">
          <div className="flex flex-col items-center justify-center min-h-[200px] text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Unable to load visualization
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Chart data could not be rendered
              </p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              size="sm"
              variant="outline"
            >
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg m-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Navigation Error
              </p>
              <p className="text-xs text-gray-600 mt-1">
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
