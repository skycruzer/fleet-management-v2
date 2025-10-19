/**
 * Form Layout Utilities
 * Reusable CSS classes for consistent form field layouts
 * Eliminates duplication of grid classes across forms
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

/**
 * Standard form grid layouts used across all forms
 */
export const formLayouts = {
  /** Single column grid (full width) */
  singleColumn: 'grid grid-cols-1 gap-4',

  /** Two column grid (responsive) */
  twoColumn: 'grid grid-cols-1 md:grid-cols-2 gap-4',

  /** Three column grid (responsive) */
  threeColumn: 'grid grid-cols-1 md:grid-cols-3 gap-4',

  /** Four column grid (responsive) */
  fourColumn: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',

  /** Form section spacing */
  section: 'space-y-4',

  /** Form content spacing */
  content: 'space-y-6',

  /** Form footer spacing */
  footer: 'flex justify-end gap-4',

  /** Form footer with extra content */
  footerWithExtra: 'flex justify-between items-center',
} as const

/**
 * Get responsive grid classes for field count
 * @param columns Number of columns (1-4)
 * @returns Tailwind grid classes
 */
export function getFormGridClasses(columns: 1 | 2 | 3 | 4): string {
  switch (columns) {
    case 1:
      return formLayouts.singleColumn
    case 2:
      return formLayouts.twoColumn
    case 3:
      return formLayouts.threeColumn
    case 4:
      return formLayouts.fourColumn
    default:
      return formLayouts.twoColumn
  }
}

/**
 * Form field label with required indicator
 */
export interface FormLabelProps {
  text: string
  required?: boolean
  optional?: boolean
  htmlFor?: string
}

export function getFormLabelClasses(): string {
  return 'block text-sm font-medium text-gray-700 mb-2'
}

export function formatFormLabel({
  text,
  required = false,
  optional = false,
}: Omit<FormLabelProps, 'htmlFor'>): string {
  let label = text
  if (required) {
    label += ' *'
  }
  if (optional) {
    label += ' (Optional)'
  }
  return label
}

/**
 * Standard form validation error classes
 */
export const formErrorClasses = {
  message: 'mt-1 text-sm text-red-600',
  input: 'border-red-500 focus:ring-red-500',
  textarea: 'border-red-500 focus:ring-red-500',
  select: 'border-red-500 focus:ring-red-500',
} as const

/**
 * Standard form success classes
 */
export const formSuccessClasses = {
  input: 'border-green-500 focus:ring-green-500',
  textarea: 'border-green-500 focus:ring-green-500',
  select: 'border-green-500 focus:ring-green-500',
} as const

/**
 * Standard form field description classes
 */
export const formDescriptionClasses = 'mt-1 text-xs text-gray-500'

/**
 * Standard portal form select classes
 */
export const portalSelectClasses =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'

/**
 * Standard portal cancel button classes
 */
export const portalCancelButtonClasses =
  'px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors'
