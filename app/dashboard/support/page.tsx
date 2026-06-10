/**
 * Support Page
 * Help and support for Fleet Management System
 */

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileQuestion, ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { SupportContactButtons } from '@/components/support/support-contact-buttons'

export const metadata = {
  title: 'Support & Help',
  description: 'Get help and support for Fleet Office',
}

const quickLinks = [
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'Browse our comprehensive documentation',
    href: '/docs',
  },
  {
    icon: FileQuestion,
    title: 'Help Center & FAQs',
    description: 'Find answers to common questions',
    href: '/dashboard/help',
  },
]

const commonIssues = [
  'How to add a new pilot?',
  'How to update certification dates?',
  'How to submit a leave request?',
  'How to generate renewal plans?',
  'How to export data to PDF?',
  'How to manage user permissions?',
]

export default function SupportPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Support & Help"
        description="Get assistance with Fleet Office"
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        }
      />

      {/* Support Status */}
      <Card className="border-[var(--color-success-500)]/20 bg-[var(--color-success-muted)] p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-[var(--color-success-muted)] p-3">
            <CheckCircle2 className="h-6 w-6 text-[var(--color-success-muted-foreground)]" />
          </div>
          <div>
            <h3 className="text-foreground text-lg font-semibold">Support Available</h3>
            <p className="text-muted-foreground text-sm">
              Contact options and self-service resources
            </p>
          </div>
        </div>
      </Card>

      {/* Support Channels */}
      <div>
        <h2 className="text-foreground mb-6 text-xl font-semibold">Contact Support</h2>
        <SupportContactButtons />
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-foreground mb-6 text-xl font-semibold">Quick Resources</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.title} href={link.href}>
                <Card className="group hover:border-primary h-full p-6 transition-all hover:shadow-md">
                  <div className="bg-muted mb-4 w-fit rounded-lg p-3">
                    <Icon className="text-foreground h-6 w-6" />
                  </div>
                  <h3 className="text-foreground mb-2 text-lg font-semibold group-hover:text-[var(--color-info)]">
                    {link.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{link.description}</p>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Common Issues */}
      <Card className="p-6">
        <h2 className="text-foreground mb-6 text-xl font-semibold">Common Questions</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {commonIssues.map((issue, index) => (
            <Link
              key={index}
              href="/dashboard/help"
              className="group hover:border-primary hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-4 transition-all"
            >
              <FileQuestion className="text-muted-foreground h-5 w-5 group-hover:text-[var(--color-info)]" />
              <span className="text-foreground text-sm font-medium group-hover:text-[var(--color-info)]">
                {issue}
              </span>
            </Link>
          ))}
        </div>
      </Card>

      {/* System Information */}
      <Card className="border-[var(--color-info)]/20 bg-[var(--color-info-bg)] p-6">
        <h3 className="text-foreground mb-4 text-lg font-semibold">System Information</h3>
        <div>
          <p className="text-muted-foreground text-sm font-medium">Application Version</p>
          <p className="text-foreground text-lg font-bold">
            v{process.env.NEXT_PUBLIC_APP_VERSION}
          </p>
        </div>
      </Card>
    </div>
  )
}
