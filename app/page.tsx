import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plane,
  Users,
  FileText,
  BarChart3,
  Shield,
  CheckCircle,
  Clock,
  Calendar,
  Gauge,
  Radio,
  Navigation,
  MapPin,
} from 'lucide-react'
import { publicMetadata } from '@/lib/utils/metadata'

export const metadata = publicMetadata.home

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Dark Navy Premium Background with Aviation Identity */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0a0e1a] via-[#0f1629] to-[#0a0e1a]">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:14px_24px]"></div>

        {/* Sky gradient overlay */}
        <div className="bg-sky-gradient absolute inset-0" />

        {/* Subtle noise texture for depth */}
        <div className="bg-noise absolute inset-0" />

        {/* Decorative gradient orbs */}
        <div className="bg-primary/10 absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl" />
        <div className="bg-accent/10 absolute top-1/2 -right-32 h-80 w-80 rounded-full blur-3xl" />
        <div className="bg-primary/5 absolute -bottom-16 left-1/3 h-64 w-64 rounded-full blur-3xl" />

        {/* Horizon line decoration */}
        <div className="horizon-line absolute right-0 bottom-0 left-0 h-px" />

        {/* Decorative floating planes */}
        <div className="absolute top-20 left-[15%] opacity-10">
          <Plane
            className="animate-float h-8 w-8 rotate-12 text-white"
            style={{ animationDelay: '0s' }}
          />
        </div>
        <div className="absolute top-40 right-[20%] opacity-10">
          <Plane
            className="animate-float h-6 w-6 -rotate-6 text-white"
            style={{ animationDelay: '1s' }}
          />
        </div>
        <div className="absolute bottom-32 left-[10%] opacity-10">
          <Plane
            className="animate-float h-5 w-5 rotate-3 text-white"
            style={{ animationDelay: '2s' }}
          />
        </div>

        <div className="relative container mx-auto px-4 py-24 sm:py-32">
          <div className="flex flex-col items-center space-y-8 text-center">
            {/* Logo & Title */}
            <div className="mb-2 flex items-center justify-center space-x-4">
              <div className="bg-primary/10 animate-gentle-rotate rounded-2xl border border-white/10 p-3 shadow-lg backdrop-blur-sm">
                <Plane className="text-primary h-14 w-14" />
              </div>
              <h1
                className="font-display text-foreground text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
                suppressHydrationWarning
              >
                Fleet Management
              </h1>
            </div>

            {/* Subtitle with gradient text */}
            <p className="text-gradient-aviation font-display max-w-3xl text-xl leading-relaxed font-semibold sm:text-2xl">
              Enterprise-grade aviation fleet management platform
            </p>

            <p className="text-muted-foreground max-w-2xl text-lg">
              Streamline pilot certification tracking, leave management, and compliance monitoring
              with our comprehensive aviation operations platform.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" variant="aviation" className="px-8 py-6 text-base" asChild>
                <Link href="/auth/login">Admin Dashboard</Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-base" asChild>
                <Link href="/portal/login">Pilot Portal</Link>
              </Button>
              <Button size="lg" variant="ghost" className="px-8 py-6 text-base" asChild>
                <Link href="/docs">
                  <FileText className="mr-2 h-5 w-5" />
                  Documentation
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="font-display mb-4 text-center text-3xl font-bold sm:text-4xl">
            Comprehensive Fleet Management Solutions
          </h2>
          <p className="text-muted-foreground mb-12 text-center text-lg">
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
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] p-12 text-center">
          {/* Decorative horizon line */}
          <div className="horizon-line absolute top-0 right-0 left-0" />
          <h2 className="font-display mb-8 text-3xl font-bold sm:text-4xl">
            Why Choose Our Platform?
          </h2>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
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

      {/* Footer */}
      <footer className="bg-muted/30 border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
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
            </div>
          </div>
        </div>
      </footer>
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
      hover: 'hover:border-primary/50 hover:shadow-primary/10',
    },
    accent: {
      icon: 'text-accent bg-accent/10',
      hover: 'hover:border-accent/50 hover:shadow-accent/10',
    },
  }

  const colors = colorClasses[accentColor]

  return (
    <Card
      className={`${colors.hover} group border-white/[0.08] bg-white/[0.04] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
    >
      <CardHeader>
        <div
          className={`${colors.icon} mb-3 w-fit rounded-xl p-3 transition-transform duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>
        <CardTitle className="font-display text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
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
    <div className="group text-center">
      <div className="text-primary bg-primary/10 group-hover:bg-primary/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110">
        {icon}
      </div>
      <h3 className="font-display mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  )
}
