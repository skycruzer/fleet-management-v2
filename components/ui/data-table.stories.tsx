import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { DataTable, DataTableSearch, useTableFilter, type Column } from './data-table'
import { Badge } from './badge'

const meta = {
  title: 'UI/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof DataTable>

export default meta
type Story = StoryObj<typeof meta>

// Sample data types
interface Pilot {
  id: string
  name: string
  role: 'Captain' | 'First Officer'
  status: 'active' | 'inactive' | 'on-leave'
  seniority: number
}

interface Certification {
  id: string
  pilot: string
  checkType: string
  expiryDate: string
  daysUntil: number
  status: 'current' | 'expiring' | 'expired'
}

// Sample pilot data
const pilotData: Pilot[] = [
  { id: '1', name: 'John Doe', role: 'Captain', status: 'active', seniority: 1 },
  { id: '2', name: 'Jane Smith', role: 'First Officer', status: 'active', seniority: 5 },
  { id: '3', name: 'Bob Johnson', role: 'Captain', status: 'on-leave', seniority: 3 },
  { id: '4', name: 'Alice Williams', role: 'First Officer', status: 'active', seniority: 8 },
  { id: '5', name: 'Charlie Brown', role: 'Captain', status: 'inactive', seniority: 2 },
  { id: '6', name: 'Diana Prince', role: 'First Officer', status: 'active', seniority: 12 },
  { id: '7', name: 'Edward Norton', role: 'Captain', status: 'active', seniority: 4 },
  { id: '8', name: 'Fiona Green', role: 'First Officer', status: 'active', seniority: 15 },
]

// Sample certification data
const certificationData: Certification[] = [
  {
    id: '1',
    pilot: 'John Doe',
    checkType: 'Pilot License',
    expiryDate: '2026-03-15',
    daysUntil: 450,
    status: 'current',
  },
  {
    id: '2',
    pilot: 'Jane Smith',
    checkType: 'Medical Class 1',
    expiryDate: '2025-12-10',
    daysUntil: 25,
    status: 'expiring',
  },
  {
    id: '3',
    pilot: 'Bob Johnson',
    checkType: 'Proficiency Check',
    expiryDate: '2025-11-01',
    daysUntil: -15,
    status: 'expired',
  },
  {
    id: '4',
    pilot: 'Alice Williams',
    checkType: 'Line Check',
    expiryDate: '2026-06-20',
    daysUntil: 550,
    status: 'current',
  },
  {
    id: '5',
    pilot: 'Charlie Brown',
    checkType: 'Simulator Check',
    expiryDate: '2025-12-31',
    daysUntil: 46,
    status: 'current',
  },
]

// Pilot columns
const pilotColumns: Column<Pilot>[] = [
  {
    id: 'seniority',
    header: 'Seniority',
    accessorKey: 'seniority',
    sortable: true,
  },
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    sortable: true,
  },
  {
    id: 'role',
    header: 'Role',
    accessorKey: 'role',
    sortable: true,
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: (row) => {
      const variant =
        row.status === 'active' ? 'default' : row.status === 'on-leave' ? 'secondary' : 'outline'
      return <Badge variant={variant}>{row.status}</Badge>
    },
  },
]

// Certification columns
const certificationColumns: Column<Certification>[] = [
  {
    id: 'pilot',
    header: 'Pilot',
    accessorKey: 'pilot',
    sortable: true,
  },
  {
    id: 'checkType',
    header: 'Check Type',
    accessorKey: 'checkType',
    sortable: true,
  },
  {
    id: 'expiryDate',
    header: 'Expiry Date',
    accessorKey: 'expiryDate',
    sortable: true,
  },
  {
    id: 'daysUntil',
    header: 'Days Until',
    accessorKey: 'daysUntil',
    sortable: true,
    cell: (row) => {
      if (row.daysUntil < 0) {
        return (
          <span className="font-semibold text-[var(--color-danger-600)]">
            {row.daysUntil} (Expired)
          </span>
        )
      }
      if (row.daysUntil <= 30) {
        return (
          <span className="font-semibold text-[var(--color-warning-600)]">{row.daysUntil}</span>
        )
      }
      return <span className="text-[var(--color-success-600)]">{row.daysUntil}</span>
    },
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: (row) => {
      const className =
        row.status === 'current'
          ? 'bg-[var(--color-success-muted)] text-[var(--color-success-500)]'
          : row.status === 'expiring'
            ? 'bg-[var(--color-warning-muted)] text-[var(--color-warning-500)]'
            : 'bg-[var(--color-destructive-muted)] text-[var(--color-danger-500)]'
      return <Badge className={className}>{row.status}</Badge>
    },
  },
]

export const Default: Story = {
  args: {
    data: pilotData,
    columns: pilotColumns,
  },
}

export const WithSorting: Story = {
  args: {
    data: pilotData,
    columns: pilotColumns.map((col) => ({ ...col, sortable: true })),
  },
}

export const WithRowClick: Story = {
  args: {
    data: pilotData,
    columns: pilotColumns,
    onRowClick: (row) => alert(`Clicked: ${row.name}`),
  },
}

