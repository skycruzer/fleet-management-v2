import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Pagination } from './pagination'

const meta = {
  title: 'UI/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

// Helper component for interactive stories
function PaginationDemo({
  totalItems = 100,
  initialPageSize = 25,
}: {
  totalItems?: number
  initialPageSize?: number
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalPages = Math.ceil(totalItems / pageSize)

  return (
    <div className="space-y-4">
      <div className="text-muted-foreground text-center text-sm">
        Page {currentPage} of {totalPages} ({totalItems} items total)
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}

export const Default: Story = {
  render: () => <PaginationDemo />,
}

export const SmallDataset: Story = {
  render: () => <PaginationDemo totalItems={30} initialPageSize={10} />,
}

export const LargeDataset: Story = {
  render: () => <PaginationDemo totalItems={1000} initialPageSize={25} />,
}

export const FePages: Story = {
  render: () => <PaginationDemo totalItems={15} initialPageSize={10} />,
}

export const SinglePage: Story = {
  render: () => <PaginationDemo totalItems={10} initialPageSize={25} />,
}

export const ManyPages: Story = {
  render: () => <PaginationDemo totalItems={5000} initialPageSize={25} />,
}

export const DifferentPageSizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 font-semibold">10 items per page</h3>
        <PaginationDemo totalItems={100} initialPageSize={10} />
      </div>
      <div>
        <h3 className="mb-4 font-semibold">25 items per page</h3>
        <PaginationDemo totalItems={100} initialPageSize={25} />
      </div>
      <div>
        <h3 className="mb-4 font-semibold">50 items per page</h3>
        <PaginationDemo totalItems={100} initialPageSize={50} />
      </div>
      <div>
        <h3 className="mb-4 font-semibold">100 items per page</h3>
        <PaginationDemo totalItems={100} initialPageSize={100} />
      </div>
    </div>
  ),
}

export const EdgeCases: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 font-semibold">No items</h3>
        <PaginationDemo totalItems={0} initialPageSize={25} />
      </div>
      <div>
        <h3 className="mb-4 font-semibold">Exactly one page</h3>
        <PaginationDemo totalItems={25} initialPageSize={25} />
      </div>
      <div>
        <h3 className="mb-4 font-semibold">One more item than page size</h3>
        <PaginationDemo totalItems={26} initialPageSize={25} />
      </div>
    </div>
  ),
}

// Table demo component extracted to comply with React hooks rules
function TablePaginationDemo() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const allItems = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    status: i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'Pending' : 'Inactive',
  }))

  const totalPages = Math.ceil(allItems.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentItems = allItems.slice(startIndex, endIndex)

  return (
    <div className="w-full max-w-2xl space-y-4">
      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-2">{item.id}</td>
                <td className="p-2">{item.name}</td>
                <td className="p-2">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={allItems.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize)
          setCurrentPage(1) // Reset to first page when changing page size
        }}
      />
    </div>
  )
}

export const WithTable: Story = {
  render: () => <TablePaginationDemo />,
}

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => <PaginationDemo />,
}

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="dark">
      <PaginationDemo />
    </div>
  ),
}
