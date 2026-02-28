/**
 * Animated Landing Page Content
 * Developer: Maurice Rondeau
 *
 * Client component with Framer Motion animations for the landing page.
 * Extracted from app/page.tsx to preserve Server Component benefits (metadata, SSR).
 */

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
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
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import { EASING, DURATION } from '@/lib/animations/motion-variants'
import { ThemeToggle } from '@/components/ui/theme-toggle'

// ---------------------------------------------------------------------------
// Shared motion helpers
// ---------------------------------------------------------------------------

const spring = EASING.spring
const gentleSpring = EASING.gentleSpring

function useScrollReveal(margin = '-80px') {
  const ref = useRef<HTMLDivElement>(null)
  const { shouldAnimate } = useAnimationSettings()
  const isInView = useInView(ref, { once: true, margin: margin as `${number}px` })
  return { ref, isInView: shouldAnimate ? isInView : true, shouldAnimate }
}

// ---------------------------------------------------------------------------
// Hero section
// ---------------------------------------------------------------------------

function HeroSection() {
  const { shouldAnimate } = useAnimationSettings()
  const router = useRouter()
  const [loadingPath, setLoadingPath] = useState<string | null>(null)

  function handleNav(path: string) {
    setLoadingPath(path)
    router.push(path)
  }

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: shouldAnimate ? 0.08 : 0, delayChildren: 0.1 },
    },
  }

  const item = {
    hidden: shouldAnimate ? { opacity: 0, y: 24 } : { opacity: 1 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: DURATION.slow, ease: EASING.easeOut },
    },
  }

  return (
    <div className="relative overflow-hidden bg-(--color-surface-0)">
      {/* Background layers */}
      <div className="absolute inset-0 border-(--color-border) bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:14px_24px] opacity-30" />
      <div className="bg-sky-gradient absolute inset-0" />
      <div className="bg-noise absolute inset-0" />

      {/* Gradient orbs */}
      <div className="bg-primary/10 absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl" />
      <div className="bg-accent/10 absolute top-1/2 -right-32 h-80 w-80 rounded-full blur-3xl" />
      <div className="bg-primary/5 absolute -bottom-16 left-1/3 h-64 w-64 rounded-full blur-3xl" />

      {/* Horizon line */}
      <div className="horizon-line absolute right-0 bottom-0 left-0 h-px" />

      {/* Floating planes (CSS animated — already reduced-motion safe) */}
      <div className="absolute top-20 left-[15%] opacity-[0.15]" aria-hidden="true">
        <Plane
          className="text-primary-300 animate-float h-10 w-10 rotate-12"
          style={{ animationDelay: '0s' }}
        />
      </div>
      <div className="absolute top-40 right-[20%] opacity-[0.15]" aria-hidden="true">
        <Plane
          className="text-accent animate-float h-8 w-8 -rotate-6"
          style={{ animationDelay: '1s' }}
        />
      </div>
      <div className="absolute bottom-32 left-[10%] opacity-[0.12]" aria-hidden="true">
        <Plane
          className="text-primary-300 animate-float h-6 w-6 rotate-3"
          style={{ animationDelay: '2s' }}
        />
      </div>
      <div className="absolute top-32 right-[10%] opacity-[0.08]" aria-hidden="true">
        <Plane
          className="text-primary-200 animate-float h-12 w-12 -rotate-12"
          style={{ animationDelay: '1.5s' }}
        />
      </div>

      <div className="relative container mx-auto px-4 py-28 sm:py-36">
        <motion.div
          className="flex flex-col items-center space-y-10 text-center"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div
            variants={item}
            className="border-foreground/10 bg-foreground/5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-sm"
          >
            <Zap className="text-warning h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-primary text-sm font-medium">Aviation Operations Platform</span>
          </motion.div>

          {/* Logo & Title */}
          <motion.div variants={item} className="flex flex-col items-center gap-6">
            <div className="shadow-primary/10 border-foreground/10 bg-foreground/5 rounded-2xl border p-4 shadow-2xl backdrop-blur-sm">
              <Plane className="text-primary h-16 w-16" />
            </div>
            <h1
              className="font-display text-foreground/10 max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
              suppressHydrationWarning
            >
              Fleet Management
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={item}
            className="text-gradient-aviation font-display max-w-3xl text-xl leading-relaxed font-semibold sm:text-2xl lg:text-3xl"
          >
            Enterprise-grade aviation fleet management platform
          </motion.p>

          <motion.p
            variants={item}
            className="text-foreground/70 max-w-2xl text-lg leading-relaxed"
          >
            Streamline pilot certification tracking, leave management, and compliance monitoring
            with our comprehensive aviation operations platform.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={item} className="flex flex-col gap-4 pt-4 sm:flex-row">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}>
              <Button
                size="lg"
                variant="aviation"
                className="h-14 px-10 text-base font-semibold"
                disabled={!!loadingPath}
                onClick={() => handleNav('/auth/login')}
              >
                {loadingPath === '/auth/login' ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Loading…
                  </>
                ) : (
                  <>
                    Admin Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}>
              <Button
                size="lg"
                className="border-foreground/20 bg-foreground/10 text-foreground hover:bg-foreground/20 h-14 px-10 text-base font-semibold backdrop-blur-sm"
                disabled={!!loadingPath}
                onClick={() => handleNav('/portal/login')}
              >
                {loadingPath === '/portal/login' ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Loading…
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-5 w-5" />
                    Pilot Portal
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={item}
            className="text-foreground/50 flex flex-wrap items-center justify-center gap-8 pt-8 text-sm"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" aria-hidden="true" />
              <span>FAA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
              <span>Real-time Monitoring</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>24/7 Operations</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stats bar — scroll-triggered
// ---------------------------------------------------------------------------

function StatsBar() {
  const { ref, isInView, shouldAnimate } = useScrollReveal()

  return (
    <motion.div
      ref={ref}
      initial={shouldAnimate ? { opacity: 0, y: 12 } : undefined}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: DURATION.enter, ease: EASING.easeOut }}
      className="border-border bg-card border-y"
    >
      <div className="divide-border container mx-auto grid grid-cols-2 gap-0 divide-x px-4 md:grid-cols-4">
        <StatItem number="600+" label="Certifications Tracked" />
        <StatItem number="30+" label="Active Pilots" />
        <StatItem number="13" label="Roster Periods / Year" />
        <StatItem number="99.9%" label="Compliance Rate" />
      </div>
    </motion.div>
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

// ---------------------------------------------------------------------------
// Features grid — staggered scroll-reveal
// ---------------------------------------------------------------------------

function FeaturesSection() {
  const { ref, isInView, shouldAnimate } = useScrollReveal()

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: shouldAnimate ? 0.06 : 0, delayChildren: 0.15 },
    },
  }

  const cardItem = {
    hidden: shouldAnimate ? { opacity: 0, y: 20, scale: 0.98 } : { opacity: 1 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: DURATION.enter, ease: EASING.easeOut },
    },
  }

  const features = [
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Pilot Management',
      description:
        'Comprehensive pilot profiles with certification tracking, qualifications, seniority management, and automated compliance monitoring.',
      accentColor: 'primary' as const,
    },
    {
      icon: <Gauge className="h-8 w-8" />,
      title: 'Certification Tracking',
      description:
        'Track multiple check types with automated expiry alerts, detailed certification history, and regulatory compliance reporting.',
      accentColor: 'accent' as const,
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Analytics & Reporting',
      description:
        'Real-time fleet metrics, compliance statistics, and visual insights with interactive charts and comprehensive reports.',
      accentColor: 'primary' as const,
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: 'Leave Management',
      description:
        'Streamlined leave request system with roster period alignment, automated approval workflows, and crew availability tracking.',
      accentColor: 'accent' as const,
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Security & Compliance',
      description:
        'Enterprise-grade security with role-based access control, comprehensive audit logging, and FAA compliance standards.',
      accentColor: 'primary' as const,
    },
    {
      icon: <Radio className="h-8 w-8" />,
      title: 'Automated Monitoring',
      description:
        'Proactive expiry monitoring with color-coded status indicators, automated notifications, and compliance tracking.',
      accentColor: 'accent' as const,
    },
  ]

  return (
    <div className="mb-24">
      <motion.div
        ref={ref}
        initial={shouldAnimate ? { opacity: 0, y: 16 } : undefined}
        animate={isInView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: DURATION.enter, ease: EASING.easeOut }}
      >
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
      </motion.div>

      <motion.div
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        variants={container}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        {features.map((feature) => (
          <motion.div key={feature.title} variants={cardItem}>
            <FeatureCard {...feature} shouldAnimate={shouldAnimate} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  accentColor = 'primary',
  shouldAnimate = true,
}: {
  icon: React.ReactNode
  title: string
  description: string
  accentColor?: 'primary' | 'accent'
  shouldAnimate?: boolean
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
    <motion.div
      whileHover={shouldAnimate ? { y: -4, scale: 1.01 } : undefined}
      transition={gentleSpring}
    >
      <Card
        className={`${colors.hover} bg-card group border-border h-full transition-shadow duration-200 hover:shadow-xl`}
      >
        <CardHeader>
          <div
            className={`${colors.icon} mb-3 w-fit rounded-xl p-3 transition-transform duration-200 group-hover:scale-110`}
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
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Benefits section — scroll-triggered
// ---------------------------------------------------------------------------

function BenefitsSection() {
  const { ref, isInView, shouldAnimate } = useScrollReveal()

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: shouldAnimate ? 0.08 : 0, delayChildren: 0.1 },
    },
  }

  const item = {
    hidden: shouldAnimate ? { opacity: 0, y: 16 } : { opacity: 1 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: DURATION.enter, ease: EASING.easeOut },
    },
  }

  const benefits = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Save Time',
      description:
        'Automate manual processes and reduce administrative overhead with intelligent workflow automation.',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Ensure Compliance',
      description:
        'Stay ahead of regulatory requirements with automated compliance tracking and comprehensive audit trails.',
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Data-Driven Insights',
      description:
        'Make informed decisions with real-time analytics and comprehensive fleet performance metrics.',
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: 'Improve Efficiency',
      description:
        'Streamline operations with centralized data management and seamless team collaboration tools.',
    },
  ]

  return (
    <motion.div
      ref={ref}
      className="border-border bg-card relative overflow-hidden rounded-3xl border p-12 shadow-lg"
      initial={shouldAnimate ? { opacity: 0, y: 24 } : undefined}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: DURATION.slow, ease: EASING.easeOut }}
    >
      <div className="horizon-line absolute top-0 right-0 left-0" />
      <div className="mb-4 text-center">
        <span className="text-accent bg-accent/10 inline-block rounded-full px-4 py-1 text-sm font-semibold">
          Benefits
        </span>
      </div>
      <h2 className="font-display text-foreground mb-10 text-center text-3xl font-bold sm:text-4xl">
        Why Choose Our Platform?
      </h2>
      <motion.div
        className="mx-auto grid max-w-4xl gap-10 md:grid-cols-2"
        variants={container}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        {benefits.map((benefit) => (
          <motion.div key={benefit.title} variants={item}>
            <BenefitItem {...benefit} />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
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
      <div className="text-primary bg-primary/10 group-hover:bg-primary/20 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-110">
        {icon}
      </div>
      <div>
        <h3 className="font-display text-foreground mb-1 text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CTA section — scroll-triggered
// ---------------------------------------------------------------------------

function CTASection() {
  const { ref, isInView, shouldAnimate } = useScrollReveal()
  const router = useRouter()
  const [loadingPath, setLoadingPath] = useState<string | null>(null)

  function handleNav(path: string) {
    setLoadingPath(path)
    router.push(path)
  }

  return (
    <div className="bg-(--color-surface-0) py-20">
      <motion.div
        ref={ref}
        className="container mx-auto px-4 text-center"
        initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
        animate={isInView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: DURATION.enter, ease: EASING.easeOut }}
      >
        <h2 className="text-foreground font-display mb-4 text-3xl font-bold sm:text-4xl">
          Ready to Get Started?
        </h2>
        <p className="text-foreground/60 mx-auto mb-8 max-w-xl text-lg">
          Access the admin dashboard to manage your fleet or log in to the pilot portal.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}>
            <Button
              size="lg"
              variant="aviation"
              className="h-12 px-8 text-base"
              disabled={!!loadingPath}
              onClick={() => handleNav('/auth/login')}
            >
              {loadingPath === '/auth/login' ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Loading…
                </>
              ) : (
                <>
                  Admin Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}>
            <Button
              size="lg"
              className="border-foreground/20 bg-foreground/10 text-foreground hover:bg-foreground/20 h-12 px-8 text-base"
              disabled={!!loadingPath}
              onClick={() => handleNav('/portal/login')}
            >
              {loadingPath === '/portal/login' ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Loading…
                </>
              ) : (
                'Pilot Portal'
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer() {
  return (
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
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function AnimatedLandingContent() {
  return (
    <div className="min-h-screen">
      {/* Floating theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <HeroSection />
      <StatsBar />
      <div className="container mx-auto px-4 py-20">
        <FeaturesSection />
        <BenefitsSection />
      </div>
      <CTASection />
      <Footer />
    </div>
  )
}
