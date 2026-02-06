/**
 * Collapsible Stories
 * Author: Maurice Rondeau
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'
import { ChevronDown, AlertTriangle, Settings } from 'lucide-react'
import { Button } from './button'

const meta = {
  title: 'UI/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Collapsible className="w-[350px] space-y-2">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="flex w-full justify-between">
          <span>Toggle Section</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-md border p-4">
        <p className="text-muted-foreground text-sm">
          This content is inside a collapsible section. It can be expanded or collapsed by clicking
          the trigger above.
        </p>
      </CollapsibleContent>
    </Collapsible>
  ),
}

export const DefaultOpen: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-[350px] space-y-2">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="flex w-full justify-between">
          <span>Expanded by Default</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-md border p-4">
        <p className="text-muted-foreground text-sm">
          This section starts in an expanded state because <code>defaultOpen</code> is set.
        </p>
      </CollapsibleContent>
    </Collapsible>
  ),
}

export const AlertBanner: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-[400px]">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-[var(--color-destructive-muted)] px-4 py-3 text-sm font-medium text-[var(--color-danger-600)] transition-colors hover:bg-[var(--color-destructive-muted)]/80">
        <span className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />3 Certifications Expired
        </span>
        <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {['Medical Certificate', 'Line Check', 'CRM Training'].map((cert) => (
          <div
            key={cert}
            className="rounded-md border border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] p-3 text-sm"
          >
            {cert} — Expired
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  ),
}

export const SettingsPanel: Story = {
  render: () => (
    <Collapsible className="w-[350px]">
      <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors">
        <span className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Advanced Settings
        </span>
        <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 rounded-md border p-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Cache Duration</label>
            <p className="text-muted-foreground text-xs">How long to cache dashboard data</p>
          </div>
          <div>
            <label className="text-sm font-medium">Auto-refresh Interval</label>
            <p className="text-muted-foreground text-xs">Polling frequency for live data</p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
}
