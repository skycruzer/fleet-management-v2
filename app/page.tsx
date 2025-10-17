import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plane, Users, FileText, BarChart3, Shield, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-6 mb-16">
        <div className="flex items-center space-x-3 mb-4">
          <Plane className="h-12 w-12 text-primary" />
          <h1 className="text-5xl font-bold tracking-tight">
            Fleet Management <span className="text-primary">V2</span>
          </h1>
        </div>

        <p className="text-xl text-muted-foreground max-w-2xl">
          Modern fleet management system built with Next.js 15, TypeScript, and Supabase.
          Comprehensive pilot certification tracking, leave management, and compliance monitoring.
        </p>

        <div className="flex gap-4 mt-8">
          <Button size="lg" asChild>
            <Link href="/dashboard">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/docs">Documentation</Link>
          </Button>
        </div>
      </div>

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
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-6">Built With Modern Technologies</h2>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
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
    <Card>
      <CardHeader>
        <div className="mb-2 text-primary">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

function TechBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1 rounded-full bg-muted text-foreground font-medium">
      {children}
    </span>
  )
}
