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
} from 'lucide-react'
import { publicMetadata } from '@/lib/utils/metadata'

export const metadata = publicMetadata.home

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Clean Minimal Background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

        <div className="relative container mx-auto px-4 py-24 sm:py-32">
          <div className="flex flex-col items-center space-y-8 text-center">
            {/* Logo & Title */}
            <div className="mb-2 flex items-center justify-center space-x-4">
              <div className="bg-primary/10 rounded-2xl p-3 backdrop-blur-sm">
                <Plane className="text-primary h-14 w-14" />
              </div>
              <h1
                className="text-foreground text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
                suppressHydrationWarning
              >
                Fleet Management
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-muted-foreground max-w-3xl text-xl leading-relaxed sm:text-2xl">
              Enterprise-grade aviation fleet management platform
            </p>

            <p className="text-muted-foreground max-w-2xl text-lg">
              Streamline pilot certification tracking, leave management, and compliance monitoring
              with our comprehensive aviation operations platform.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="px-8 py-6 text-base" asChild>
                <Link href="/auth/login">Admin Dashboard</Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-base" asChild>
                <Link href="/portal/login">Pilot Portal</Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-base" asChild>
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
          <h2 className="mb-12 text-center text-3xl font-bold sm:text-4xl">
            Comprehensive Fleet Management Solutions
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Pilot Management"
              description="Comprehensive pilot profiles with certification tracking, qualifications, seniority management, and automated compliance monitoring."
            />
            <FeatureCard
              icon={<FileText className="h-8 w-8" />}
              title="Certification Tracking"
              description="Track multiple check types with automated expiry alerts, detailed certification history, and regulatory compliance reporting."
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Analytics & Reporting"
              description="Real-time fleet metrics, compliance statistics, and visual insights with interactive charts and comprehensive reports."
            />
            <FeatureCard
              icon={<Calendar className="h-8 w-8" />}
              title="Leave Management"
              description="Streamlined leave request system with roster period alignment, automated approval workflows, and crew availability tracking."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Security & Compliance"
              description="Enterprise-grade security with role-based access control, comprehensive audit logging, and FAA compliance standards."
            />
            <FeatureCard
              icon={<CheckCircle className="h-8 w-8" />}
              title="Automated Monitoring"
              description="Proactive expiry monitoring with color-coded status indicators, automated notifications, and compliance tracking."
            />
          </div>
        </div>

        {/* Benefits Section */}
        <div className="rounded-3xl bg-gradient-to-br from-zinc-50 to-zinc-100 p-12 text-center dark:from-zinc-900 dark:to-zinc-950">
          <h2 className="mb-8 text-3xl font-bold sm:text-4xl">Why Choose Our Platform?</h2>
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
    <div className="text-center">
      <div className="text-primary bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  )
}
