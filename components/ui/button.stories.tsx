import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
}

export const Destructive: Story = {
  args: {
    children: 'Destructive',
    variant: 'destructive',
  },
}

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
}

export const Ghost: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
  },
}

export const Link: Story = {
  args: {
    children: 'Link',
    variant: 'link',
  },
}

export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
}

export const Large: Story = {
  args: {
    children: 'Large',
    size: 'lg',
  },
}

export const Icon: Story = {
  args: {
    children: '→',
    size: 'icon',
  },
}

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
}

export const Loading: Story = {
  args: {
    children: 'Submit',
    loading: true,
  },
}

export const LoadingWithText: Story = {
  args: {
    children: 'Submit Form',
    loading: true,
    loadingText: 'Submitting...',
  },
}

export const LoadingOutline: Story = {
  args: {
    children: 'Save',
    variant: 'outline',
    loading: true,
  },
}

export const LoadingDestructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive',
    loading: true,
    loadingText: 'Deleting...',
  },
}

export const AllLoadingStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button loading>Default Loading</Button>
        <Button variant="outline" loading>
          Outline Loading
        </Button>
        <Button variant="secondary" loading>
          Secondary Loading
        </Button>
        <Button variant="destructive" loading>
          Destructive Loading
        </Button>
      </div>
      <div className="flex gap-4">
        <Button loading loadingText="Processing...">
          Submit
        </Button>
        <Button variant="outline" loading loadingText="Saving...">
          Save
        </Button>
        <Button variant="destructive" loading loadingText="Deleting...">
          Delete
        </Button>
      </div>
    </div>
  ),
}
