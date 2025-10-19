import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/error-boundary'
import { Providers } from './providers'
import { SkipLinks, SkipToMainContent, SkipToNavigation } from '@/components/ui/skip-link'
import { RouteChangeFocusManager } from '@/components/ui/route-change-focus'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Fleet Management V2',
    template: '%s | Fleet Management V2',
  },
  description: 'Modern fleet management system for B767 operations with comprehensive pilot certification tracking',
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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ErrorBoundary
          onError={(error, errorInfo) => {
            // Log root-level errors with high severity
            console.error('Root Layout Error (Critical):', {
              error,
              errorInfo,
              timestamp: new Date().toISOString(),
              severity: 'CRITICAL',
            })
          }}
        >
          <Providers>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {/* Skip Links for Accessibility */}
              <SkipLinks>
                <SkipToMainContent />
                <SkipToNavigation />
              </SkipLinks>

              {/* Route Change Focus Manager */}
              <RouteChangeFocusManager />

              <div className="relative flex min-h-screen flex-col">
                <div className="flex-1">{children}</div>
              </div>
              <Toaster />
            </ThemeProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
