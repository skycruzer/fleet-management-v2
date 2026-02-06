/**
 * Page Breadcrumbs Stories
 * Author: Maurice Rondeau
 */

import type { Meta, StoryObj } from '@storybook/react'
import { PageBreadcrumbs } from './page-breadcrumbs'

const meta = {
  title: 'Navigation/PageBreadcrumbs',
  component: PageBreadcrumbs,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/dashboard/pilots/edit',
      },
    },
  },
} satisfies Meta<typeof PageBreadcrumbs>

export default meta
type Story = StoryObj<typeof meta>

export const CustomItems: Story = {
  args: {
    items: [
      { label: 'Admin Dashboard', href: '/dashboard' },
      { label: 'Pilots', href: '/dashboard/pilots' },
      { label: 'John Smith' },
    ],
    showHomeIcon: true,
  },
}

export const DeepNavigation: Story = {
  args: {
    items: [
      { label: 'Admin Dashboard', href: '/dashboard' },
      { label: 'Certifications', href: '/dashboard/certifications' },
      { label: 'Expiring', href: '/dashboard/certifications/expiring' },
      { label: 'Details' },
    ],
  },
}

export const PortalBreadcrumbs: Story = {
  args: {
    items: [
      { label: 'Pilot Portal', href: '/portal' },
      { label: 'My Requests', href: '/portal/requests' },
      { label: 'New Leave Request' },
    ],
    rootPath: 'portal',
  },
}

export const SingleLevel: Story = {
  args: {
    items: [{ label: 'Admin Dashboard', href: '/dashboard' }, { label: 'Analytics' }],
    showHomeIcon: true,
  },
}

export const NoHomeIcon: Story = {
  args: {
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Pilots', href: '/dashboard/pilots' },
      { label: 'New Pilot' },
    ],
    showHomeIcon: false,
  },
}
