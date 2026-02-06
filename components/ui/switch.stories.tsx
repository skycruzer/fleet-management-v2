/**
 * Switch Stories
 * Author: Maurice Rondeau
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Switch } from './switch'

const meta = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    disabled: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
  },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const DisabledChecked: Story = {
  args: {
    defaultChecked: true,
    disabled: true,
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="notifications" />
      <label htmlFor="notifications" className="text-sm font-medium">
        Enable notifications
      </label>
    </div>
  ),
}

export const SettingsExample: Story = {
  render: () => (
    <div className="w-[300px] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Email Alerts</p>
          <p className="text-muted-foreground text-xs">Receive certification expiry alerts</p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Auto-refresh</p>
          <p className="text-muted-foreground text-xs">Keep dashboard data up to date</p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Dark Mode</p>
          <p className="text-muted-foreground text-xs">Use dark color scheme</p>
        </div>
        <Switch />
      </div>
    </div>
  ),
}
