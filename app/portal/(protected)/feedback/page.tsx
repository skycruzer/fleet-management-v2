/**
 * Pilot Feedback Page
 * Submit feedback, suggestions, and report issues to fleet management
 *
 * @spec 001-missing-core-features (US1)
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MessageSquare, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react'

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)

    try {
      // Submit feedback to API
      const response = await fetch('/api/portal/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
          is_anonymous: false,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit feedback')
      }

      setSubmitSuccess(true)
      setFormData({ category: '', subject: '', message: '' })

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000)
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-card/80 sticky top-0 z-10 border-b backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-foreground text-xl font-bold">Submit Feedback</h1>
                <p className="text-muted-foreground text-xs">
                  Share your suggestions and report issues
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Success Message */}
        {submitSuccess && (
          <div className="mb-6 flex items-center space-x-3 rounded-lg bg-green-50 p-4 text-green-700">
            <CheckCircle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Feedback Submitted Successfully!</h3>
              <p className="text-sm">
                Thank you for your feedback. Fleet management will review it shortly.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {submitError && (
          <div className="mb-6 flex items-center space-x-3 rounded-lg bg-red-50 p-4 text-red-700">
            <AlertCircle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Submission Failed</h3>
              <p className="text-sm">{submitError}</p>
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
            <div>
              <label htmlFor="category" className="text-foreground mb-2 block text-sm font-medium">
                Category *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="border-input bg-background text-foreground focus:border-primary focus:ring-primary w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                required
              >
                <option value="">Select a category</option>
                <option value="operations">Flight Operations</option>
                <option value="training">Training & Development</option>
                <option value="scheduling">Scheduling & Rostering</option>
                <option value="safety">Safety Concern</option>
                <option value="equipment">Equipment & Maintenance</option>
                <option value="system">System Issue</option>
                <option value="suggestion">General Suggestion</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="text-foreground mb-2 block text-sm font-medium">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="border-input bg-background text-foreground focus:border-primary focus:ring-primary w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                placeholder="Brief summary of your feedback"
                required
                maxLength={200}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                {formData.subject.length}/200 characters
              </p>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="text-foreground mb-2 block text-sm font-medium">
                Message *
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="border-input bg-background text-foreground focus:border-primary focus:ring-primary w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                placeholder="Provide details about your feedback, suggestion, or concern..."
                required
                rows={8}
                maxLength={2000}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                {formData.message.length}/2000 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({ category: '', subject: '', message: '' })}
                disabled={submitting}
              >
                Clear Form
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
