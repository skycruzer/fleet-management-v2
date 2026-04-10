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
      <Badge className="bg-[var(--color-success-muted)] text-[var(--color-success-500)] hover:bg-[var(--color-success-muted)]">
        Current
      </Badge>
      <Badge className="bg-[var(--color-warning-muted)] text-[var(--color-warning-500)] hover:bg-[var(--color-warning-muted)]">
        Expiring Soon
      </Badge>
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
      <Badge className="px-3 py-1 text-base">Large</Badge>
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
          <Badge className="bg-[var(--color-info-bg)] text-[var(--color-primary-600)] hover:bg-[var(--color-info-bg)]">
            Blue
          </Badge>
          <Badge className="bg-[var(--color-success-muted)] text-[var(--color-success-500)] hover:bg-[var(--color-success-muted)]">
            Green
          </Badge>
          <Badge className="bg-[var(--color-warning-muted)] text-[var(--color-warning-500)] hover:bg-[var(--color-warning-muted)]">
            Yellow
          </Badge>
          <Badge className="bg-[var(--color-destructive-muted)] text-[var(--color-danger-500)] hover:bg-[var(--color-destructive-muted)]">
            Red
          </Badge>
          <Badge className="bg-primary/10 text-primary-foreground hover:bg-primary/10">
            Purple
          </Badge>
          <Badge className="bg-[var(--color-status-high-bg)] text-[var(--color-status-high)] hover:bg-[var(--color-status-high-bg)]">
            Pink
          </Badge>
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
