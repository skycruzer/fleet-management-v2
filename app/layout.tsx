import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Space_Grotesk } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'

// Space Grotesk — Geometric display font for headlines
// Provides visual distinction from body text with technical precision feel
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['500', '600', '700'],
})
import { ErrorBoundary } from '@/components/error-boundary'
import { OfflineIndicator } from '@/components/ui/offline-indicator'
import { Providers } from './providers'
import { SkipLinks, SkipToMainContent, SkipToNavigation } from '@/components/ui/skip-link'
import { RouteChangeFocusManager } from '@/components/ui/route-change-focus'
import { GlobalAnnouncer } from '@/components/accessibility/announcer'
import './globals.css'

// Geist font family — Vercel's open-source typeface for modern UI

export const metadata: Metadata = {
  title: {
    default: 'Fleet Management V2',
    template: '%s | Fleet Management V2',
  },
  description:
    'Modern fleet management system for B767 operations with comprehensive pilot certification tracking',
  keywords: ['fleet management', 'aviation', 'pilot tracking', 'certification', 'B767'],
  authors: [{ name: 'Maurice (Skycruzer)' }],
  creator: 'Maurice (Skycruzer)',
  publisher: 'Fleet Management V2',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    title: 'Fleet Management V2',
    description: 'Modern fleet management system for B767 operations',
    siteName: 'Fleet Management V2',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fleet Management V2',
    description: 'Modern fleet management system for B767 operations',
    creator: '@skycruzer',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fleet Mgmt',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0C0A09' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${spaceGrotesk.variable} bg-background min-h-screen font-sans antialiased`}
      >
        <ErrorBoundary>
          <Providers>
            {/* PWA Offline Indicator */}
            <OfflineIndicator />

            {/* Skip Links for Accessibility */}
            <SkipLinks>
              <SkipToMainContent />
              <SkipToNavigation />
            </SkipLinks>

            {/* Route Change Focus Manager */}
            <RouteChangeFocusManager />

            {/* Global Screen Reader Announcer */}
            <GlobalAnnouncer />

            <div className="relative flex min-h-screen flex-col">
              <div className="flex-1">{children}</div>
            </div>
            <Toaster />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
