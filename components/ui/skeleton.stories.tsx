import type { Meta, StoryObj } from '@storybook/react'
import {
  Skeleton,
  PilotListSkeleton,
  CardGridSkeleton,
  TableSkeleton,
  FormSkeleton,
  MetricCardSkeleton,
  ChartSkeleton,
  DetailPageSkeleton,
  PageSkeleton,
} from './skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
}

export const Circle: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  ),
}

export const PilotList: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Pilots</CardTitle>
        <CardDescription>Loading pilot list...</CardDescription>
      </CardHeader>
      <CardContent>
        <PilotListSkeleton count={3} />
      </CardContent>
    </Card>
  ),
}

export const CardGrid: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dashboard Widgets</h2>
      <CardGridSkeleton count={6} />
    </div>
  ),
}

export const Table: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Data Table</CardTitle>
        <CardDescription>Loading table data...</CardDescription>
      </CardHeader>
      <CardContent>
        <TableSkeleton rows={5} columns={4} />
      </CardContent>
    </Card>
  ),
}

export const Form: Story = {
  render: () => (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Edit Form</CardTitle>
        <CardDescription>Loading form fields...</CardDescription>
      </CardHeader>
      <CardContent>
        <FormSkeleton fields={5} />
      </CardContent>
    </Card>
  ),
}

export const MetricCards: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dashboard Metrics</h2>
      <MetricCardSkeleton count={4} />
    </div>
  ),
}

export const Chart: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Analytics Chart</h2>
      <ChartSkeleton height={300} />
    </div>
  ),
}

export const DetailPage: Story = {
  render: () => (
    <div className="mx-auto max-w-6xl p-6">
      <DetailPageSkeleton />
    </div>
  ),
}

export const FullPage: Story = {
  render: () => <PageSkeleton />,
}

export const CustomSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Custom Skeleton Sizes</h2>
      <div className="space-y-2">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  ),
}

export const ResponsiveGrid: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Responsive Loading Grid</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-card space-y-3 rounded-lg border p-4">
            <Skeleton className="h-32 w-full rounded" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  ),
}
