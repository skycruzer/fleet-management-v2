'use client'

/**
 * Feedback Form Component
 * Client component for submitting feedback with validation
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: This form uses CSRF token via props for security
 *
 * @version 1.1.0
 * @updated 2025-10-27 - Added developer attribution
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { usePortalForm } from '@/lib/hooks/use-portal-form'
import { FormErrorAlert } from '@/components/portal/form-error-alert'
import { SubmitButton } from '@/components/portal/submit-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { submitFeedbackAction } from '@/app/portal/(protected)/feedback/actions'

interface PilotUser {
  id: string
  first_name: string
  last_name: string
  rank: string
}

interface FeedbackCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
}

// Form validation schema
const feedbackSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  content: z.string().min(20, 'Feedback content must be at least 20 characters'),
  category_id: z.string().optional(),
  is_anonymous: z.boolean(),
})

type FeedbackFormData = z.infer<typeof feedbackSchema>

interface FeedbackFormProps {
  pilotUser: PilotUser
  categories: FeedbackCategory[]
  csrfToken: string
}

export function FeedbackForm({ pilotUser, categories, csrfToken }: FeedbackFormProps) {
  const router = useRouter()
  const {
    isSubmitting,
    error,
    handleSubmit: handlePortalSubmit,
    resetError,
  } = usePortalForm({
    successRedirect: '/portal/feedback',
    successMessage: 'feedback_submitted',
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    mode: 'onBlur', // Validate on blur for better UX
    reValidateMode: 'onChange', // Re-validate on change after first blur
    defaultValues: {
      is_anonymous: false,
    },
  })

  const isAnonymous = watch('is_anonymous')

  async function onSubmit(data: FeedbackFormData) {
    // Create FormData for Server Action
    const formData = new FormData()
    formData.append('csrf_token', csrfToken)
    formData.append('title', data.title)
    formData.append('content', data.content)
    if (data.category_id) {
      formData.append('category_id', data.category_id)
    }
    formData.append('is_anonymous', data.is_anonymous.toString())

    // Use portal form handler
    await handlePortalSubmit(() => submitFeedbackAction(formData))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Error Alert */}
      <FormErrorAlert error={error} onDismiss={resetError} />

      {/* Anonymous Toggle */}
      <div className="border-border bg-muted/30 flex items-center justify-between rounded-lg border p-4">
        <div>
          <label
            htmlFor="is_anonymous"
            className="text-foreground cursor-pointer text-sm font-medium"
          >
            Submit Anonymously
          </label>
          <p className="text-muted-foreground mt-1 text-xs">
            {isAnonymous
              ? 'Your identity will be hidden from other pilots'
              : `Posting as ${pilotUser.rank} ${pilotUser.first_name} ${pilotUser.last_name}`}
          </p>
        </div>
        <input
          type="checkbox"
          id="is_anonymous"
          {...register('is_anonymous')}
          className="border-border bg-background text-accent focus:ring-ring/20 h-4 w-4 cursor-pointer rounded transition-colors focus:ring-2"
        />
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium">
            Category <span className="text-muted-foreground text-xs">(Optional)</span>
          </label>
          <select
            {...register('category_id')}
            className="border-border bg-background focus:ring-ring/20 focus:border-foreground/30 flex h-9 w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-2 focus:outline-none"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
                {category.description && ` - ${category.description}`}
              </option>
            ))}
          </select>
          {errors.category_id && (
            <p className="text-destructive text-xs font-medium">{errors.category_id.message}</p>
          )}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-foreground text-sm font-medium">
          Title <span className="text-destructive/70 ml-0.5 text-xs">*</span>
        </label>
        <Input
          id="title"
          type="text"
          {...register('title')}
          placeholder="Brief summary of your feedback..."
          error={!!errors.title}
          success={touchedFields.title && !errors.title}
          aria-required={true}
          aria-describedby="title_error"
        />
        {errors.title && (
          <p id="title_error" className="text-destructive text-xs font-medium" role="alert">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="space-y-1.5">
        <label htmlFor="content" className="text-foreground text-sm font-medium">
          Feedback <span className="text-destructive/70 ml-0.5 text-xs">*</span>
        </label>
        <Textarea
          id="content"
          {...register('content')}
          rows={8}
          placeholder="Share your feedback, suggestions, or concerns in detail...

Examples:
- Operational improvements
- Safety concerns
- Training suggestions
- Schedule preferences
- Equipment issues
- Crew communication"
          error={!!errors.content}
          success={touchedFields.content && !errors.content}
          showCharCount={true}
          maxLength={2000}
          aria-required={true}
          aria-describedby="content_help content_error"
        />
        {errors.content && (
          <p id="content_error" className="text-destructive text-xs font-medium" role="alert">
            {errors.content.message}
          </p>
        )}
        <p id="content_help" className="text-muted-foreground text-xs">
          Be specific and constructive. Your feedback helps improve our operations.
        </p>
      </div>

      {/* Submit Buttons */}
      <div className="border-border flex items-center justify-end gap-3 border-t pt-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="border-border bg-background text-foreground hover:bg-muted h-9 rounded-lg border px-4 text-sm font-medium transition-colors duration-200"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <SubmitButton isSubmitting={isSubmitting}>Submit Feedback</SubmitButton>
      </div>
    </form>
  )
}
