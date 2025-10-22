import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './input'
import { Label } from './label'
import { Search, Mail, Lock, User, Phone, Calendar } from 'lucide-react'

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'date', 'search'],
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="name">Full Name</Label>
      <Input id="name" placeholder="John Doe" />
    </div>
  ),
}

export const Email: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email">Email Address</Label>
      <Input id="email" type="email" placeholder="pilot@example.com" />
    </div>
  ),
}

export const Password: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="password">Password</Label>
      <Input id="password" type="password" placeholder="Enter password" />
    </div>
  ),
}

export const WithIcon: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="search" className="pl-10" placeholder="Search pilots..." />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email-icon">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email-icon" type="email" className="pl-10" placeholder="pilot@example.com" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-icon">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="password-icon" type="password" className="pl-10" placeholder="Enter password" />
        </div>
      </div>
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
    value: 'Cannot edit this',
  },
}

export const NumberInput: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="seniority">Seniority Number</Label>
      <Input id="seniority" type="number" placeholder="1" min="1" max="100" />
    </div>
  ),
}

export const DateInput: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="hire-date">Hire Date</Label>
      <Input id="hire-date" type="date" />
    </div>
  ),
}

export const PhoneInput: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="phone">Phone Number</Label>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input id="phone" type="tel" className="pl-10" placeholder="+675 123 4567" />
      </div>
    </div>
  ),
}

export const FormExample: Story = {
  render: () => (
    <form className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="first-name">First Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="first-name" className="pl-10" placeholder="John" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="last-name">Last Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="last-name" className="pl-10" placeholder="Doe" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email-form">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email-form"
            type="email"
            className="pl-10"
            placeholder="pilot@example.com"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hire-date-form">Hire Date</Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="hire-date-form" type="date" className="pl-10" required />
        </div>
      </div>
    </form>
  ),
}

export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="valid">Valid Input</Label>
        <Input
          id="valid"
          className="border-green-500 focus-visible:ring-green-500"
          placeholder="Valid input"
          defaultValue="John Doe"
        />
        <p className="text-sm text-green-600">Looks good!</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invalid">Invalid Input</Label>
        <Input
          id="invalid"
          className="border-red-500 focus-visible:ring-red-500"
          placeholder="Invalid input"
        />
        <p className="text-sm text-red-600">This field is required</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="warning">Warning Input</Label>
        <Input
          id="warning"
          className="border-yellow-500 focus-visible:ring-yellow-500"
          placeholder="Warning input"
          defaultValue="check@gmail.com"
        />
        <p className="text-sm text-yellow-600">Personal email detected. Use company email.</p>
      </div>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Small Input</Label>
        <Input className="h-8 text-sm" placeholder="Small input (h-8)" />
      </div>

      <div className="space-y-2">
        <Label>Default Input</Label>
        <Input placeholder="Default input (h-10)" />
      </div>

      <div className="space-y-2">
        <Label>Large Input</Label>
        <Input className="h-12 text-base" placeholder="Large input (h-12)" />
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
        <Label htmlFor="dark-name">Full Name</Label>
        <Input id="dark-name" placeholder="John Doe" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dark-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="dark-email" type="email" className="pl-10" placeholder="pilot@example.com" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dark-disabled">Disabled</Label>
        <Input id="dark-disabled" disabled value="Cannot edit this" />
      </div>
    </div>
  ),
}
