import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plane, Users, FileText, BarChart3, Shield, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

        <div className="container relative mx-auto px-4 py-24 sm:py-32">
          <div className="flex flex-col items-center text-center space-y-8">
            {/* Logo & Title */}
            <div className="flex items-center space-x-4 mb-2">
              <div className="p-3 bg-primary/10 rounded-2xl backdrop-blur-sm">
                <Plane className="h-14 w-14 text-primary" />
              </div>
              <h1 className="text-6xl sm:text-7xl font-bold tracking-tight text-gray-900">
                Fleet Management{' '}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  V2
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl leading-relaxed">
              Modern fleet management system built with{' '}
              <span className="font-semibold text-foreground">Next.js 15</span>,{' '}
              <span className="font-semibold text-foreground">TypeScript</span>, and{' '}
              <span className="font-semibold text-foreground">Supabase</span>.
            </p>

            <p className="text-lg text-muted-foreground max-w-2xl">
              Comprehensive pilot certification tracking, leave management, and compliance monitoring
              for aviation operations.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button size="lg" className="text-base px-8 py-6" asChild>
                <Link href="/dashboard">
                  Get Started
                  <Zap className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 py-6" asChild>
                <Link href="/docs">
                  Documentation
                  <FileText className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12 w-full max-w-2xl">
              <div className="flex flex-col items-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="text-4xl font-bold text-primary">27</div>
                <div className="text-sm text-muted-foreground mt-1">Active Pilots</div>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="text-4xl font-bold text-primary">607</div>
                <div className="text-sm text-muted-foreground mt-1">Certifications</div>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="text-4xl font-bold text-primary">34</div>
                <div className="text-sm text-muted-foreground mt-1">Check Types</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">

      {/* Features Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
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
      <div className="text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-3xl p-12">
        <h2 className="text-4xl font-bold mb-8">
          Built With Modern{' '}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Technologies
          </span>
        </h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
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
    <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50">
      <CardHeader>
        <div className="mb-3 text-primary p-3 bg-primary/10 rounded-lg w-fit">{icon}</div>
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
    <span className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium shadow-sm border border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:shadow-md transition-all duration-200">
      {children}
    </span>
  )
}
