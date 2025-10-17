import type { Meta, StoryObj } from '@storybook/react'
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './card'
import { Button } from './button'

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the card content area where you can place any content.</p>
      </CardContent>
    </Card>
  ),
}

export const WithFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Enter your information to create a new account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Fill out the form below to get started with your new account.
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Create</Button>
      </CardFooter>
    </Card>
  ),
}

export const PilotCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Captain John Smith</CardTitle>
        <CardDescription>Seniority #5 | 15 Years of Service</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Contract Type:</span>
            <span className="text-sm text-muted-foreground">Permanent</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Status:</span>
            <span className="text-sm text-green-600">Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Certifications:</span>
            <span className="text-sm text-muted-foreground">23 Current</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Details</Button>
      </CardFooter>
    </Card>
  ),
}

export const CertificationAlert: Story = {
  render: () => (
    <Card className="w-[350px] border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <CardHeader>
        <CardTitle className="text-yellow-900 dark:text-yellow-100">
          Certification Expiring Soon
        </CardTitle>
        <CardDescription className="text-yellow-700 dark:text-yellow-300">
          Action required within 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-yellow-900 dark:text-yellow-100">
            Line Check - Captain
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Expires: December 15, 2025 (28 days)
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          Schedule Renewal
        </Button>
      </CardFooter>
    </Card>
  ),
}

export const DashboardMetric: Story = {
  render: () => (
    <Card className="w-[300px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Pilots</CardTitle>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="h-4 w-4 text-muted-foreground"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">27</div>
        <p className="text-xs text-muted-foreground">
          15 Captains, 12 First Officers
        </p>
      </CardContent>
    </Card>
  ),
}

export const ComplexLayout: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Active Pilots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">25</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>On Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Certifications Due</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">8</div>
        </CardContent>
      </Card>
    </div>
  ),
}
