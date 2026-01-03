/**
 * Network Status Indicator Storybook Stories
 *
 * Interactive examples of network status indicators and offline warnings.
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  NetworkStatusIndicator,
  OfflineWarning,
  NetworkStatusBadge,
} from './network-status-indicator'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

// ===================================
// META
// ===================================

const meta = {
  title: 'UI/Network Status Indicator',
  component: NetworkStatusIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof NetworkStatusIndicator>

export default meta
type Story = StoryObj<typeof meta>

// ===================================
// STORIES: NETWORK STATUS INDICATOR
// ===================================

export const OnlineBanner: Story = {
  args: {
    isOnline: true,
    variant: 'banner',
    showOnlyWhenOffline: false,
  },
}

export const OfflineBanner: Story = {
  args: {
    isOnline: false,
    variant: 'banner',
    showOnlyWhenOffline: false,
    offlineMessage: 'You are currently offline. Some features may be unavailable.',
  },
}

export const OfflineBannerWithReconnect: Story = {
  args: {
    isOnline: false,
    variant: 'banner',
    showReconnectButton: true,
    onReconnect: () => console.log('Reconnecting...'),
  },
}

export const OnlineBadge: Story = {
  args: {
    isOnline: true,
    variant: 'badge',
    showOnlyWhenOffline: false,
  },
}

export const OfflineBadge: Story = {
  args: {
    isOnline: false,
    variant: 'badge',
    showOnlyWhenOffline: false,
  },
}

export const OnlineInline: Story = {
  args: {
    isOnline: true,
    variant: 'inline',
    showOnlyWhenOffline: false,
  },
}

export const OfflineInline: Story = {
  args: {
    isOnline: false,
    variant: 'inline',
    showOnlyWhenOffline: false,
  },
}

export const FloatingTop: Story = {
  args: {
    isOnline: false,
    variant: 'floating',
    position: 'top',
    showReconnectButton: true,
    onReconnect: () => console.log('Reconnecting...'),
  },
}

export const FloatingBottom: Story = {
  args: {
    isOnline: false,
    variant: 'floating',
    position: 'bottom',
    showReconnectButton: true,
    onReconnect: () => console.log('Reconnecting...'),
  },
}

export const Reconnecting: Story = {
  args: {
    isOnline: false,
    variant: 'banner',
    showReconnectButton: true,
    isReconnecting: true,
    onReconnect: () => console.log('Reconnecting...'),
  },
}

// ===================================
// INTERACTIVE DEMO COMPONENTS
// ===================================

function InteractiveDemoComponent() {
  const [isOnline, setIsOnline] = useState(true)
  const [isReconnecting, setIsReconnecting] = useState(false)

  const handleReconnect = async () => {
    setIsReconnecting(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsReconnecting(false)
    setIsOnline(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Network Status Indicator Demo</CardTitle>
          <CardDescription>
            Toggle the connection status to see how the indicator responds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setIsOnline(true)} variant={isOnline ? 'default' : 'outline'}>
              Online
            </Button>
            <Button onClick={() => setIsOnline(false)} variant={!isOnline ? 'default' : 'outline'}>
              Offline
            </Button>
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">Current Indicators:</h3>

            <div>
              <p className="text-muted-foreground mb-2 text-sm">Banner variant:</p>
              <NetworkStatusIndicator
                isOnline={isOnline}
                variant="banner"
                showOnlyWhenOffline={false}
                showReconnectButton={true}
                onReconnect={handleReconnect}
                isReconnecting={isReconnecting}
              />
            </div>

            <div>
              <p className="text-muted-foreground mb-2 text-sm">Badge variant:</p>
              <NetworkStatusIndicator
                isOnline={isOnline}
                variant="badge"
                showOnlyWhenOffline={false}
              />
            </div>

            <div>
              <p className="text-muted-foreground mb-2 text-sm">Inline variant:</p>
              <NetworkStatusIndicator
                isOnline={isOnline}
                variant="inline"
                showOnlyWhenOffline={false}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const InteractiveDemo: Story = {
  render: () => <InteractiveDemoComponent />,
}

// ===================================
// OFFLINE WARNING STORIES
// ===================================

export const OfflineWarningDefault: StoryObj<typeof OfflineWarning> = {
  render: () => <OfflineWarning show={true} />,
}

export const OfflineWarningCustomMessage: StoryObj<typeof OfflineWarning> = {
  render: () => <OfflineWarning show={true} message="Connection lost. Changes may not be saved." />,
}

export const OfflineWarningNoIcon: StoryObj<typeof OfflineWarning> = {
  render: () => <OfflineWarning show={true} showIcon={false} />,
}

export const OfflineWarningHidden: StoryObj<typeof OfflineWarning> = {
  render: () => <OfflineWarning show={false} />,
}

// ===================================
// NETWORK STATUS BADGE STORIES
// ===================================

export const BadgeOnlineSmall: StoryObj<typeof NetworkStatusBadge> = {
  render: () => <NetworkStatusBadge isOnline={true} size="sm" showLabel={true} />,
}

export const BadgeOnlineMedium: StoryObj<typeof NetworkStatusBadge> = {
  render: () => <NetworkStatusBadge isOnline={true} size="md" showLabel={true} />,
}

export const BadgeOnlineLarge: StoryObj<typeof NetworkStatusBadge> = {
  render: () => <NetworkStatusBadge isOnline={true} size="lg" showLabel={true} />,
}

export const BadgeOfflineSmall: StoryObj<typeof NetworkStatusBadge> = {
  render: () => <NetworkStatusBadge isOnline={false} size="sm" showLabel={true} />,
}

export const BadgeOfflineMedium: StoryObj<typeof NetworkStatusBadge> = {
  render: () => <NetworkStatusBadge isOnline={false} size="md" showLabel={true} />,
}

export const BadgeOfflineLarge: StoryObj<typeof NetworkStatusBadge> = {
  render: () => <NetworkStatusBadge isOnline={false} size="lg" showLabel={true} />,
}

export const BadgeWithoutLabel: StoryObj<typeof NetworkStatusBadge> = {
  render: () => (
    <div className="flex items-center gap-2">
      <span className="text-sm">Dashboard</span>
      <NetworkStatusBadge isOnline={true} size="sm" showLabel={false} />
    </div>
  ),
}

// ===================================
// USAGE EXAMPLES
// ===================================

function FormWithOfflineWarningComponent() {
  const [isOnline, setIsOnline] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pilot Form</CardTitle>
        <CardDescription>Submit pilot information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <NetworkStatusIndicator isOnline={isOnline} variant="banner" showOnlyWhenOffline={true} />

        <OfflineWarning show={!isOnline} message="You must be online to submit this form." />

        <form className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">Form fields would appear here...</p>
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => setIsOnline(!isOnline)}>
              Toggle: {isOnline ? 'Online' : 'Offline'}
            </Button>
            <Button type="submit" disabled={!isOnline}>
              Submit Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export const FormWithOfflineWarning: Story = {
  render: () => <FormWithOfflineWarningComponent />,
}

function DashboardWithStatusBadgeComponent() {
  const [isOnline, setIsOnline] = useState(true)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fleet Dashboard</CardTitle>
            <CardDescription>Real-time fleet monitoring</CardDescription>
          </div>
          <NetworkStatusBadge isOnline={isOnline} size="md" showLabel={true} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-2xl font-bold">27</p>
            <p className="text-muted-foreground text-sm">Active Pilots</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-2xl font-bold">607</p>
            <p className="text-muted-foreground text-sm">Certifications</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-2xl font-bold">34</p>
            <p className="text-muted-foreground text-sm">Check Types</p>
          </div>
        </div>

        <Button variant="outline" onClick={() => setIsOnline(!isOnline)}>
          Toggle Connection
        </Button>
      </CardContent>
    </Card>
  )
}

export const DashboardWithStatusBadge: Story = {
  render: () => <DashboardWithStatusBadgeComponent />,
}

export const AllVariants: Story = {
  render: () => {
    return (
      <div className="space-y-8">
        <div>
          <h3 className="mb-4 text-lg font-semibold">Online State</h3>
          <div className="space-y-4">
            <NetworkStatusIndicator isOnline={true} variant="banner" showOnlyWhenOffline={false} />
            <NetworkStatusIndicator isOnline={true} variant="badge" showOnlyWhenOffline={false} />
            <NetworkStatusIndicator isOnline={true} variant="inline" showOnlyWhenOffline={false} />
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold">Offline State</h3>
          <div className="space-y-4">
            <NetworkStatusIndicator isOnline={false} variant="banner" showOnlyWhenOffline={false} />
            <NetworkStatusIndicator isOnline={false} variant="badge" showOnlyWhenOffline={false} />
            <NetworkStatusIndicator isOnline={false} variant="inline" showOnlyWhenOffline={false} />
            <OfflineWarning show={true} />
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold">Status Badges</h3>
          <div className="flex flex-wrap gap-4">
            <NetworkStatusBadge isOnline={true} size="sm" showLabel={true} />
            <NetworkStatusBadge isOnline={true} size="md" showLabel={true} />
            <NetworkStatusBadge isOnline={true} size="lg" showLabel={true} />
            <NetworkStatusBadge isOnline={false} size="sm" showLabel={true} />
            <NetworkStatusBadge isOnline={false} size="md" showLabel={true} />
            <NetworkStatusBadge isOnline={false} size="lg" showLabel={true} />
          </div>
        </div>
      </div>
    )
  },
}