export const EmptyState: Story = {
  args: {
    data: [],
    columns: pilotColumns,
    emptyMessage: 'No pilots found. Add your first pilot to get started.',
  },
}

export const CertificationsTable: Story = {
  args: {
    data: certificationData,
    columns: certificationColumns,
  },
}

export const WithPagination: Story = {
  args: {
    data: pilotData,
    columns: pilotColumns,
    enablePagination: true,
    initialPageSize: 5,
  },
}

export const LargeDataset: Story = {
  args: {
    data: Array.from({ length: 100 }, (_, i) => ({
      id: String(i + 1),
      name: `Pilot ${i + 1}`,
      role: i % 2 === 0 ? ('Captain' as const) : ('First Officer' as const),
      status:
        i % 3 === 0
          ? ('active' as const)
          : i % 3 === 1
            ? ('inactive' as const)
            : ('on-leave' as const),
      seniority: i + 1,
    })),
    columns: pilotColumns,
    enablePagination: true,
    initialPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100],
  },
}

export const WithSearch: Story = {
  render: function WithSearchStory() {
    const { filteredData, filterQuery, setFilterQuery } = useTableFilter(
      pilotData,
      (pilot, query) =>
        pilot.name.toLowerCase().includes(query) || pilot.role.toLowerCase().includes(query)
    )

    return (
      <div className="space-y-4">
        <DataTableSearch
          value={filterQuery}
          onChange={setFilterQuery}
          placeholder="Search pilots by name or role..."
          className="max-w-sm"
        />
        <DataTable
          data={filteredData}
          columns={pilotColumns}
          emptyMessage="No pilots found matching your search."
        />
      </div>
    )
  },
}

export const WithSearchAndPagination: Story = {
  render: function WithSearchAndPaginationStory() {
    const largeDataset = Array.from({ length: 50 }, (_, i) => ({
      id: String(i + 1),
      name: `Pilot ${i + 1}`,
      role: i % 2 === 0 ? ('Captain' as const) : ('First Officer' as const),
      status:
        i % 3 === 0
          ? ('active' as const)
          : i % 3 === 1
            ? ('inactive' as const)
            : ('on-leave' as const),
      seniority: i + 1,
    }))

    const { filteredData, filterQuery, setFilterQuery } = useTableFilter(
      largeDataset,
      (pilot, query) =>
        pilot.name.toLowerCase().includes(query) || pilot.role.toLowerCase().includes(query)
    )

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <DataTableSearch
            value={filterQuery}
            onChange={setFilterQuery}
            placeholder="Search pilots..."
            className="max-w-sm"
          />
          <p className="text-muted-foreground text-sm">
            {filteredData.length} pilot{filteredData.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <DataTable
          data={filteredData}
          columns={pilotColumns}
          enablePagination
          initialPageSize={10}
          pageSizeOptions={[5, 10, 25, 50]}
          emptyMessage="No pilots found matching your search."
        />
      </div>
    )
  },
}

export const CustomCellRendering: Story = {
  args: {
    data: certificationData,
    columns: certificationColumns,
  },
}

export const InteractiveSorting: Story = {
  render: function InteractiveSortingStory() {
    return (
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">Try sorting</h3>
          <p className="text-muted-foreground text-sm">
            Click on column headers to sort. Click again to reverse order, and a third time to clear
            sorting.
          </p>
        </div>
        <DataTable data={pilotData} columns={pilotColumns} />
      </div>
    )
  },
}

export const CompleteExample: Story = {
  render: function CompleteExampleStory() {
    const [selectedPilot, setSelectedPilot] = useState<Pilot | null>(null)

    const { filteredData, filterQuery, setFilterQuery } = useTableFilter(
      pilotData,
      (pilot, query) =>
        pilot.name.toLowerCase().includes(query) ||
        pilot.role.toLowerCase().includes(query) ||
        pilot.status.toLowerCase().includes(query)
    )

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Pilots Management</h2>
          <Badge>{filteredData.length} pilots</Badge>
        </div>

        <DataTableSearch
          value={filterQuery}
          onChange={setFilterQuery}
          placeholder="Search pilots by name, role, or status..."
          className="max-w-sm"
        />

        <DataTable
          data={filteredData}
          columns={pilotColumns}
          onRowClick={setSelectedPilot}
          emptyMessage="No pilots found. Try adjusting your search."
          enablePagination
          initialPageSize={5}
        />

        {selectedPilot && (
          <div className="bg-muted/50 rounded-lg border p-4">
            <h3 className="mb-2 font-semibold">Selected Pilot</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Name:</span> {selectedPilot.name}
              </p>
              <p>
                <span className="font-medium">Role:</span> {selectedPilot.role}
              </p>
              <p>
                <span className="font-medium">Seniority:</span> #{selectedPilot.seniority}
              </p>
              <p>
                <span className="font-medium">Status:</span> {selectedPilot.status}
              </p>
            </div>
          </div>
        )}
      </div>
    )
  },
}

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="dark p-4">
      <DataTable data={pilotData} columns={pilotColumns} enablePagination initialPageSize={5} />
    </div>
  ),
}
