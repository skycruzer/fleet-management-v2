/**
 * Confirm Dialog Stories
 * Author: Maurice Rondeau
 */

import type { Meta, StoryObj } from '@storybook/react'
import { ConfirmDialog } from './confirm-dialog'
import { Button } from './button'
import { Trash2, LogOut, AlertTriangle } from 'lucide-react'

const meta = {
  title: 'UI/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Destructive: Story = {
  args: {
    trigger: (
      <Button variant="destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Pilot
      </Button>
    ),
    title: 'Delete Pilot Record',
    description:
      'This will permanently delete the pilot record and all associated certifications. This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'destructive',
    onConfirm: () => alert('Confirmed!'),
  },
}

export const Default: Story = {
  args: {
    trigger: (
      <Button variant="outline">
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    ),
    title: 'Sign Out',
    description: 'Are you sure you want to sign out? You will need to log in again.',
    confirmText: 'Sign Out',
    cancelText: 'Stay',
    variant: 'default',
    onConfirm: () => alert('Signed out!'),
  },
}

export const AsyncConfirm: Story = {
  args: {
    trigger: (
      <Button variant="destructive">
        <AlertTriangle className="mr-2 h-4 w-4" />
        Revoke Certification
      </Button>
    ),
    title: 'Revoke Certification',
    description:
      'This will mark the certification as revoked. The pilot will be notified and will need to recertify.',
    confirmText: 'Revoke',
    variant: 'destructive',
    onConfirm: () => new Promise((resolve) => setTimeout(resolve, 2000)),
  },
}
