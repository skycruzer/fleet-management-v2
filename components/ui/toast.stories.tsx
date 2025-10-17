import type { Meta, StoryObj } from '@storybook/react'
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast'
import { Button } from './button'
import { useState } from 'react'

const meta = {
  title: 'UI/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
        <ToastViewport />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div className="space-y-4">
        <Button onClick={() => setOpen(true)}>Show Toast</Button>
        <Toast open={open} onOpenChange={setOpen}>
          <div className="grid gap-1">
            <ToastTitle>Notification</ToastTitle>
            <ToastDescription>This is a default toast message.</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
      </div>
    )
  },
}

export const Success: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div className="space-y-4">
        <Button onClick={() => setOpen(true)}>Show Success Toast</Button>
        <Toast open={open} onOpenChange={setOpen} variant="success">
          <div className="grid gap-1">
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>
              Your changes have been saved successfully.
            </ToastDescription>
          </div>
          <ToastClose />
        </Toast>
      </div>
    )
  },
}

export const Destructive: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div className="space-y-4">
        <Button onClick={() => setOpen(true)}>Show Error Toast</Button>
        <Toast open={open} onOpenChange={setOpen} variant="destructive">
          <div className="grid gap-1">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>
              Something went wrong. Please try again.
            </ToastDescription>
          </div>
          <ToastClose />
        </Toast>
      </div>
    )
  },
}

export const Warning: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div className="space-y-4">
        <Button onClick={() => setOpen(true)}>Show Warning Toast</Button>
        <Toast open={open} onOpenChange={setOpen} variant="warning">
          <div className="grid gap-1">
            <ToastTitle>Warning</ToastTitle>
            <ToastDescription>
              This action cannot be undone. Please confirm.
            </ToastDescription>
          </div>
          <ToastClose />
        </Toast>
      </div>
    )
  },
}

export const WithAction: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div className="space-y-4">
        <Button onClick={() => setOpen(true)}>Show Toast with Action</Button>
        <Toast open={open} onOpenChange={setOpen}>
          <div className="grid gap-1">
            <ToastTitle>Pilot Updated</ToastTitle>
            <ToastDescription>
              Captain John Smith's profile has been updated.
            </ToastDescription>
          </div>
          <ToastAction altText="Undo changes" onClick={() => console.log('Undo')}>
            Undo
          </ToastAction>
          <ToastClose />
        </Toast>
      </div>
    )
  },
}

export const CertificationExpiring: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div className="space-y-4">
        <Button onClick={() => setOpen(true)}>
          Show Certification Alert
        </Button>
        <Toast open={open} onOpenChange={setOpen} variant="warning">
          <div className="grid gap-1">
            <ToastTitle>Certification Expiring</ToastTitle>
            <ToastDescription>
              Line Check for Captain Smith expires in 15 days.
            </ToastDescription>
          </div>
          <ToastAction
            altText="Schedule renewal"
            onClick={() => console.log('Schedule')}
          >
            Schedule
          </ToastAction>
          <ToastClose />
        </Toast>
      </div>
    )
  },
}

export const LeaveRequestApproved: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div className="space-y-4">
        <Button onClick={() => setOpen(true)}>Show Approval Toast</Button>
        <Toast open={open} onOpenChange={setOpen} variant="success">
          <div className="grid gap-1">
            <ToastTitle>Leave Request Approved</ToastTitle>
            <ToastDescription>
              Your leave request for RP12/2025 has been approved.
            </ToastDescription>
          </div>
          <ToastAction
            altText="View details"
            onClick={() => console.log('View')}
          >
            View
          </ToastAction>
          <ToastClose />
        </Toast>
      </div>
    )
  },
}
