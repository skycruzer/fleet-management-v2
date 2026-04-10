/**
 * Pilot Portal About Page
 *
 * Displays application information including developer name and version.
 *
 * Developer: Maurice Rondeau
 */

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info, Code, Calendar, Shield, Plane } from 'lucide-react'

// Read version from package.json at build time
import packageJson from '@/package.json'

export const metadata = {
  title: 'About | Pilot Portal',
  description: 'Application information and version details',
}

export default function AboutPage() {
  const appVersion = packageJson.version
  const appName = 'Fleet Management System'
  const developer = 'Maurice Rondeau'
  const buildYear = new Date().getFullYear()

  return (
    <div className="via-background min-h-screen bg-gradient-to-br from-[var(--color-info-bg)] to-[var(--color-info-bg)]">
      {/* Header */}
      <header className="bg-card/80 sticky top-0 z-10 border-b backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <Info className="text-primary h-8 w-8" />
            <div>
              <h1 className="text-foreground text-xl font-bold">About</h1>
              <p className="text-muted-foreground text-xs">Application information</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* App Info Card */}
        <Card className="overflow-hidden">
          {/* App Header */}
          <div className="bg-primary/5 border-b p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-xl">
                <Plane className="text-primary h-8 w-8" />
              </div>
              <div>
                <h2 className="text-foreground text-2xl font-bold">{appName}</h2>
                <div className="mt-1 flex items-center space-x-2">
                  <Badge variant="secondary">v{appVersion}</Badge>
                  <Badge variant="outline">Pilot Portal</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* App Details */}
          <div className="divide-y">
            {/* Developer */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                  <Code className="text-muted-foreground h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Developer
                  </p>
                  <p className="text-foreground font-semibold">{developer}</p>
                </div>
              </div>
            </div>

            {/* Version */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                  <Shield className="text-muted-foreground h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Version
                  </p>
                  <p className="text-foreground font-semibold">{appVersion}</p>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                  <Calendar className="text-muted-foreground h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Copyright
                  </p>
                  <p className="text-foreground font-semibold">
                    &copy; {buildYear} {developer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Technology Stack */}
        <Card className="mt-6 p-6">
          <h3 className="text-foreground mb-4 font-semibold">Built With</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Next.js 16</Badge>
            <Badge variant="outline">React 19</Badge>
            <Badge variant="outline">TypeScript</Badge>
            <Badge variant="outline">Tailwind CSS</Badge>
            <Badge variant="outline">Supabase</Badge>
            <Badge variant="outline">Redis</Badge>
          </div>
        </Card>

        {/* Support Info */}
        <Card className="mt-6 border-[var(--color-info)]/20 bg-[var(--color-info-bg)] p-6">
          <div className="flex items-start space-x-3">
            <Info className="text-primary mt-0.5 h-5 w-5" />
            <div>
              <p className="text-foreground font-medium">Need Help?</p>
              <p className="text-muted-foreground mt-1 text-sm">
                For technical support or to report issues, please use the Feedback page or contact
                your fleet management team.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
