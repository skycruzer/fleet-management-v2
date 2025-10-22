import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select'
import { Label } from './label'

const meta = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="role">Pilot Role</Label>
      <Select>
        <SelectTrigger id="role" className="w-[200px]">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="captain">Captain</SelectItem>
          <SelectItem value="first-officer">First Officer</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const PilotRole: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="pilot-role">Pilot Role</Label>
      <Select defaultValue="captain">
        <SelectTrigger id="pilot-role" className="w-[250px]">
          <SelectValue placeholder="Select pilot role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="captain">Captain</SelectItem>
          <SelectItem value="first-officer">First Officer</SelectItem>
          <SelectItem value="training-captain">Training Captain</SelectItem>
          <SelectItem value="examiner">Examiner</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const CheckType: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="check-type">Check Type</Label>
      <Select>
        <SelectTrigger id="check-type" className="w-[300px]">
          <SelectValue placeholder="Select check type" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>License & Medical</SelectLabel>
            <SelectItem value="license">Pilot License</SelectItem>
            <SelectItem value="medical-class-1">Medical Class 1</SelectItem>
            <SelectItem value="passport">Passport</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Type Ratings</SelectLabel>
            <SelectItem value="b767-type">B767 Type Rating</SelectItem>
            <SelectItem value="b737-type">B737 Type Rating</SelectItem>
            <SelectItem value="a320-type">A320 Type Rating</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Training Checks</SelectLabel>
            <SelectItem value="proficiency-check">Proficiency Check</SelectItem>
            <SelectItem value="line-check">Line Check</SelectItem>
            <SelectItem value="simulator-check">Simulator Check</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const LeaveType: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="leave-type">Leave Type</Label>
      <Select>
        <SelectTrigger id="leave-type" className="w-[250px]">
          <SelectValue placeholder="Select leave type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="annual">Annual Leave</SelectItem>
          <SelectItem value="sick">Sick Leave</SelectItem>
          <SelectItem value="compassionate">Compassionate Leave</SelectItem>
          <SelectItem value="study">Study Leave</SelectItem>
          <SelectItem value="maternity">Maternity Leave</SelectItem>
          <SelectItem value="paternity">Paternity Leave</SelectItem>
          <SelectItem value="unpaid">Unpaid Leave</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const Status: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="status">Status</Label>
      <Select defaultValue="active">
        <SelectTrigger id="status" className="w-[200px]">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="on-leave">On Leave</SelectItem>
          <SelectItem value="suspended">Suspended</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const PageSize: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="page-size">Items per page</Label>
      <Select defaultValue="25">
        <SelectTrigger id="page-size" className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="25">25</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="disabled">Disabled Select</Label>
      <Select disabled>
        <SelectTrigger id="disabled" className="w-[200px]">
          <SelectValue placeholder="Cannot select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const DisabledOption: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="disabled-option">Select with Disabled Option</Label>
      <Select>
        <SelectTrigger id="disabled-option" className="w-[250px]">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="captain">Captain</SelectItem>
          <SelectItem value="first-officer">First Officer</SelectItem>
          <SelectItem value="training-captain" disabled>
            Training Captain (Not Qualified)
          </SelectItem>
          <SelectItem value="examiner" disabled>
            Examiner (Not Qualified)
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const Interactive: Story = {
  render: function InteractiveSelect() {
    const [role, setRole] = useState<string>('')

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="interactive">Select Pilot Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="interactive" className="w-[250px]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="captain">Captain</SelectItem>
              <SelectItem value="first-officer">First Officer</SelectItem>
              <SelectItem value="training-captain">Training Captain</SelectItem>
              <SelectItem value="examiner">Examiner</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {role && (
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Selected value:</p>
            <p className="font-mono text-lg font-semibold">{role}</p>
          </div>
        )}
      </div>
    )
  },
}

export const LongList: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="country">Country</Label>
      <Select>
        <SelectTrigger id="country" className="w-[250px]">
          <SelectValue placeholder="Select country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="au">Australia</SelectItem>
          <SelectItem value="ca">Canada</SelectItem>
          <SelectItem value="fj">Fiji</SelectItem>
          <SelectItem value="fr">France</SelectItem>
          <SelectItem value="de">Germany</SelectItem>
          <SelectItem value="in">India</SelectItem>
          <SelectItem value="id">Indonesia</SelectItem>
          <SelectItem value="jp">Japan</SelectItem>
          <SelectItem value="nz">New Zealand</SelectItem>
          <SelectItem value="pg">Papua New Guinea</SelectItem>
          <SelectItem value="ph">Philippines</SelectItem>
          <SelectItem value="sg">Singapore</SelectItem>
          <SelectItem value="za">South Africa</SelectItem>
          <SelectItem value="kr">South Korea</SelectItem>
          <SelectItem value="es">Spain</SelectItem>
          <SelectItem value="gb">United Kingdom</SelectItem>
          <SelectItem value="us">United States</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const MultipleSelects: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="pilot-name">Pilot</Label>
        <Select>
          <SelectTrigger id="pilot-name" className="w-full">
            <SelectValue placeholder="Select pilot" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pilot-1">John Doe (Captain)</SelectItem>
            <SelectItem value="pilot-2">Jane Smith (First Officer)</SelectItem>
            <SelectItem value="pilot-3">Bob Johnson (Captain)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="check-type-multi">Check Type</Label>
        <Select>
          <SelectTrigger id="check-type-multi" className="w-full">
            <SelectValue placeholder="Select check type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="license">Pilot License</SelectItem>
            <SelectItem value="medical">Medical Class 1</SelectItem>
            <SelectItem value="proficiency">Proficiency Check</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status-multi">Status</Label>
        <Select defaultValue="current">
          <SelectTrigger id="status-multi" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current</SelectItem>
            <SelectItem value="expiring">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
}

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="dark p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dark-role">Pilot Role</Label>
        <Select defaultValue="captain">
          <SelectTrigger id="dark-role" className="w-[250px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="captain">Captain</SelectItem>
            <SelectItem value="first-officer">First Officer</SelectItem>
            <SelectItem value="training-captain">Training Captain</SelectItem>
            <SelectItem value="examiner">Examiner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dark-status">Status</Label>
        <Select>
          <SelectTrigger id="dark-status" className="w-[250px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="on-leave">On Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
}
