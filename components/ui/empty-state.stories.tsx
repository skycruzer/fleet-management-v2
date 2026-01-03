import type { Meta, StoryObj } from '@storybook/react'
import { EmptyState } from './empty-state'
import { Users, FileText, Calendar, Search, Inbox } from 'lucide-react'

const meta = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'No items found',
    description: 'Get started by adding your first item.',
  },
}

export const WithIcon: Story = {
  args: {
    icon: Users,
    title: 'No pilots found',
    description: 'Add pilots to start managing your fleet.',
  },
}

export const WithAction: Story = {
  args: {
    icon: FileText,
    title: 'No certifications found',
    description: 'Get started by adding certifications to track pilot qualifications.',
    action: {
      label: 'Add Certification',
      href: '/dashboard/certifications/new',
    },
  },
}

export const WithButtonAction: Story = {
  args: {
    icon: Calendar,
    title: 'No leave requests',
    description: 'Submit a leave request to get started.',
    action: {
      label: 'Submit Request',
      onClick: () => alert('Submit request clicked!'),
    },
  },
}

export const SearchEmpty: Story = {
  args: {
    icon: Search,
    title: 'No results found',
    description:
      'We couldn\'t find anything matching "John Smith". Try adjusting your search terms.',
  },
}

export const InboxEmpty: Story = {
  args: {
    icon: Inbox,
    title: 'All caught up!',
    description: 'You have no pending notifications at this time.',
  },
}

export const MultipleSizes: Story = {
  render: () => (
    <div className="space-y-8 p-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-4 font-semibold">Compact</h3>
        <EmptyState icon={Users} title="No pilots" description="Add your first pilot." />
      </div>
      <div className="rounded-lg border p-8">
        <h3 className="mb-4 font-semibold">Default</h3>
        <EmptyState
          icon={FileText}
          title="No certifications found"
          description="Get started by adding certifications to track pilot qualifications and expiry dates."
          action={{
            label: 'Add Certification',
            href: '#',
          }}
        />
      </div>
    </div>
  ),
}

export const DifferentScenarios: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2">
      <div className="rounded-lg border p-6">
        <EmptyState
          icon={Users}
          title="No active pilots"
          description="All pilots are currently inactive."
          action={{
            label: 'View All Pilots',
            href: '#',
          }}
        />
      </div>
      <div className="rounded-lg border p-6">
        <EmptyState
          icon={Calendar}
          title="No pending requests"
          description="All leave requests have been reviewed."
        />
      </div>
      <div className="rounded-lg border p-6">
        <EmptyState
          icon={Search}
          title="No search results"
          description="Try searching for something else."
          action={{
            label: 'Clear Search',
            onClick: () => alert('Search cleared!'),
          }}
        />
      </div>
      <div className="rounded-lg border p-6">
        <EmptyState
          icon={FileText}
          title="No documents"
          description="Upload your first document to get started."
          action={{
            label: 'Upload Document',
            onClick: () => alert('Upload clicked!'),
          }}
        />
      </div>
    </div>
  ),
}

export const InCard: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl rounded-lg border p-8">
      <EmptyState
        icon={Users}
        title="No pilots in this category"
        description="There are no pilots matching the selected filters. Try adjusting your filter criteria or add new pilots to the system."
        action={{
          label: 'Add Pilot',
          href: '#',
        }}
      />
    </div>
  ),
}

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="dark rounded-lg bg-slate-900 p-8">
      <EmptyState
        icon={Users}
        title="No pilots found"
        description="Get started by adding your first pilot to the fleet management system."
        action={{
          label: 'Add Pilot',
          href: '#',
        }}
      />
    </div>
  ),
}
