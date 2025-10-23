import { z } from 'zod'

/**
 * Feedback Community Validation Schemas
 *
 * Validates feedback posts, comments, categories, and moderation actions.
 */

// Feedback post creation schema
export const FeedbackPostSchema = z.object({
  category_id: z
    .string()
    .uuid('Invalid category ID format'),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be less than 255 characters'),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content must be less than 10,000 characters'),
  status: z.enum(['draft', 'published'], {
    message: 'Status must be either draft or published',
  }).default('published'),
})

export type FeedbackPostInput = z.infer<typeof FeedbackPostSchema>

// Feedback post update schema (pilot can edit own post)
export const FeedbackPostUpdateSchema = z.object({
  category_id: z
    .string()
    .uuid('Invalid category ID format')
    .optional(),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be less than 255 characters')
    .optional(),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content must be less than 10,000 characters')
    .optional(),
  status: z.enum(['draft', 'published']).optional(),
})

export type FeedbackPostUpdate = z.infer<typeof FeedbackPostUpdateSchema>

// Feedback comment creation schema
export const FeedbackCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be less than 2,000 characters'),
  parent_comment_id: z
    .string()
    .uuid('Invalid parent comment ID format')
    .nullable()
    .optional(),
  mentions: z
    .array(z.string().uuid('Invalid user ID in mentions'))
    .max(20, 'Maximum 20 mentions allowed')
    .optional()
    .default([]),
})

export type FeedbackCommentInput = z.infer<typeof FeedbackCommentSchema>

// Feedback comment update schema (pilot can edit own comment)
export const FeedbackCommentUpdateSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be less than 2,000 characters'),
  mentions: z
    .array(z.string().uuid('Invalid user ID in mentions'))
    .max(20, 'Maximum 20 mentions allowed')
    .optional(),
})

export type FeedbackCommentUpdate = z.infer<typeof FeedbackCommentUpdateSchema>

// Vote schema (upvote/downvote)
export const FeedbackVoteSchema = z.object({
  vote_type: z.enum(['upvote', 'downvote', 'remove'], {
    message: 'Vote type is required',
  }),
})

export type FeedbackVoteInput = z.infer<typeof FeedbackVoteSchema>

// Admin moderation schema
export const FeedbackModerationSchema = z.object({
  action: z.enum(['pin', 'unpin', 'hide', 'unhide'], {
    message: 'Moderation action is required',
  }),
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be less than 500 characters')
    .optional(),
}).refine(
  (data) => {
    // If action is hide, reason should be provided (not required but recommended)
    if (data.action === 'hide' && !data.reason) {
      return false
    }
    return true
  },
  {
    message: 'Reason is recommended when hiding a post',
    path: ['reason'],
  }
)

export type FeedbackModerationInput = z.infer<typeof FeedbackModerationSchema>

// Feedback category creation/update schema (admin only)
export const FeedbackCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Category name must be at least 2 characters')
    .max(50, 'Category name must be less than 50 characters')
    .regex(/^[a-zA-Z\s&-]+$/, 'Category name can only contain letters, spaces, hyphens, and ampersands'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color code (e.g., #3b82f6)')
    .default('#6b7280'),
  icon: z
    .string()
    .min(2, 'Icon name is required')
    .max(50, 'Icon name must be less than 50 characters')
    .default('lightbulb'),
  display_order: z
    .number()
    .int('Display order must be an integer')
    .nonnegative('Display order cannot be negative')
    .default(999),
})

export type FeedbackCategoryInput = z.infer<typeof FeedbackCategorySchema>

// Feedback post filters schema
export const FeedbackPostFiltersSchema = z.object({
  category_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'published', 'hidden']).optional(),
  pilot_id: z.string().uuid().optional(), // Filter by author
  is_pinned: z.boolean().optional(),
  search: z.string().max(255).optional(), // Search title/content
  sort_by: z.enum(['newest', 'oldest', 'most_upvotes', 'most_comments']).default('newest'),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(50).default(20),
})

export type FeedbackPostFilters = z.infer<typeof FeedbackPostFiltersSchema>

// Feedback comment filters schema
export const FeedbackCommentFiltersSchema = z.object({
  post_id: z.string().uuid('Post ID is required'),
  parent_comment_id: z.string().uuid().nullable().optional(), // Filter by parent (for nested view)
  pilot_id: z.string().uuid().optional(), // Filter by author
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(50),
})

export type FeedbackCommentFilters = z.infer<typeof FeedbackCommentFiltersSchema>
