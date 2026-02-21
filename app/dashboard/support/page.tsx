/**
 * Support Page
 * Help and support for Fleet Management System
 */

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileQuestion, ArrowLeft, BookOpen, Video, CheckCircle2 } from 'lucide-react'
import { SupportContactButtons } from '@/components/support/support-contact-buttons'

export const metadata = {
  title: 'Support & Help - Fleet Management V2',
  description: 'Get help and support for the Fleet Management System',
}

const quickLinks = [
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'Browse our comprehensive documentation',
    href: '/dashboard/docs',
  },
  {
    icon: Video,
    title: 'Video Tutorials',
    description: 'Watch step-by-step video guides',
    href: '/dashboard/tutorials',
  },
  {
    icon: FileQuestion,
    title: 'FAQs',
    description: 'Find answers to common questions',
    href: '/dashboard/faqs',
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Support & Help</h1>
          <p className="text-muted-foreground mt-2">
            Get assistance with the Fleet Management System
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="lg" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Support Status */}
      <Card className="border-[var(--color-success-500)]/20 bg-[var(--color-success-muted)] p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-[var(--color-success-muted)] p-3">
            <CheckCircle2 className="h-6 w-6 text-[var(--color-success-400)]" />
          </div>
          <div>
            <h3 className="text-foreground text-lg font-semibold">Support Available</h3>
            <p className="text-muted-foreground text-sm">
              Our support team is online and ready to help you
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
                  <h3 className="text-foreground group-hover:text-primary mb-2 text-lg font-semibold">
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
              href={`/dashboard/faqs#${issue.toLowerCase().replace(/\s+/g, '-')}`}
              className="group hover:border-primary hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-4 transition-all"
            >
              <FileQuestion className="text-muted-foreground group-hover:text-primary h-5 w-5" />
              <span className="text-foreground group-hover:text-primary text-sm font-medium">
                {issue}
              </span>
            </Link>
          ))}
        </div>
      </Card>

      {/* System Information */}
      <Card className="border-[var(--color-info)]/20 bg-[var(--color-info-bg)] p-6">
        <h3 className="text-foreground mb-4 text-lg font-semibold">System Information</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-sm font-medium">Application Version</p>
            <p className="text-foreground text-lg font-bold">v2.0.0</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Database Status</p>
            <p className="text-lg font-bold text-[var(--color-success-400)]">Connected</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Support Hours</p>
            <p className="text-foreground text-lg font-bold">24/7</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
