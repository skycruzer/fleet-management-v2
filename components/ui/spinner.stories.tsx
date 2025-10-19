/**
 * Spinner Component Stories
 * Demonstrates all spinner variants and use cases
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Spinner, CenteredSpinner, InlineSpinner, ButtonSpinner } from './spinner'
import { Card } from './card'

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    size: 'md',
    variant: 'primary',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="sm" variant="primary" />
        <span className="text-xs text-gray-600">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" variant="primary" />
        <span className="text-xs text-gray-600">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" variant="primary" />
        <span className="text-xs text-gray-600">Large</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="xl" variant="primary" />
        <span className="text-xs text-gray-600">Extra Large</span>
      </div>
    </div>
  ),
}

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" variant="primary" />
        <span className="text-xs text-gray-600">Primary</span>
      </div>
      <div className="flex flex-col items-center gap-2 bg-blue-600 p-4 rounded">
        <Spinner size="lg" variant="white" />
        <span className="text-xs text-white">White</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" variant="gray" />
        <span className="text-xs text-gray-600">Gray</span>
      </div>
    </div>
  ),
}

export const CenteredExample: Story = {
  render: () => (
    <Card className="w-96">
      <CenteredSpinner size="lg" text="Loading data..." minHeight="300px" />
    </Card>
  ),
}

export const InlineExample: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-gray-700">
        Processing your request <InlineSpinner className="ml-2" />
      </p>
      <p className="text-gray-700">
        Fetching data <InlineSpinner className="ml-2" />
      </p>
    </div>
  ),
}

export const ButtonSpinnerExample: Story = {
  render: () => (
    <div className="flex gap-4">
      <button className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2">
        <ButtonSpinner variant="white" />
        Submitting...
      </button>
      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md flex items-center gap-2">
        <ButtonSpinner variant="primary" />
        Loading...
      </button>
    </div>
  ),
}

export const LoadingStates: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Form Loading State</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          </div>
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center gap-2" disabled>
            <ButtonSpinner variant="white" />
            Submitting...
          </button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Data Loading State</h3>
        <CenteredSpinner size="md" text="Loading..." minHeight="150px" />
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Inline Loading State</h3>
        <p className="text-gray-700">
          Your request is being processed <InlineSpinner className="ml-2" />
        </p>
      </Card>
    </div>
  ),
}
