/**
 * Responsive Table Stories
 * Author: Maurice Rondeau
 */

import type { Meta, StoryObj } from '@storybook/react'
import { ResponsiveTable } from './responsive-table'
import type { Column, Action } from './responsive-table'
import { Badge } from './badge'

interface SamplePilot {
  id: string
  name: string
  rank: string
  seniority: number
  status: 'active' | 'inactive' | 'leave'
}

const sampleData: SamplePilot[] = [
  { id: '1', name: 'John Smith', rank: 'Captain', seniority: 3, status: 'active' },
  { id: '2', name: 'Jane Doe', rank: 'First Officer', seniority: 12, status: 'active' },
  { id: '3', name: 'Bob Wilson', rank: 'Captain', seniority: 1, status: 'leave' },
  { id: '4', name: 'Alice Brown', rank: 'First Officer', seniority: 25, status: 'inactive' },
  { id: '5', name: 'Charlie Davis', rank: 'Captain', seniority: 7, status: 'active' },
]

const columns: Column<SamplePilot>[] = [
  { id: 'name', header: 'Name', accessor: 'name', sortable: true, priority: 1 },
  { id: 'rank', header: 'Rank', accessor: 'rank', sortable: true, priority: 2 },
  { id: 'seniority', header: 'Seniority #', accessor: 'seniority', sortable: true, priority: 3 },
  {
    id: 'status',
    header: 'Status',
    accessor: 'status',
    priority: 2,
    cell: (value: unknown) => {
      const status = value as string
      const variant = status === 'active' ? 'default' : status === 'leave' ? 'secondary' : 'outline'
      return <Badge variant={variant}>{status}</Badge>
    },
  },
]

const actions: Action<SamplePilot>[] = [
  { label: 'View', onClick: (row) => alert(`View ${row.name}`) },
  { label: 'Edit', onClick: (row) => alert(`Edit ${row.name}`) },
  {
    label: 'Delete',
    onClick: (row) => alert(`Delete ${row.name}`),
    variant: 'destructive',
  },
]

const meta = {
  title: 'UI/ResponsiveTable',
  component: ResponsiveTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ResponsiveTable>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    data: sampleData,
    columns,
    keyExtractor: (row: SamplePilot) => row.id,
  },
}

export const WithActions: Story = {
  args: {
    data: sampleData,
    columns,
    actions,
    keyExtractor: (row: SamplePilot) => row.id,
  },
}

export const Loading: Story = {
  args: {
    data: [],
    columns,
    keyExtractor: (row: SamplePilot) => row.id,
    loading: true,
  },
}

export const Empty: Story = {
  args: {
    data: [],
    columns,
    keyExtractor: (row: SamplePilot) => row.id,
    emptyMessage: 'No pilots found matching your criteria',
  },
}

export const Clickable: Story = {
  args: {
    data: sampleData,
    columns,
    keyExtractor: (row: SamplePilot) => row.id,
    onRowClick: (row: SamplePilot) => alert(`Clicked ${row.name}`),
  },
}
