/**
 * Submit Feedback Page
 * Developer: Maurice Rondeau
 *
 * Form for pilots to submit feedback, suggestions, and report issues.
 *
 * @spec 001-missing-core-features (US1)
 */

'use client'

import { useState } from 'react'
import { csrfHeaders } from '@/lib/hooks/use-csrf-token'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import {
  MessageSquare,
  ArrowLeft,
  Send,
  CheckCircle,
  AlertCircle,
  EyeOff,
  Loader2,
} from 'lucide-react'
import { PageBreadcrumbs } from '@/components/navigation/page-breadcrumbs'

export default function NewFeedbackPage() {
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    message: '',
    is_anonymous: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)

    try {
      // Submit data - category is required, subject and message are trimmed
      const sanitizedData = {
        category: formData.category,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        is_anonymous: formData.is_anonymous,
      }

      // Submit feedback to API
      const response = await fetch('/api/portal/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeaders(),
        },
        body: JSON.stringify(sanitizedData),
        credentials: 'include',
      })

      const result = await response.json()

      // Check both HTTP status and API success flag
      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Failed to submit feedback')
      }

      // Show success and clear form
      setSubmitSuccess(true)
      setFormData({ category: '', subject: '', message: '', is_anonymous: false })

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-card sticky top-0 z-10 border-b">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-8 w-8 text-[var(--color-info)]" />
              <div>
                <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
                  Submit Feedback
                </h1>
                <p className="text-muted-foreground text-xs">
                  Share your suggestions and report issues
                </p>
              </div>
            </div>
            <Link href="/portal/feedback">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Feedback
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <PageBreadcrumbs rootPath="portal" />
        {/* Success Message */}
        {submitSuccess && (
          <div className="mb-6 rounded-xl border border-[var(--color-success-500)]/30 bg-[var(--color-success-muted)] p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-success-500)]/20">
              <CheckCircle className="h-6 w-6 text-[var(--color-success-500)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-success-400)]">
              Feedback Submitted Successfully!
            </h3>
            <p className="mt-2 text-sm text-[var(--color-success-400)]/80">
              Thank you for your feedback. Fleet management will review it shortly.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link href="/portal/feedback">
                <Button variant="outline" size="sm">
                  View My Feedback
                </Button>
              </Link>
              <Button size="sm" onClick={() => setSubmitSuccess(false)}>
                Submit Another
              </Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {submitError && (
          <div className="mb-6 rounded-xl border border-[var(--color-danger-500)]/30 bg-[var(--color-destructive-muted)] p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-danger-500)]/20">
                <AlertCircle className="h-5 w-5 text-[var(--color-danger-500)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-danger-400)]">Submission Failed</h3>
                <p className="text-sm text-[var(--color-danger-400)]/80">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Form */}
        <Card className="p-6">
          <h2 className="text-foreground mb-4 text-lg font-semibold">Feedback Form</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Your feedback helps us improve operations and address concerns. All submissions are
            reviewed by fleet management.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operations">Flight Operations</SelectItem>
                  <SelectItem value="training">Training & Development</SelectItem>
                  <SelectItem value="scheduling">Scheduling & Rostering</SelectItem>
                  <SelectItem value="safety">Safety Concern</SelectItem>
                  <SelectItem value="equipment">Equipment & Maintenance</SelectItem>
                  <SelectItem value="system">System Issue</SelectItem>
                  <SelectItem value="suggestion">General Suggestion</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief summary of your feedback"
                required
                minLength={5}
                maxLength={200}
              />
              <p className="text-muted-foreground text-xs">
                {formData.subject.length}/200 characters (min 5)
              </p>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Provide details about your feedback, suggestion, or concern..."
                required
                rows={8}
                minLength={10}
                maxLength={5000}
              />
              <p className="text-muted-foreground text-xs">
                {formData.message.length}/5000 characters (min 10)
              </p>
            </div>

            {/* Anonymous Option */}
            <div className="border-border rounded-lg border p-4">
              <div className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  id="is_anonymous"
                  checked={formData.is_anonymous}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_anonymous: checked === true })
                  }
                  className="mt-0.5"
                />
                <Label htmlFor="is_anonymous" className="cursor-pointer font-normal">
                  <div className="text-foreground flex items-center gap-2 text-sm font-medium">
                    <EyeOff className="h-4 w-4" />
                    Submit Anonymously
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Your name will be hidden from the feedback. Fleet management can still respond
                    but won&apos;t see who submitted it.
                  </p>
                </Label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setFormData({ category: '', subject: '', message: '', is_anonymous: false })
                }
                disabled={submitting}
              >
                Clear Form
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Feedback Guidelines */}
        <Card className="mt-6 p-6">
          <h3 className="text-foreground mb-3 font-semibold">Feedback Guidelines</h3>
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li>• Be specific and provide relevant details to help us understand your feedback</li>
            <li>• For urgent safety concerns, contact flight operations directly</li>
            <li>• All feedback is confidential and reviewed by appropriate personnel</li>
            <li>• You will receive a response via email within 2-3 business days</li>
            <li>• Constructive feedback helps improve our operations and working environment</li>
          </ul>
        </Card>
      </main>
    </div>
  )
}
