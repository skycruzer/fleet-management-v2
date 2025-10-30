import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Badge',
    variant: 'default',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
}

export const Destructive: Story = {
  args: {
    children: 'Destructive',
    variant: 'destructive',
  },
}

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
}

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Active</Badge>
      <Badge variant="secondary">Inactive</Badge>
      <Badge variant="destructive">Expired</Badge>
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Current</Badge>
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Expiring Soon</Badge>
    </div>
  ),
}

export const RoleBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Captain</Badge>
      <Badge variant="secondary">First Officer</Badge>
      <Badge variant="outline">Training Captain</Badge>
      <Badge variant="outline">Examiner</Badge>
    </div>
  ),
}

export const WithCount: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <span>Pilots</span>
        <Badge>27</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span>Certifications</span>
        <Badge>598</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span>Expiring</span>
        <Badge variant="destructive">12</Badge>
      </div>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge className="text-xs">Small</Badge>
      <Badge>Medium (Default)</Badge>
      <Badge className="text-base px-3 py-1">Large</Badge>
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 font-semibold">Built-in Variants</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Custom Colors</h3>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Blue</Badge>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Green</Badge>
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Yellow</Badge>
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Red</Badge>
          <Badge className="bg-primary/10 text-primary-foreground hover:bg-primary/10">Purple</Badge>
          <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-100">Pink</Badge>
        </div>
      </div>
    </div>
  ),
}

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="dark p-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
    </div>
  ),
}
