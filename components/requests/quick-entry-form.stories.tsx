/**
 * Quick Entry Form Storybook Stories
 *
 * @author Maurice Rondeau
 */

import type { Meta, StoryObj } from '@storybook/react'
import { QuickEntryForm } from './quick-entry-form'

const meta = {
  title: 'Requests/QuickEntryForm',
  component: QuickEntryForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof QuickEntryForm>

export default meta
type Story = StoryObj<typeof meta>

// Mock pilot data
const mockPilots = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    first_name: 'John',
    middle_name: 'A',
    last_name: 'Smith',
    employee_id: 'PX-001',
    role: 'Captain' as const,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    first_name: 'Sarah',
    middle_name: null,
    last_name: 'Johnson',
    employee_id: 'PX-002',
    role: 'First Officer' as const,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    first_name: 'Michael',
    middle_name: 'B',
    last_name: 'Williams',
    employee_id: 'PX-003',
    role: 'Captain' as const,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    first_name: 'Emily',
    middle_name: null,
    last_name: 'Davis',
    employee_id: 'PX-004',
    role: 'First Officer' as const,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    first_name: 'Robert',
    middle_name: 'C',
    last_name: 'Brown',
    employee_id: 'PX-005',
    role: 'Captain' as const,
  },
]

export const Default: Story = {
  args: {
    pilots: mockPilots,
  },
}

export const WithCallbacks: Story = {
  args: {
    pilots: mockPilots,
    onSuccess: () => {
      console.log('Form submitted successfully!')
      alert('Request submitted successfully!')
    },
    onCancel: () => {
      console.log('Form cancelled')
      alert('Form cancelled')
    },
  },
}

export const SmallPilotList: Story = {
  args: {
    pilots: mockPilots.slice(0, 2),
  },
}

export const SinglePilot: Story = {
  args: {
    pilots: [mockPilots[0]],
  },
}
