/**
 * Documentation Page
 * System documentation and user guides
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Book,
  FileText,
  Users,
  Shield,
  BarChart3,
  Settings,
  ArrowLeft,
} from 'lucide-react'

export const metadata = {
  title: 'Documentation | Fleet Management V2',
  description: 'System documentation and user guides for Fleet Management V2',
}

export default function DocsPage() {
  return (
    <div className="via-background min-h-screen bg-gradient-to-br from-[var(--color-info-bg)] to-[var(--color-info-bg)]">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-4xl font-bold">Documentation</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Comprehensive guides and documentation for Fleet Management V2
          </p>
        </div>

        {/* Quick Start */}
        <Card className="mb-8 border-[var(--color-info)]/20 bg-[var(--color-info-bg)]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Book className="mr-2 h-6 w-6 text-[var(--color-primary-600)]" />
              Quick Start Guide
            </CardTitle>
            <CardDescription>Get started with Fleet Management V2 in minutes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">For Administrators</h3>
                <ol className="list-decimal space-y-1 pl-5 text-sm">
                  <li>Sign in with your admin credentials</li>
                  <li>Access the admin dashboard</li>
                  <li>Add pilots and manage certifications</li>
                  <li>Review leave requests and flight requests</li>
                  <li>Monitor compliance and analytics</li>
                </ol>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">For Pilots</h3>
                <ol className="list-decimal space-y-1 pl-5 text-sm">
                  <li>Register for pilot portal access</li>
                  <li>Wait for admin approval</li>
                  <li>Sign in to your pilot portal</li>
                  <li>View certifications and submit requests</li>
                  <li>Track leave and flight request status</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Sections */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DocCard
            icon={<Users className="h-8 w-8" />}
            title="Pilot Management"
            description="Learn how to manage pilot profiles, qualifications, and seniority"
            topics={[
              'Adding new pilots',
              'Updating pilot information',
              'Managing qualifications',
              'Seniority system',
            ]}
          />

          <DocCard
            icon={<FileText className="h-8 w-8" />}
            title="Certification Tracking"
            description="Track and manage pilot certifications and check types"
            topics={[
              'Recording certifications',
              'Expiry monitoring',
              'Check type definitions',
              'Compliance tracking',
            ]}
          />

          <DocCard
            icon={<Shield className="h-8 w-8" />}
            title="Leave Management"
            description="Manage leave requests with roster period alignment"
            topics={[
              'Submitting leave requests',
              'Approval workflow',
              'Roster period system',
              'Eligibility rules',
            ]}
          />

          <DocCard
            icon={<BarChart3 className="h-8 w-8" />}
            title="Analytics & Reports"
            description="Generate insights from fleet data and compliance metrics"
            topics={[
              'Dashboard metrics',
              'Compliance reports',
              'Expiry forecasting',
              'Fleet statistics',
            ]}
          />

          <DocCard
            icon={<Settings className="h-8 w-8" />}
            title="System Settings"
            description="Configure system settings and user permissions"
            topics={[
              'User management',
              'Role-based access',
              'Check type configuration',
              'Audit logging',
            ]}
          />

          <DocCard
            icon={<Book className="h-8 w-8" />}
            title="Technical Docs"
            description="Technical documentation for developers and IT staff"
            topics={[
              'Architecture overview',
              'Database schema',
              'API documentation',
              'Deployment guide',
            ]}
          />
        </div>


        {/* Support & Resources */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Support & Resources</CardTitle>
            <CardDescription>Get help and additional resources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">Technical Stack</h3>
              <ul className="space-y-1 text-sm">
                <li>Next.js 15.5.6 with App Router</li>
                <li>React 19.1.0</li>
                <li>TypeScript 5.7.3 (strict mode)</li>
                <li>Supabase PostgreSQL</li>
                <li>Tailwind CSS 4.1.0</li>
              </ul>
            </div>

            <div className="bg-muted mt-6 rounded-lg p-4">
              <p className="text-sm">
                <strong>Need help?</strong> For technical support or questions about the system,
                please contact your system administrator.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">Ready to get started?</p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/portal/login">Pilot Portal</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DocCard({
  icon,
  title,
  description,
  topics,
}: {
  icon: React.ReactNode
  title: string
  description: string
  topics: string[]
}) {
  return (
    <Card className="hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <div className="text-primary bg-primary/10 mb-3 w-fit rounded-lg p-3">{icon}</div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {topics.map((topic, index) => (
            <li key={index} className="text-muted-foreground flex items-start">
              <span className="text-primary mr-2">•</span>
              {topic}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
