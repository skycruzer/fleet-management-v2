/**
 * File Upload Stories
 * Author: Maurice Rondeau
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { FileUpload } from './file-upload'

const meta = {
  title: 'UI/FileUpload',
  component: FileUpload,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FileUpload>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Medical Certificate',
    helperText: 'Upload your latest medical certificate for verification',
    onFileSelect: () => {},
  },
}

export const Required: Story = {
  args: {
    label: 'Medical Certificate',
    required: true,
    helperText: 'This document is required for certification renewal',
    onFileSelect: () => {},
  },
}

export const WithError: Story = {
  args: {
    label: 'Upload Document',
    error: 'File size exceeds the maximum allowed limit of 5MB',
    onFileSelect: () => {},
  },
}

export const Uploading: Story = {
  args: {
    label: 'Medical Certificate',
    isUploading: true,
    onFileSelect: () => {},
  },
}

export const Disabled: Story = {
  args: {
    label: 'Upload Document',
    disabled: true,
    helperText: 'Uploads are currently disabled',
    onFileSelect: () => {},
  },
}

function InteractiveUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSelect = (f: File | null) => {
    setFile(f)
    setSuccess(false)
    if (f) {
      // Simulate upload
      setTimeout(() => setSuccess(true), 1500)
    }
  }

  return (
    <div className="w-[400px]">
      <FileUpload
        label="Medical Certificate"
        helperText="Upload PDF, JPG, or PNG"
        value={file}
        onFileSelect={handleSelect}
        onFileRemove={() => {
          setFile(null)
          setSuccess(false)
        }}
        uploadSuccess={success}
      />
    </div>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveUpload />,
}
