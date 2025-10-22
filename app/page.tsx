import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plane, Users, FileText, BarChart3, Shield, Zap } from 'lucide-react'
import { publicMetadata } from '@/lib/utils/metadata'

export const metadata = publicMetadata.home

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

        <div className="relative container mx-auto px-4 py-24 sm:py-32">
          <div className="flex flex-col items-center space-y-8 text-center">
            {/* Logo & Title */}
            <div className="mb-2 flex items-center space-x-4">
              <div className="bg-primary/10 rounded-2xl p-3 backdrop-blur-sm">
                <Plane className="text-primary h-14 w-14" />
              </div>
              <h1 className="text-foreground text-6xl font-bold tracking-tight sm:text-7xl" suppressHydrationWarning>
                Fleet Management{' '}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  V2
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-muted-foreground max-w-3xl text-xl leading-relaxed sm:text-2xl">
              Modern fleet management system built with{' '}
              <span className="text-foreground font-semibold">Next.js 15</span>,{' '}
              <span className="text-foreground font-semibold">TypeScript</span>, and{' '}
              <span className="text-foreground font-semibold">Supabase</span>.
            </p>

            <p className="text-muted-foreground max-w-2xl text-lg">
              Comprehensive pilot certification tracking, leave management, and compliance
              monitoring for aviation operations.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="px-8 py-6 text-base" asChild>
                <Link href="/dashboard">
                  Get Started
                  <Zap className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-base" asChild>
                <Link href="/docs">
                  Documentation
                  <FileText className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-12 grid w-full max-w-2xl grid-cols-3 gap-8">
              <div className="bg-card/50 flex flex-col items-center rounded-lg p-4 backdrop-blur-sm">
                <div className="text-primary text-4xl font-bold">27</div>
                <div className="text-muted-foreground mt-1 text-sm">Active Pilots</div>
              </div>
              <div className="bg-card/50 flex flex-col items-center rounded-lg p-4 backdrop-blur-sm">
                <div className="text-primary text-4xl font-bold">607</div>
                <div className="text-muted-foreground mt-1 text-sm">Certifications</div>
              </div>
              <div className="bg-card/50 flex flex-col items-center rounded-lg p-4 backdrop-blur-sm">
                <div className="text-primary text-4xl font-bold">34</div>
                <div className="text-muted-foreground mt-1 text-sm">Check Types</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Features Grid */}
        <div className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Users className="h-8 w-8" />}
            title="Pilot Management"
            description="Comprehensive pilot profiles with certification tracking, qualifications, and automated compliance monitoring."
          />
          <FeatureCard
            icon={<FileText className="h-8 w-8" />}
            title="Certification Tracking"
            description="Track 38+ check types with automated expiry alerts and detailed certification history for regulatory compliance."
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8" />}
            title="Analytics Dashboard"
            description="Real-time fleet metrics, compliance statistics, and visual insights with interactive charts and reports."
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8" />}
            title="Security First"
            description="Built with Supabase Row Level Security (RLS), role-based access control, and comprehensive audit logging."
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Modern Stack"
            description="Next.js 15 with React 19, TypeScript strict mode, Tailwind CSS v4, and shadcn/ui components."
          />
          <FeatureCard
            icon={<Plane className="h-8 w-8" />}
            title="Aviation Compliant"
            description="FAA standards with color-coded status indicators (red/yellow/green) and complete audit trail."
          />
        </div>

        {/* Tech Stack Section */}
        <div className="rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 p-12 text-center dark:from-gray-900 dark:to-gray-800">
          <h2 className="mb-8 text-4xl font-bold">
            Built With Modern{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Technologies
            </span>
          </h2>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl">
            Leveraging the latest tools and frameworks to deliver a fast, secure, and maintainable
            fleet management solution.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <TechBadge>Next.js 15</TechBadge>
            <TechBadge>React 19</TechBadge>
            <TechBadge>TypeScript</TechBadge>
            <TechBadge>Tailwind CSS v4</TechBadge>
            <TechBadge>Supabase</TechBadge>
            <TechBadge>shadcn/ui</TechBadge>
            <TechBadge>TanStack Query</TechBadge>
            <TechBadge>React Hook Form</TechBadge>
            <TechBadge>Zod</TechBadge>
            <TechBadge>Playwright</TechBadge>
            <TechBadge>Storybook</TechBadge>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <CardHeader>
        <div className="text-primary bg-primary/10 mb-3 w-fit rounded-lg p-3">{icon}</div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

function TechBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-foreground border-border bg-card hover:border-primary/50 rounded-full border px-4 py-2 font-medium shadow-sm transition-all duration-200 hover:shadow-md">
      {children}
    </span>
  )
}
