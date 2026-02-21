import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plane,
  Users,
  BarChart3,
  Shield,
  CheckCircle,
  Clock,
  Calendar,
  Gauge,
  Radio,
  ArrowRight,
  Zap,
  Globe,
} from 'lucide-react'
import { publicMetadata } from '@/lib/utils/metadata'

export const metadata = publicMetadata.home

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0a0e1a] via-[#0f1629] to-[#0a0e1a]">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:14px_24px]" />

        {/* Sky gradient overlay */}
        <div className="bg-sky-gradient absolute inset-0" />

        {/* Subtle noise texture for depth */}
        <div className="bg-noise absolute inset-0" />

        {/* Decorative gradient orbs - more visible */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute top-1/2 -right-32 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute -bottom-16 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        {/* Horizon line decoration */}
        <div className="horizon-line absolute right-0 bottom-0 left-0 h-px" />

        {/* Decorative floating planes - more visible */}
        <div className="absolute top-20 left-[15%] opacity-[0.15]">
          <Plane
            className="animate-float h-10 w-10 rotate-12 text-blue-300"
            style={{ animationDelay: '0s' }}
          />
        </div>
        <div className="absolute top-40 right-[20%] opacity-[0.15]">
          <Plane
            className="animate-float h-8 w-8 -rotate-6 text-cyan-300"
            style={{ animationDelay: '1s' }}
          />
        </div>
        <div className="absolute bottom-32 left-[10%] opacity-[0.12]">
          <Plane
            className="animate-float h-6 w-6 rotate-3 text-blue-300"
            style={{ animationDelay: '2s' }}
          />
        </div>
        <div className="absolute top-32 right-[10%] opacity-[0.08]">
          <Plane
            className="animate-float h-12 w-12 -rotate-12 text-indigo-300"
            style={{ animationDelay: '1.5s' }}
          />
        </div>

        <div className="relative container mx-auto px-4 py-28 sm:py-36">
          <div className="flex flex-col items-center space-y-10 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-sm font-medium text-blue-200">
                Aviation Operations Platform
              </span>
            </div>

            {/* Logo & Title */}
            <div className="flex flex-col items-center gap-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-blue-500/10 backdrop-blur-sm">
                <Plane className="h-16 w-16 text-blue-400" />
              </div>
              <h1
                className="font-display max-w-4xl text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl"
                suppressHydrationWarning
              >
                Fleet Management
              </h1>
            </div>

            {/* Subtitle - more prominent */}
            <p className="text-gradient-aviation font-display max-w-3xl text-xl leading-relaxed font-semibold sm:text-2xl lg:text-3xl">
              Enterprise-grade aviation fleet management platform
            </p>

            <p className="max-w-2xl text-lg leading-relaxed text-blue-100/70">
              Streamline pilot certification tracking, leave management, and compliance monitoring
              with our comprehensive aviation operations platform.
            </p>

            {/* CTA Buttons - larger, more prominent */}
            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <Button size="lg" variant="aviation" className="h-14 px-10 text-base font-semibold" asChild>
                <Link href="/auth/login">
                  Admin Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                className="h-14 border-white/20 bg-white/10 px-10 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20"
                asChild
              >
                <Link href="/portal/login">
                  <Globe className="mr-2 h-5 w-5" />
                  Pilot Portal
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-blue-200/50">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>FAA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Real-time Monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>24/7 Operations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-border bg-card border-y">
        <div className="container mx-auto grid grid-cols-2 gap-0 divide-x divide-border px-4 md:grid-cols-4">
          <StatItem number="600+" label="Certifications Tracked" />
          <StatItem number="30+" label="Active Pilots" />
          <StatItem number="13" label="Roster Periods / Year" />
          <StatItem number="99.9%" label="Compliance Rate" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        {/* Features Grid */}
        <div className="mb-24">
          <div className="mb-4 text-center">
            <span className="text-primary bg-primary/10 inline-block rounded-full px-4 py-1 text-sm font-semibold">
              Features
            </span>
          </div>
          <h2 className="font-display text-foreground mb-4 text-center text-3xl font-bold sm:text-4xl">
            Comprehensive Fleet Management
          </h2>
          <p className="text-muted-foreground mx-auto mb-14 max-w-2xl text-center text-lg">
            Everything you need to manage your aviation operations efficiently
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Pilot Management"
              description="Comprehensive pilot profiles with certification tracking, qualifications, seniority management, and automated compliance monitoring."
              accentColor="primary"
            />
            <FeatureCard
              icon={<Gauge className="h-8 w-8" />}
              title="Certification Tracking"
              description="Track multiple check types with automated expiry alerts, detailed certification history, and regulatory compliance reporting."
              accentColor="accent"
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Analytics & Reporting"
              description="Real-time fleet metrics, compliance statistics, and visual insights with interactive charts and comprehensive reports."
              accentColor="primary"
            />
            <FeatureCard
              icon={<Calendar className="h-8 w-8" />}
              title="Leave Management"
              description="Streamlined leave request system with roster period alignment, automated approval workflows, and crew availability tracking."
              accentColor="accent"
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Security & Compliance"
              description="Enterprise-grade security with role-based access control, comprehensive audit logging, and FAA compliance standards."
              accentColor="primary"
            />
            <FeatureCard
              icon={<Radio className="h-8 w-8" />}
              title="Automated Monitoring"
              description="Proactive expiry monitoring with color-coded status indicators, automated notifications, and compliance tracking."
              accentColor="accent"
            />
          </div>
        </div>

        {/* Benefits Section */}
        <div className="border-border bg-card relative overflow-hidden rounded-3xl border p-12 shadow-lg">
          {/* Decorative horizon line */}
          <div className="horizon-line absolute top-0 right-0 left-0" />
          <div className="mb-4 text-center">
            <span className="text-accent bg-accent/10 inline-block rounded-full px-4 py-1 text-sm font-semibold">
              Benefits
            </span>
          </div>
          <h2 className="font-display text-foreground mb-10 text-center text-3xl font-bold sm:text-4xl">
            Why Choose Our Platform?
          </h2>
          <div className="mx-auto grid max-w-4xl gap-10 md:grid-cols-2">
            <BenefitItem
              icon={<Clock className="h-6 w-6" />}
              title="Save Time"
              description="Automate manual processes and reduce administrative overhead with intelligent workflow automation."
            />
            <BenefitItem
              icon={<Shield className="h-6 w-6" />}
              title="Ensure Compliance"
              description="Stay ahead of regulatory requirements with automated compliance tracking and comprehensive audit trails."
            />
            <BenefitItem
              icon={<BarChart3 className="h-6 w-6" />}
              title="Data-Driven Insights"
              description="Make informed decisions with real-time analytics and comprehensive fleet performance metrics."
            />
            <BenefitItem
              icon={<CheckCircle className="h-6 w-6" />}
              title="Improve Efficiency"
              description="Streamline operations with centralized data management and seamless team collaboration tools."
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#0a0e1a] via-[#0f1629] to-[#0a0e1a] py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display mb-4 text-3xl font-bold text-white sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-blue-100/60">
            Access the admin dashboard to manage your fleet or log in to the pilot portal.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="aviation" className="h-12 px-8 text-base" asChild>
              <Link href="/auth/login">
                Admin Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              className="h-12 border-white/20 bg-white/10 px-8 text-base text-white hover:bg-white/20"
              asChild
            >
              <Link href="/portal/login">Pilot Portal</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <Plane className="text-primary h-5 w-5" />
              <span className="text-foreground font-semibold">Fleet Management</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Fleet Management. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/docs"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Documentation
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div className="px-6 py-6 text-center">
      <p className="text-primary font-display text-3xl font-bold">{number}</p>
      <p className="text-muted-foreground mt-1 text-sm">{label}</p>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  accentColor = 'primary',
}: {
  icon: React.ReactNode
  title: string
  description: string
  accentColor?: 'primary' | 'accent'
}) {
  const colorClasses = {
    primary: {
      icon: 'text-primary bg-primary/10',
      hover: 'hover:border-primary/30 hover:shadow-primary/5',
    },
    accent: {
      icon: 'text-accent bg-accent/10',
      hover: 'hover:border-accent/30 hover:shadow-accent/5',
    },
  }

  const colors = colorClasses[accentColor]

  return (
    <Card
      className={`${colors.hover} bg-card group border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
    >
      <CardHeader>
        <div
          className={`${colors.icon} mb-3 w-fit rounded-xl p-3 transition-transform duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>
        <CardTitle className="font-display text-foreground text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-muted-foreground text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  )
}

function BenefitItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group flex items-start gap-4 text-left">
      <div className="text-primary bg-primary/10 group-hover:bg-primary/20 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110">
        {icon}
      </div>
      <div>
        <h3 className="font-display text-foreground mb-1 text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
