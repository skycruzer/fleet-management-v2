/**
 * Landing Page Content
 * Developer: Maurice Rondeau
 *
 * Client component with Framer Motion animations.
 * Expo-inspired: monochromatic, gallery-paced, pill geometry.
 */

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import {
  Users,
  BarChart3,
  Shield,
  CheckCircle,
  Clock,
  Calendar,
  Gauge,
  Radio,
  ArrowRight,
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
// Hero section — Expo: massive headline, monochromatic, pill CTAs
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
    <div className="bg-background relative">
      <div className="container mx-auto px-4 py-32 sm:py-40 lg:py-48">
        <motion.div
          className="flex flex-col items-center space-y-8 text-center"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div
            variants={item}
            className="inline-flex items-center gap-2 rounded-[9999px] border border-[var(--color-input)] bg-white px-4 py-1.5 dark:bg-[#1a1a1a]"
          >
            <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
            <span className="text-muted-foreground text-sm font-medium">
              Aviation Operations Platform
            </span>
          </motion.div>

          {/* Title — Expo: massive, compressed tracking */}
          <motion.h1
            variants={item}
            className="max-w-4xl text-5xl font-bold tracking-[-0.03em] sm:text-6xl lg:text-7xl"
            suppressHydrationWarning
          >
            Fleet Management
          </motion.h1>

          {/* Subtitle — Expo: Slate Gray, large body */}
          <motion.p
            variants={item}
            className="text-muted-foreground max-w-2xl text-lg leading-relaxed sm:text-xl"
          >
            Streamline pilot certification tracking, leave management, and compliance monitoring
            with our comprehensive aviation operations platform.
          </motion.p>

          {/* CTA Buttons — Expo: black pill primary, white-border secondary */}
          <motion.div variants={item} className="flex flex-col gap-4 pt-4 sm:flex-row">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={spring}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[9999px] bg-black px-8 text-base font-medium text-white transition-colors hover:bg-[#1c2024] disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-[#e5e5e5]"
              disabled={!!loadingPath}
              onClick={() => handleNav('/auth/login')}
            >
              {loadingPath === '/auth/login' ? (
                <>
                  <span className="mr-1 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Loading...
                </>
              ) : (
                <>
                  Admin Dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={spring}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[9999px] border border-[var(--color-input)] bg-white px-8 text-base font-medium text-[#1c2024] transition-colors hover:bg-[#f5f5f5] disabled:opacity-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-[#e5e5e5] dark:hover:bg-[#222222]"
              disabled={!!loadingPath}
              onClick={() => handleNav('/portal/login')}
            >
              {loadingPath === '/portal/login' ? (
                <>
                  <span className="mr-1 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Loading...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4" />
                  Pilot Portal
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Trust indicators — Expo: muted, compact */}
          <motion.div
            variants={item}
            className="text-muted-foreground flex flex-wrap items-center justify-center gap-8 pt-6 text-sm"
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
// Stats bar
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
      <p className="text-3xl font-bold tracking-[-0.02em]">{number}</p>
      <p className="text-muted-foreground mt-1 text-sm">{label}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Features grid
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
      icon: <Users className="h-6 w-6" />,
      title: 'Pilot Management',
      description:
        'Comprehensive pilot profiles with certification tracking, qualifications, seniority management, and automated compliance monitoring.',
    },
    {
      icon: <Gauge className="h-6 w-6" />,
      title: 'Certification Tracking',
      description:
        'Track multiple check types with automated expiry alerts, detailed certification history, and regulatory compliance reporting.',
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Analytics & Reporting',
      description:
        'Real-time fleet metrics, compliance statistics, and visual insights with interactive charts and comprehensive reports.',
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: 'Leave Management',
      description:
        'Streamlined leave request system with roster period alignment, automated approval workflows, and crew availability tracking.',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Security & Compliance',
      description:
        'Enterprise-grade security with role-based access control, comprehensive audit logging, and FAA compliance standards.',
    },
    {
      icon: <Radio className="h-6 w-6" />,
      title: 'Automated Monitoring',
      description:
        'Proactive expiry monitoring with color-coded status indicators, automated notifications, and compliance tracking.',
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
        <h2 className="mb-4 text-center text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
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
  shouldAnimate = true,
}: {
  icon: React.ReactNode
  title: string
  description: string
  shouldAnimate?: boolean
}) {
  return (
    <motion.div
      whileHover={shouldAnimate ? { y: -2 } : undefined}
      transition={gentleSpring}
      className="bg-card border-border group h-full rounded-lg border p-6 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="text-foreground mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f0f3] dark:bg-[#222222]">
        {icon}
      </div>
      <h3 className="text-foreground mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Benefits section
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
      icon: <Clock className="h-5 w-5" />,
      title: 'Save Time',
      description:
        'Automate manual processes and reduce administrative overhead with intelligent workflow automation.',
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Ensure Compliance',
      description:
        'Stay ahead of regulatory requirements with automated compliance tracking and comprehensive audit trails.',
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'Data-Driven Insights',
      description:
        'Make informed decisions with real-time analytics and comprehensive fleet performance metrics.',
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      title: 'Improve Efficiency',
      description:
        'Streamline operations with centralized data management and seamless team collaboration tools.',
    },
  ]

  return (
    <motion.div
      ref={ref}
      className="bg-card border-border rounded-2xl border p-12 shadow-[var(--shadow-card)]"
      initial={shouldAnimate ? { opacity: 0, y: 24 } : undefined}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: DURATION.slow, ease: EASING.easeOut }}
    >
      <h2 className="mb-10 text-center text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
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
      <div className="text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0f0f3] transition-colors dark:bg-[#222222]">
        {icon}
      </div>
      <div>
        <h3 className="mb-1 text-base font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CTA section
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
    <div className="bg-background py-24">
      <motion.div
        ref={ref}
        className="container mx-auto px-4 text-center"
        initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
        animate={isInView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: DURATION.enter, ease: EASING.easeOut }}
      >
        <h2 className="mb-4 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
          Ready to Get Started?
        </h2>
        <p className="text-muted-foreground mx-auto mb-8 max-w-xl text-lg">
          Access the admin dashboard to manage your fleet or log in to the pilot portal.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[9999px] bg-black px-8 text-base font-medium text-white transition-colors hover:bg-[#1c2024] disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-[#e5e5e5]"
            disabled={!!loadingPath}
            onClick={() => handleNav('/auth/login')}
          >
            {loadingPath === '/auth/login' ? (
              <>
                <span className="mr-1 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading...
              </>
            ) : (
              <>
                Admin Dashboard
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[9999px] border border-[var(--color-input)] bg-white px-8 text-base font-medium text-[#1c2024] transition-colors hover:bg-[#f5f5f5] disabled:opacity-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-[#e5e5e5] dark:hover:bg-[#222222]"
            disabled={!!loadingPath}
            onClick={() => handleNav('/portal/login')}
          >
            {loadingPath === '/portal/login' ? (
              <>
                <span className="mr-1 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading...
              </>
            ) : (
              'Pilot Portal'
            )}
          </motion.button>
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
    <footer className="border-border border-t py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <span className="text-sm font-semibold tracking-[-0.01em]">Fleet Management</span>
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} Fleet Management. All rights reserved.
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
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <HeroSection />
      <StatsBar />
      <div className="container mx-auto px-4 py-24">
        <FeaturesSection />
        <BenefitsSection />
      </div>
      <CTASection />
      <Footer />
    </div>
  )
}
