import type { Meta, StoryObj } from '@storybook/react'
import { ErrorBoundary, withErrorBoundary } from './error-boundary'
import { Button } from './ui/button'
import { useState } from 'react'

const meta = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ErrorBoundary>

export default meta
type Story = StoryObj<typeof meta>

// Component that throws an error on demand
const BuggyComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Simulated component error for testing')
  }
  return <div className="p-4">This component works fine!</div>
}

// Component that throws on button click
const BuggyButton = () => {
  const [shouldThrow, setShouldThrow] = useState(false)
  
  if (shouldThrow) {
    throw new Error('Button click caused an error')
  }
  
  return (
    <div className="p-8 text-center">
      <p className="mb-4">Click the button to trigger an error:</p>
      <Button onClick={() => setShouldThrow(true)}>Trigger Error</Button>
    </div>
  )
}

export const Default: Story = {
  render: () => (
    <ErrorBoundary>
      <BuggyComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
}

export const WorkingComponent: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">Working Component</h2>
        <p>This component is wrapped in an ErrorBoundary but doesn't throw any errors.</p>
        <p className="mt-2 text-muted-foreground">
          The ErrorBoundary only shows fallback UI when an error is thrown.
        </p>
      </div>
    </ErrorBoundary>
  ),
}

export const InteractiveError: Story = {
  render: () => (
    <ErrorBoundary>
      <BuggyButton />
    </ErrorBoundary>
  ),
}

export const CustomFallback: Story = {
  render: () => (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
          <div className="text-center space-y-4 p-8">
            <h1 className="text-4xl font-bold text-red-600">Oops!</h1>
            <p className="text-lg text-gray-600">
              Something went wrong with this component.
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      }
    >
      <BuggyComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
}

export const WithErrorHandler: Story = {
  render: () => {
    const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
      console.log('Custom error handler:', error.message)
      console.log('Component stack:', errorInfo.componentStack)
    }

    return (
      <ErrorBoundary onError={handleError}>
        <BuggyComponent shouldThrow={true} />
      </ErrorBoundary>
    )
  },
}

export const NestedComponents: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="p-8 space-y-4">
        <h2 className="text-2xl font-bold">Nested Components Test</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Working Section 1</h3>
            <p>This section works fine</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Working Section 2</h3>
            <p>This section also works</p>
          </div>
        </div>
        <div className="border border-red-300 rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-red-600">Broken Section</h3>
          <BuggyComponent shouldThrow={true} />
        </div>
      </div>
    </ErrorBoundary>
  ),
}

export const WithHOC: Story = {
  render: () => {
    const SafeComponent = withErrorBoundary(
      () => <BuggyComponent shouldThrow={true} />,
      {
        onError: (error) => console.log('HOC caught error:', error.message),
      }
    )
    
    return <SafeComponent />
  },
}

export const PilotManagementError: Story = {
  render: () => {
    const PilotComponent = () => {
      throw new Error('Failed to load pilot data from Supabase')
    }

    return (
      <ErrorBoundary>
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">Pilot Management</h1>
          <PilotComponent />
        </div>
      </ErrorBoundary>
    )
  },
}

export const CertificationError: Story = {
  render: () => {
    const CertificationComponent = () => {
      throw new Error('Unable to calculate certification expiry dates')
    }

    return (
      <ErrorBoundary>
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">Certification Tracking</h1>
          <CertificationComponent />
        </div>
      </ErrorBoundary>
    )
  },
}
