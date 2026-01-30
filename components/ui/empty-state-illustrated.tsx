/**
 * Illustrated Empty State Components
 * Developer: Maurice Rondeau
 * Aviation-themed empty states with SVG illustrations and contextual guidance
 */

'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import { EASING } from '@/lib/animations'

interface IllustratedEmptyStateProps {
  variant:
    | 'no-flights'
    | 'no-pilots'
    | 'no-certifications'
    | 'no-leave'
    | 'no-requests'
    | 'no-results'
    | 'welcome'
    | 'error'
  title: string
  description?: string
  suggestions?: string[]
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
}

// Aviation-themed SVG illustrations
function PlaneIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-32 w-32', className)}
    >
      {/* Sky background circle */}
      <circle cx="60" cy="60" r="55" fill="url(#skyGradient)" opacity="0.1" />

      {/* Cloud 1 */}
      <ellipse cx="30" cy="45" rx="12" ry="6" fill="currentColor" opacity="0.1" />
      <ellipse cx="25" cy="43" rx="8" ry="5" fill="currentColor" opacity="0.1" />

      {/* Cloud 2 */}
      <ellipse cx="90" cy="55" rx="10" ry="5" fill="currentColor" opacity="0.1" />
      <ellipse cx="85" cy="53" rx="7" ry="4" fill="currentColor" opacity="0.1" />

      {/* Plane body */}
      <path
        d="M75 60L45 50L25 55L45 60L25 65L45 70L75 60Z"
        fill="url(#planeGradient)"
        className="animate-float"
        style={{ animationDelay: '0.5s' }}
      />

      {/* Plane wing */}
      <path
        d="M50 60L35 45L55 55L50 60L55 65L35 75L50 60Z"
        fill="url(#planeGradient)"
        opacity="0.8"
      />

      {/* Contrail */}
      <path
        d="M25 60C20 60 15 58 10 58"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.2"
      />
      <path
        d="M25 62C18 62 12 61 5 60"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.15"
      />

      {/* Horizon line */}
      <line x1="5" y1="85" x2="115" y2="85" stroke="url(#horizonGradient)" strokeWidth="1" />

      <defs>
        <linearGradient id="skyGradient" x1="60" y1="5" x2="60" y2="115">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="planeGradient" x1="25" y1="60" x2="75" y2="60">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="horizonGradient" x1="5" y1="85" x2="115" y2="85">
          <stop stopColor="transparent" />
          <stop offset="0.2" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="0.5" stopColor="#06b6d4" stopOpacity="0.5" />
          <stop offset="0.8" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="1" stopColor="transparent" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function PilotIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-32 w-32', className)}
    >
      {/* Background circle */}
      <circle cx="60" cy="60" r="55" fill="url(#pilotBgGradient)" opacity="0.1" />

      {/* Captain hat */}
      <path d="M35 45H85L80 35H40L35 45Z" fill="url(#hatGradient)" />
      <rect x="30" y="45" width="60" height="8" rx="2" fill="url(#hatGradient)" />

      {/* Hat badge */}
      <circle cx="60" cy="40" r="5" fill="#fbbf24" opacity="0.8" />

      {/* Face */}
      <circle cx="60" cy="70" r="20" fill="currentColor" opacity="0.15" />

      {/* Wings badge */}
      <path d="M45 95L60 90L75 95L60 88L45 95Z" fill="url(#wingsGradient)" />
      <circle cx="60" cy="92" r="3" fill="#fbbf24" opacity="0.8" />

      <defs>
        <linearGradient id="pilotBgGradient" x1="60" y1="5" x2="60" y2="115">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1e40af" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hatGradient" x1="30" y1="40" x2="90" y2="40">
          <stop stopColor="#1e3a8a" />
          <stop offset="1" stopColor="#1e40af" />
        </linearGradient>
        <linearGradient id="wingsGradient" x1="45" y1="92" x2="75" y2="92">
          <stop stopColor="#fbbf24" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function CertificationIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-32 w-32', className)}
    >
      {/* Background */}
      <circle cx="60" cy="60" r="55" fill="url(#certBgGradient)" opacity="0.1" />

      {/* Certificate document */}
      <rect
        x="25"
        y="25"
        width="70"
        height="55"
        rx="4"
        fill="currentColor"
        opacity="0.1"
        stroke="url(#certBorderGradient)"
        strokeWidth="2"
      />

      {/* Lines on certificate */}
      <line x1="35" y1="40" x2="85" y2="40" stroke="currentColor" strokeWidth="2" opacity="0.2" />
      <line
        x1="35"
        y1="50"
        x2="75"
        y2="50"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.15"
      />
      <line
        x1="35"
        y1="58"
        x2="70"
        y2="58"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.15"
      />
      <line
        x1="35"
        y1="66"
        x2="65"
        y2="66"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.15"
      />

      {/* Badge/seal */}
      <circle cx="75" cy="90" r="18" fill="url(#sealGradient)" />
      <circle cx="75" cy="90" r="14" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />

      {/* Checkmark */}
      <path
        d="M68 90L73 95L83 85"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <defs>
        <linearGradient id="certBgGradient" x1="60" y1="5" x2="60" y2="115">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#059669" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="certBorderGradient" x1="25" y1="25" x2="95" y2="80">
          <stop stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="1" stopColor="#06b6d4" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="sealGradient" x1="57" y1="72" x2="93" y2="108">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function CalendarIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-32 w-32', className)}
    >
      {/* Background */}
      <circle cx="60" cy="60" r="55" fill="url(#calBgGradient)" opacity="0.1" />

      {/* Calendar body */}
      <rect
        x="20"
        y="30"
        width="80"
        height="70"
        rx="6"
        fill="currentColor"
        opacity="0.1"
        stroke="url(#calBorderGradient)"
        strokeWidth="2"
      />

      {/* Calendar header */}
      <rect x="20" y="30" width="80" height="18" rx="6" fill="url(#calHeaderGradient)" />

      {/* Calendar rings */}
      <rect x="35" y="25" width="4" height="12" rx="2" fill="currentColor" opacity="0.3" />
      <rect x="55" y="25" width="4" height="12" rx="2" fill="currentColor" opacity="0.3" />
      <rect x="75" y="25" width="4" height="12" rx="2" fill="currentColor" opacity="0.3" />

      {/* Calendar days grid */}
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3, 4, 5, 6].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={28 + col * 10}
            y={55 + row * 9}
            width="6"
            height="6"
            rx="1"
            fill="currentColor"
            opacity={row === 2 && col === 3 ? 0.4 : 0.1}
          />
        ))
      )}

      {/* Highlighted day */}
      <circle cx="63" cy="76" r="5" fill="url(#dayHighlightGradient)" />

      {/* Plane icon in corner */}
      <path
        d="M85 92L95 87L90 85L85 87L80 85L85 90L85 92Z"
        fill="url(#calPlaneGradient)"
        opacity="0.6"
      />

      <defs>
        <linearGradient id="calBgGradient" x1="60" y1="5" x2="60" y2="115">
          <stop stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="calBorderGradient" x1="20" y1="30" x2="100" y2="100">
          <stop stopColor="#8b5cf6" stopOpacity="0.3" />
          <stop offset="1" stopColor="#6366f1" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="calHeaderGradient" x1="20" y1="30" x2="100" y2="48">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="dayHighlightGradient" x1="58" y1="71" x2="68" y2="81">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="calPlaneGradient" x1="80" y1="85" x2="95" y2="92">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function SearchIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-32 w-32', className)}
    >
      {/* Background */}
      <circle cx="60" cy="60" r="55" fill="url(#searchBgGradient)" opacity="0.1" />

      {/* Magnifying glass */}
      <circle
        cx="50"
        cy="50"
        r="25"
        stroke="url(#searchRingGradient)"
        strokeWidth="4"
        fill="none"
      />
      <circle cx="50" cy="50" r="18" fill="currentColor" opacity="0.05" />

      {/* Handle */}
      <line
        x1="68"
        y1="68"
        x2="90"
        y2="90"
        stroke="url(#searchHandleGradient)"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Question mark inside */}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.3"
        fontSize="24"
        fontWeight="bold"
      >
        ?
      </text>

      {/* Sparkles */}
      <circle cx="30" cy="30" r="2" fill="url(#sparkleGradient)" className="animate-subtle-pulse" />
      <circle
        cx="85"
        cy="40"
        r="1.5"
        fill="url(#sparkleGradient)"
        className="animate-subtle-pulse"
        style={{ animationDelay: '0.3s' }}
      />
      <circle
        cx="25"
        cy="75"
        r="1.5"
        fill="url(#sparkleGradient)"
        className="animate-subtle-pulse"
        style={{ animationDelay: '0.6s' }}
      />

      <defs>
        <linearGradient id="searchBgGradient" x1="60" y1="5" x2="60" y2="115">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#4f46e5" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="searchRingGradient" x1="25" y1="25" x2="75" y2="75">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="searchHandleGradient" x1="68" y1="68" x2="90" y2="90">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1e40af" />
        </linearGradient>
        <linearGradient id="sparkleGradient" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function WelcomeIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-32 w-32', className)}
    >
      {/* Background */}
      <circle cx="60" cy="60" r="55" fill="url(#welcomeBgGradient)" opacity="0.1" />

      {/* Globe */}
      <circle cx="60" cy="60" r="35" stroke="url(#globeGradient)" strokeWidth="2" fill="none" />
      <ellipse
        cx="60"
        cy="60"
        rx="35"
        ry="15"
        stroke="url(#globeGradient)"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />
      <ellipse
        cx="60"
        cy="60"
        rx="15"
        ry="35"
        stroke="url(#globeGradient)"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />

      {/* Flight path arc */}
      <path
        d="M30 70 Q60 30 90 70"
        stroke="url(#flightPathGradient)"
        strokeWidth="2"
        strokeDasharray="4 2"
        fill="none"
      />

      {/* Plane on path */}
      <g className="animate-float">
        <path
          d="M58 45L68 40L63 42L58 40L53 42L58 47L58 45Z"
          fill="url(#welcomePlaneGradient)"
          transform="rotate(-30 58 45)"
        />
      </g>

      {/* Location markers */}
      <circle cx="35" cy="68" r="3" fill="#10b981" />
      <circle cx="85" cy="68" r="3" fill="#f59e0b" />

      <defs>
        <linearGradient id="welcomeBgGradient" x1="60" y1="5" x2="60" y2="115">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1e40af" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="globeGradient" x1="25" y1="25" x2="95" y2="95">
          <stop stopColor="#3b82f6" stopOpacity="0.5" />
          <stop offset="1" stopColor="#06b6d4" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="flightPathGradient" x1="30" y1="70" x2="90" y2="70">
          <stop stopColor="#10b981" />
          <stop offset="0.5" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="welcomePlaneGradient" x1="53" y1="40" x2="68" y2="47">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function ErrorIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-32 w-32', className)}
    >
      {/* Background */}
      <circle cx="60" cy="60" r="55" fill="url(#errorBgGradient)" opacity="0.1" />

      {/* Warning triangle */}
      <path
        d="M60 25L95 85H25L60 25Z"
        fill="none"
        stroke="url(#errorStrokeGradient)"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Inner fill */}
      <path d="M60 32L88 80H32L60 32Z" fill="currentColor" opacity="0.05" />

      {/* Exclamation mark */}
      <line
        x1="60"
        y1="45"
        x2="60"
        y2="62"
        stroke="url(#errorExclamationGradient)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="60" cy="72" r="3" fill="url(#errorExclamationGradient)" />

      {/* Radar waves */}
      <path
        d="M20 90 Q35 85 50 90"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.2"
      />
      <path
        d="M70 90 Q85 85 100 90"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.2"
      />

      <defs>
        <linearGradient id="errorBgGradient" x1="60" y1="5" x2="60" y2="115">
          <stop stopColor="#ef4444" />
          <stop offset="1" stopColor="#dc2626" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="errorStrokeGradient" x1="25" y1="85" x2="95" y2="25">
          <stop stopColor="#f59e0b" />
          <stop offset="1" stopColor="#ef4444" />
        </linearGradient>
        <linearGradient id="errorExclamationGradient" x1="60" y1="45" x2="60" y2="75">
          <stop stopColor="#f59e0b" />
          <stop offset="1" stopColor="#ef4444" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const illustrations = {
  'no-flights': PlaneIllustration,
  'no-pilots': PilotIllustration,
  'no-certifications': CertificationIllustration,
  'no-leave': CalendarIllustration,
  'no-requests': CalendarIllustration,
  'no-results': SearchIllustration,
  welcome: WelcomeIllustration,
  error: ErrorIllustration,
}

export function IllustratedEmptyState({
  variant,
  title,
  description,
  suggestions,
  action,
  secondaryAction,
  className,
}: IllustratedEmptyStateProps) {
  const { shouldAnimate } = useAnimationSettings()
  const Illustration = illustrations[variant]

  const containerVariants = shouldAnimate
    ? { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
    : { initial: { opacity: 1 }, animate: { opacity: 1 } }

  const illustrationVariants = shouldAnimate
    ? { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 } }
    : { initial: { scale: 1, opacity: 1 }, animate: { scale: 1, opacity: 1 } }

  return (
    <Card className={cn('p-12 text-center', className)}>
      <motion.div
        initial={containerVariants.initial}
        animate={containerVariants.animate}
        transition={shouldAnimate ? { duration: 0.3, ease: EASING.easeOut } : { duration: 0 }}
        className="flex flex-col items-center"
      >
        {/* Illustration */}
        <motion.div
          initial={illustrationVariants.initial}
          animate={illustrationVariants.animate}
          transition={
            shouldAnimate
              ? { delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }
              : { duration: 0 }
          }
          className="text-muted-foreground mb-6"
        >
          <Illustration />
        </motion.div>

        {/* Title */}
        <motion.h3
          initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={shouldAnimate ? { delay: 0.15 } : { duration: 0 }}
          className="font-display text-foreground mb-3 text-2xl font-semibold"
        >
          {title}
        </motion.h3>

        {/* Description */}
        {description && (
          <motion.p
            initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={shouldAnimate ? { delay: 0.2 } : { duration: 0 }}
            className="text-muted-foreground mx-auto mb-6 max-w-md text-base"
          >
            {description}
          </motion.p>
        )}

        {/* Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={shouldAnimate ? { delay: 0.25 } : { duration: 0 }}
            className="mb-6 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4"
          >
            <p className="text-muted-foreground mb-2 text-sm font-medium">Try this:</p>
            <ul className="text-muted-foreground space-y-1 text-sm">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-primary">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Actions */}
        {(action || secondaryAction) && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={shouldAnimate ? { delay: 0.3 } : { duration: 0 }}
            className="flex items-center gap-3"
          >
            {action && (
              <motion.div
                whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
              >
                {action.href ? (
                  <Button variant="aviation" onClick={action.onClick} asChild>
                    <a href={action.href}>{action.label}</a>
                  </Button>
                ) : (
                  <Button variant="aviation" onClick={action.onClick}>
                    {action.label}
                  </Button>
                )}
              </motion.div>
            )}
            {secondaryAction && (
              <motion.div
                whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
              >
                {secondaryAction.href ? (
                  <Button onClick={secondaryAction.onClick} variant="outline" asChild>
                    <a href={secondaryAction.href}>{secondaryAction.label}</a>
                  </Button>
                ) : (
                  <Button onClick={secondaryAction.onClick} variant="outline">
                    {secondaryAction.label}
                  </Button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>
    </Card>
  )
}

/**
 * Specialized empty states for common scenarios
 */
export function NoFlightsEmptyState({
  onAddFlight,
  className,
}: {
  onAddFlight?: () => void
  className?: string
}) {
  return (
    <IllustratedEmptyState
      variant="no-flights"
      title="No Flights Scheduled"
      description="Your flight schedule is clear. Add a new flight request to get started."
      suggestions={['Check your date range filters', 'Submit a new flight request']}
      action={onAddFlight ? { label: 'Add Flight Request', onClick: onAddFlight } : undefined}
      className={className}
    />
  )
}

export function NoPilotsEmptyState({
  onAddPilot,
  className,
}: {
  onAddPilot?: () => void
  className?: string
}) {
  return (
    <IllustratedEmptyState
      variant="no-pilots"
      title="No Pilots Found"
      description="Start building your crew roster by adding pilot profiles."
      suggestions={['Import pilots from CSV', 'Add pilots manually']}
      action={onAddPilot ? { label: 'Add Pilot', onClick: onAddPilot } : undefined}
      className={className}
    />
  )
}

export function NoCertificationsEmptyState({
  onAddCertification,
  className,
}: {
  onAddCertification?: () => void
  className?: string
}) {
  return (
    <IllustratedEmptyState
      variant="no-certifications"
      title="No Certifications"
      description="Track pilot qualifications and compliance by adding certifications."
      suggestions={['Add training records', 'Import certification data']}
      action={
        onAddCertification ? { label: 'Add Certification', onClick: onAddCertification } : undefined
      }
      className={className}
    />
  )
}

export function NoLeaveRequestsEmptyState({
  onRequestLeave,
  className,
}: {
  onRequestLeave?: () => void
  className?: string
}) {
  return (
    <IllustratedEmptyState
      variant="no-leave"
      title="No Leave Requests"
      description="You don't have any leave requests yet. Submit one when you need time off."
      suggestions={['Check the leave calendar for availability', 'Review roster periods']}
      action={onRequestLeave ? { label: 'Request Leave', onClick: onRequestLeave } : undefined}
      className={className}
    />
  )
}

export function WelcomeEmptyState({
  userName,
  onGetStarted,
  className,
}: {
  userName?: string
  onGetStarted?: () => void
  className?: string
}) {
  return (
    <IllustratedEmptyState
      variant="welcome"
      title={userName ? `Welcome, ${userName}!` : 'Welcome to Fleet Management'}
      description="Your aviation operations hub. Manage pilots, track certifications, and streamline scheduling all in one place."
      action={onGetStarted ? { label: 'Get Started', onClick: onGetStarted } : undefined}
      className={className}
    />
  )
}
