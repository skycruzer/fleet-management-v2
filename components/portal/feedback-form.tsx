'use client'

/**
 * Feedback Form Component
 * Client component for submitting feedback with validation
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
import { submitFeedbackAction } from '@/app/portal/feedback/actions'

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
  const { isSubmitting, error, handleSubmit: handlePortalSubmit, resetError } = usePortalForm({
    successRedirect: '/portal/feedback',
    successMessage: 'feedback_submitted',
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields, dirtyFields },
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Alert */}
      <FormErrorAlert error={error} onDismiss={resetError} />

      {/* Anonymous Toggle */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div>
          <label htmlFor="is_anonymous" className="font-medium text-gray-900 cursor-pointer">
            Submit Anonymously
          </label>
          <p className="text-sm text-gray-600 mt-1">
            {isAnonymous
              ? 'Your identity will be hidden from other pilots'
              : `Posting as ${pilotUser.rank} ${pilotUser.first_name} ${pilotUser.last_name}`}
          </p>
        </div>
        <input
          type="checkbox"
          id="is_anonymous"
          {...register('is_anonymous')}
          className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-gray-400">(Optional)</span>
          </label>
          <select
            {...register('category_id')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
          )}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <Input
          id="title"
          type="text"
          {...register('title')}
          placeholder="Brief summary of your feedback..."
          error={!!errors.title}
          success={touchedFields.title && !errors.title}
          aria-required="true"
          aria-describedby="title_error"
        />
        {errors.title && (
          <p id="title_error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Content */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          Feedback <span className="text-red-500">*</span>
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
          aria-required="true"
          aria-describedby="content_help content_error"
        />
        {errors.content && (
          <p id="content_error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.content.message}
          </p>
        )}
        <p id="content_help" className="mt-1 text-xs text-gray-500">
          Be specific and constructive. Your feedback helps improve our operations.
        </p>
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <SubmitButton isSubmitting={isSubmitting}>Submit Feedback</SubmitButton>
      </div>
    </form>
  )
}
