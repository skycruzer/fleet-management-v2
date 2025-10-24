/**
 * Support Page
 * Help and support for Fleet Management System
 */

export const dynamic = 'force-dynamic'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Mail,
  Phone,
  MessageSquare,
  FileQuestion,
  ArrowLeft,
  BookOpen,
  Video,
  Clock,
  CheckCircle2,
} from 'lucide-react'

export const metadata = {
  title: 'Support & Help - Fleet Management V2',
  description: 'Get help and support for the Fleet Management System',
}

const supportChannels = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Get help via email within 24 hours',
    contact: 'support@fleetmanagement.com',
    response: '24 hours',
    color: 'blue',
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Speak directly with our support team',
    contact: '+1 (555) 123-4567',
    response: 'Immediate',
    color: 'green',
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Chat with our support team in real-time',
    contact: 'Available Monday-Friday, 9am-5pm',
    response: '5 minutes',
    color: 'purple',
  },
]

const quickLinks = [
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'Browse our comprehensive documentation',
    href: '/docs',
  },
  {
    icon: Video,
    title: 'Video Tutorials',
    description: 'Watch step-by-step video guides',
    href: '/tutorials',
  },
  {
    icon: FileQuestion,
    title: 'FAQs',
    description: 'Find answers to common questions',
    href: '/faqs',
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
    <div className="space-y-8 p-8">
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
      <Card className="border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {supportChannels.map((channel) => {
            const Icon = channel.icon
            const bgColor =
              channel.color === 'blue'
                ? 'bg-blue-100'
                : channel.color === 'green'
                  ? 'bg-green-100'
                  : 'bg-purple-100'
            const textColor =
              channel.color === 'blue'
                ? 'text-blue-600'
                : channel.color === 'green'
                  ? 'text-green-600'
                  : 'text-purple-600'

            return (
              <Card key={channel.title} className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className={`rounded-lg ${bgColor} p-3`}>
                    <Icon className={`h-6 w-6 ${textColor}`} />
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {channel.response}
                  </Badge>
                </div>
                <h3 className="text-foreground mb-2 text-lg font-semibold">{channel.title}</h3>
                <p className="text-muted-foreground mb-4 text-sm">{channel.description}</p>
                <p className="text-foreground mb-4 font-medium">{channel.contact}</p>
                <Button className="w-full gap-2">
                  Contact Now
                  <Icon className="h-4 w-4" />
                </Button>
              </Card>
            )
          })}
        </div>
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
              href={`/faqs#${issue.toLowerCase().replace(/\s+/g, '-')}`}
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
      <Card className="border-blue-200 bg-blue-50 p-6">
        <h3 className="text-foreground mb-4 text-lg font-semibold">System Information</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-sm font-medium">Application Version</p>
            <p className="text-foreground text-lg font-bold">v2.0.0</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Database Status</p>
            <p className="text-lg font-bold text-green-600">Connected</p>
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
