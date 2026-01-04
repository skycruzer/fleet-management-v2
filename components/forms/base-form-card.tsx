/**
 * Base Form Card Component
 * Provides consistent Card wrapper structure for all form components
 * Eliminates duplication of CardHeader, CardFooter, and submit button logic
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export interface BaseFormCardProps {
  /** Form title */
  title: string
  /** Form description/subtitle */
  description: string
  /** Form content (fields) */
  children: ReactNode
  /** Form submission handler */
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  /** Cancel handler (optional) */
  onCancel?: () => void
  /** Loading state */
  isLoading?: boolean
  /** Submit button text */
  submitText: string
  /** Cancel button text */
  cancelText?: string
  /** Additional footer content */
  footerExtra?: ReactNode
  /** Custom card className */
  className?: string
}

/**
 * Base form card wrapper that provides consistent structure
 * for all admin dashboard forms (create/edit modes)
 */
export function BaseFormCard({
  title,
  description,
  children,
  onSubmit,
  onCancel,
  isLoading = false,
  submitText,
  cancelText = 'Cancel',
  footerExtra,
  className,
}: BaseFormCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-6">{children}</CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="flex-1">{footerExtra}</div>
          <div className="flex gap-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                {cancelText}
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitText}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

/**
 * Form section component for grouping related fields
 */
export interface FormSectionProps {
  /** Section title */
  title: string
  /** Section description (optional) */
  description?: string
  /** Section fields */
  children: ReactNode
  /** Custom className */
  className?: string
}

export function FormSection({ title, description, children, className = '' }: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}
