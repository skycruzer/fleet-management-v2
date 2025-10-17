'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logError, type ErrorContext } from '@/lib/error-logger'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example With custom fallback
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to error logging service
    const context: ErrorContext = {
      componentStack: errorInfo.componentStack || undefined,
      errorBoundary: true,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    }

    logError(error, context)

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Update state with error info for display
    this.setState({
      errorInfo,
    })
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleGoHome = (): void => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6 rounded-lg border border-destructive/50 bg-destructive/10 p-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/20 p-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>

            {/* Error Title */}
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Something went wrong
              </h2>
              <p className="text-sm text-muted-foreground">
                {process.env.NODE_ENV === 'development'
                  ? 'An error occurred in the application. Check the console for more details.'
                  : 'An unexpected error occurred. Please try again or contact support if the problem persists.'}
              </p>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="space-y-2">
                <details className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-destructive">
                    Error Details
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Message:</p>
                      <p className="text-xs font-mono text-foreground break-words">
                        {this.state.error.message}
                      </p>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Stack Trace:</p>
                        <pre className="mt-1 max-h-40 overflow-auto text-[10px] leading-tight text-foreground/80">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Component Stack:</p>
                        <pre className="mt-1 max-h-40 overflow-auto text-[10px] leading-tight text-foreground/80">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={this.handleReset}
                className="flex-1"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={this.handleGoHome}
                className="flex-1"
                variant="outline"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>

            {/* Support Information */}
            {process.env.NODE_ENV === 'production' && (
              <div className="rounded-md bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  If this error persists, please contact{' '}
                  <a
                    href="mailto:support@fleetmanagement.com"
                    className="font-medium text-primary hover:underline"
                  >
                    support@fleetmanagement.com
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component to wrap components with ErrorBoundary
 *
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(YourComponent)
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`

  return WrappedComponent
}
