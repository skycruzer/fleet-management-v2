import type { Meta, StoryObj } from '@storybook/react'
import { OfflineIndicator } from './offline-indicator'

const meta = {
  title: 'UI/OfflineIndicator',
  component: OfflineIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Displays a banner at the top of the page when the user loses internet connectivity. Automatically detects online/offline status and provides visual feedback.',
      },
    },
  },
} satisfies Meta<typeof OfflineIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Online: Story = {
  parameters: {
    docs: {
      description: {
        story: 'When the user is online, no indicator is shown (default state).',
      },
    },
  },
}

export const OfflineSimulation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'To test offline behavior, open DevTools → Network tab → Set throttling to "Offline".',
      },
    },
  },
  render: () => (
    <div>
      <OfflineIndicator />
      <div className="p-8">
        <h1 className="text-2xl font-bold">Offline Indicator Demo</h1>
        <p className="text-muted-foreground mt-4">To see the offline indicator:</p>
        <ol className="mt-2 list-decimal space-y-1 pl-6 text-sm">
          <li>Open Browser DevTools (F12)</li>
          <li>Go to the Network tab</li>
          <li>Change throttling from "Online" to "Offline"</li>
          <li>The yellow banner will appear at the top</li>
          <li>Change back to "Online" to see the green "back online" message</li>
        </ol>
      </div>
    </div>
  ),
}

export const DesignSpecs: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Visual specifications for the offline indicator component.',
      },
    },
  },
  render: () => (
    <div className="space-y-8 p-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Offline State (Yellow)</h3>
        <div className="fixed top-0 right-0 left-0 bg-[var(--color-warning-500)] px-4 py-2 text-center text-sm font-medium text-black">
          <div className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
            <span>You&apos;re offline. Some features may be unavailable.</span>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h3 className="mb-4 text-lg font-semibold">Online State (Green)</h3>
        <div className="bg-[var(--color-success-500)] px-4 py-2 text-center text-sm font-medium text-white">
          <div className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>You&apos;re back online</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="mb-2 text-lg font-semibold">Features</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <strong>Auto-detection:</strong> Uses navigator.onLine and online/offline events
          </li>
          <li>
            <strong>Smart visibility:</strong> Only shows when offline or recently back online
          </li>
          <li>
            <strong>Auto-hide:</strong> Green banner auto-hides after 3 seconds
          </li>
          <li>
            <strong>Accessibility:</strong> Uses role="alert" and aria-live="polite"
          </li>
          <li>
            <strong>Fixed position:</strong> z-index 50, top of viewport
          </li>
        </ul>
      </div>
    </div>
  ),
}
