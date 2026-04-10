/**
 * Storybook Stories for Optimistic Pilot List
 * Demonstrates optimistic UI updates in action
 */

import type { Meta, StoryObj } from '@storybook/react'
import { OptimisticPilotList } from './optimistic-pilot-list'

const meta = {
  title: 'Examples/Optimistic UI/Pilot List',
  component: OptimisticPilotList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Demonstrates optimistic UI updates for pilot management. Shows instant feedback on create/update/delete operations with automatic rollback on errors.',
      },
    },
  },
} satisfies Meta<typeof OptimisticPilotList>

export default meta
type Story = StoryObj<typeof meta>

const mockPilots = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    rank: 'Captain',
    is_active: true,
  },
  {
    id: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    rank: 'First Officer',
    is_active: true,
  },
  {
    id: '3',
    first_name: 'Robert',
    last_name: 'Johnson',
    rank: 'Captain',
    is_active: false,
  },
]

/**
 * Default state with sample pilots
 */
export const Default: Story = {
  args: {
    initialPilots: mockPilots,
  },
}

/**
 * Empty state - no pilots
 */
export const Empty: Story = {
  args: {
    initialPilots: [],
  },
}

/**
 * Single pilot
 */
export const SinglePilot: Story = {
  args: {
    initialPilots: [mockPilots[0]],
  },
}

/**
 * Many pilots to demonstrate scrolling
 */
export const ManyPilots: Story = {
  args: {
    initialPilots: [
      ...mockPilots,
      {
        id: '4',
        first_name: 'Michael',
        last_name: 'Williams',
        rank: 'Captain',
        is_active: true,
      },
      {
        id: '5',
        first_name: 'Sarah',
        last_name: 'Brown',
        rank: 'First Officer',
        is_active: true,
      },
      {
        id: '6',
        first_name: 'David',
        last_name: 'Davis',
        rank: 'Captain',
        is_active: true,
      },
    ],
  },
}

/**
 * With inactive pilots
 */
export const WithInactive: Story = {
  args: {
    initialPilots: [
      mockPilots[0],
      mockPilots[2], // inactive
      {
        id: '4',
        first_name: 'Alice',
        last_name: 'Wilson',
        rank: 'First Officer',
        is_active: false,
      },
    ],
  },
}
