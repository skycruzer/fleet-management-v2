import type { Meta, StoryObj } from '@storybook/react'
import { Toaster } from './toaster'
import { Button } from './button'
import { useToast } from '@/hooks/use-toast'

const meta = {
  title: 'UI/Toaster',
  component: Toaster,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

// Demo component that uses the toast hook
const ToasterDemo = () => {
  const { toast } = useToast()

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Toast Notification System</h1>
        
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => {
              toast({
                title: 'Default Toast',
                description: 'This is a default notification.',
              })
            }}
          >
            Default Toast
          </Button>

          <Button
            variant="secondary"
            onClick={() => {
              toast({
                title: 'Success',
                description: 'Operation completed successfully.',
                variant: 'success',
              })
            }}
          >
            Success Toast
          </Button>

          <Button
            variant="destructive"
            onClick={() => {
              toast({
                title: 'Error',
                description: 'Something went wrong.',
                variant: 'destructive',
              })
            }}
          >
            Error Toast
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              toast({
                title: 'Warning',
                description: 'Please review before continuing.',
                variant: 'warning',
              })
            }}
          >
            Warning Toast
          </Button>
        </div>

        <div className="pt-4">
          <Button
            className="w-full"
            onClick={() => {
              toast({
                title: 'With Action',
                description: 'You can undo this action.',
                action: (
                  <Button size="sm" variant="outline">
                    Undo
                  </Button>
                ),
              })
            }}
          >
            Toast with Action
          </Button>
        </div>

        <div className="pt-4">
          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              for (let i = 1; i <= 3; i++) {
                setTimeout(() => {
                  toast({
                    title: `Toast ${i}`,
                    description: `This is notification number ${i}`,
                  })
                }, i * 500)
              }
            }}
          >
            Show Multiple Toasts
          </Button>
        </div>
      </div>
      <Toaster />
    </div>
  )
}

export const Default: Story = {
  render: () => <ToasterDemo />,
}

export const PilotUpdated: Story = {
  render: () => {
    const { toast } = useToast()

    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Pilot Management Actions</h2>
          <Button
            onClick={() => {
              toast({
                title: 'Pilot Updated',
                description: 'Captain John Smith profile has been updated.',
                variant: 'success',
              })
            }}
          >
            Update Pilot
          </Button>
        </div>
        <Toaster />
      </div>
    )
  },
}

export const CertificationAlert: Story = {
  render: () => {
    const { toast } = useToast()

    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Certification Alerts</h2>
          <Button
            variant="outline"
            onClick={() => {
              toast({
                title: 'Certification Expiring',
                description: 'Line Check for Capt. Smith expires in 15 days.',
                variant: 'warning',
                action: (
                  <Button size="sm">Schedule</Button>
                ),
              })
            }}
          >
            Show Expiry Alert
          </Button>
        </div>
        <Toaster />
      </div>
    )
  },
}

export const LeaveRequest: Story = {
  render: () => {
    const { toast } = useToast()

    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Leave Request Actions</h2>
          <div className="space-x-2">
            <Button
              onClick={() => {
                toast({
                  title: 'Leave Request Submitted',
                  description: 'Your request for RP12/2025 has been submitted.',
                  variant: 'success',
                })
              }}
            >
              Submit Request
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                toast({
                  title: 'Leave Request Approved',
                  description: 'Your leave for RP12/2025 has been approved.',
                  variant: 'success',
                  action: (
                    <Button size="sm" variant="outline">View</Button>
                  ),
                })
              }}
            >
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                toast({
                  title: 'Leave Request Denied',
                  description: 'Minimum crew requirements not met.',
                  variant: 'destructive',
                })
              }}
            >
              Deny
            </Button>
          </div>
        </div>
        <Toaster />
      </div>
    )
  },
}
