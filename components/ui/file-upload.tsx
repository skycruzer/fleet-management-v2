/**
 * File Upload Component
 *
 * Developer: Maurice Rondeau
 * Date: February 2, 2026
 *
 * A reusable drag-and-drop file upload component with:
 * - Click to browse functionality
 * - File preview (images) or icon (PDFs)
 * - Remove button
 * - Loading and error states
 * - Accessibility support
 */

'use client'

import { useCallback, useState, useRef } from 'react'
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  validateFile,
  formatFileSize,
  ACCEPT_STRING,
  MAX_FILE_SIZE_DISPLAY,
} from '@/lib/validations/file-upload-schema'

// ============================================================================
// TYPES
// ============================================================================

export interface FileUploadProps {
  /** Label for the upload field */
  label?: string
  /** Helper text shown below the drop zone */
  helperText?: string
  /** Accepted file types (default: PDF, JPG, PNG) */
  accept?: string
  /** Maximum file size in bytes */
  maxSize?: number
  /** Whether the field is disabled */
  disabled?: boolean
  /** Whether a file is required */
  required?: boolean
  /** Current selected file */
  value?: File | null
  /** Callback when file is selected */
  onFileSelect: (file: File | null) => void
  /** Callback when file is removed */
  onFileRemove?: () => void
  /** Error message to display */
  error?: string
  /** Whether upload is in progress */
  isUploading?: boolean
  /** Whether upload was successful */
  uploadSuccess?: boolean
  /** Custom class name */
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FileUpload({
  label,
  helperText,
  accept = ACCEPT_STRING,
  maxSize: _maxSize,
  disabled = false,
  required = false,
  value,
  onFileSelect,
  onFileRemove,
  error,
  isUploading = false,
  uploadSuccess = false,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Generate preview URL for images
  const updatePreview = useCallback(
    (file: File | null) => {
      // Revoke previous preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      if (file && file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else {
        setPreviewUrl(null)
      }
    },
    [previewUrl]
  )

  // Handle file selection
  const handleFileSelect = useCallback(
    (file: File | null) => {
      setValidationError(null)

      if (!file) {
        onFileSelect(null)
        updatePreview(null)
        return
      }

      // Validate file
      const validation = validateFile(file)
      if (!validation.isValid) {
        setValidationError(validation.errors[0])
        return
      }

      onFileSelect(file)
      updatePreview(file)
    },
    [onFileSelect, updatePreview]
  )

  // Handle drag events
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragging(true)
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [disabled, handleFileSelect]
  )

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect]
  )

  // Handle remove
  const handleRemove = useCallback(() => {
    handleFileSelect(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    onFileRemove?.()
  }, [handleFileSelect, onFileRemove])

  // Handle click to browse
  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }, [disabled])

  // Determine display state
  const displayError = error || validationError
  const hasFile = !!value
  const isImage = value?.type.startsWith('image/')
  const isPdf = value?.type === 'application/pdf'

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <label className="text-foreground text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      {/* Drop Zone */}
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-all duration-200',
          'bg-white/[0.02]',
          // States
          isDragging && 'border-primary bg-primary/5',
          hasFile && !displayError && 'border-primary/30 bg-primary/5',
          displayError && 'border-destructive bg-destructive/5',
          uploadSuccess && 'border-[var(--color-success-500)] bg-[var(--color-success-500)]/5',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && !hasFile && 'hover:border-primary/50 cursor-pointer hover:bg-white/[0.04]',
          !hasFile && !displayError && 'border-white/[0.08]'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!hasFile ? handleClick : undefined}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
        aria-label={label || 'Upload file'}
        aria-disabled={disabled}
        aria-invalid={!!displayError}
      >
        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
          aria-hidden="true"
        />

        {/* Content */}
        <div className="p-6">
          {isUploading ? (
            // Uploading state
            <div className="flex flex-col items-center justify-center space-y-2">
              <Loader2 className="text-primary h-10 w-10 animate-spin" />
              <p className="text-muted-foreground text-sm">Uploading...</p>
            </div>
          ) : hasFile ? (
            // File selected state
            <div className="flex items-center space-x-4">
              {/* Preview or icon */}
              <div className="flex-shrink-0">
                {isImage && previewUrl ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-white/[0.08]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="File preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : isPdf ? (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[var(--color-destructive-muted)]">
                    <FileText className="h-8 w-8 text-[var(--color-danger-500)]" />
                  </div>
                ) : (
                  <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-lg">
                    <ImageIcon className="text-primary h-8 w-8" />
                  </div>
                )}
              </div>

              {/* File info */}
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-medium">{value.name}</p>
                <p className="text-muted-foreground text-xs">{formatFileSize(value.size)}</p>
                {uploadSuccess && (
                  <p className="mt-1 flex items-center text-xs text-[var(--color-success-500)]">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Uploaded successfully
                  </p>
                )}
              </div>

              {/* Remove button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
                disabled={disabled || isUploading}
                className="flex-shrink-0"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center space-y-2">
              <Upload
                className={cn('h-10 w-10', isDragging ? 'text-primary' : 'text-muted-foreground')}
              />
              <div className="text-center">
                <p className="text-foreground text-sm">
                  <span className="text-primary font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  PDF, JPG, or PNG (max {MAX_FILE_SIZE_DISPLAY})
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Always-visible file constraints */}
      {!displayError && (
        <p className="text-muted-foreground text-xs">
          Accepted formats: PDF, JPG, PNG. Maximum size: {MAX_FILE_SIZE_DISPLAY}.
        </p>
      )}

      {/* Helper text or error */}
      {(helperText || displayError) && (
        <div className="flex items-start space-x-1">
          {displayError ? (
            <>
              <AlertCircle className="text-destructive mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <p className="text-destructive text-xs">{displayError}</p>
            </>
          ) : (
            <p className="text-muted-foreground text-xs">{helperText}</p>
          )}
        </div>
      )}
    </div>
  )
}
