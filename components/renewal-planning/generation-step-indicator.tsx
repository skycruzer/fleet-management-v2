/**
 * Generation Step Indicator
 *
 * 3-step progress indicator for the renewal plan generation wizard.
 * Shows: Configure → Preview → Results
 */

'use client'

import { Check, Settings, Eye, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type WizardStep = 'configure' | 'preview' | 'results'

interface GenerationStepIndicatorProps {
  currentStep: WizardStep
  className?: string
}

const STEPS: { id: WizardStep; label: string; description: string; icon: typeof Settings }[] = [
  {
    id: 'configure',
    label: 'Configure',
    description: 'Set planning parameters',
    icon: Settings,
  },
  {
    id: 'preview',
    label: 'Preview',
    description: 'Review & adjust',
    icon: Eye,
  },
  {
    id: 'results',
    label: 'Results',
    description: 'View summary',
    icon: CheckCircle2,
  },
]

export function GenerationStepIndicator({ currentStep, className }: GenerationStepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep)

  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      <ol className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = step.id === currentStep
          const Icon = step.icon

          return (
            <li key={step.id} className="relative flex flex-1 items-center">
              {/* Connector line (not for first item) */}
              {index > 0 && (
                <div
                  className={cn(
                    'absolute top-5 right-1/2 h-0.5 w-full -translate-y-1/2',
                    isCompleted || isCurrent ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}

              {/* Step indicator */}
              <div className="relative z-10 flex w-full flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                    isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCurrent
                        ? 'border-primary bg-background text-primary'
                        : 'border-border bg-background text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCurrent
                        ? 'text-primary'
                        : isCompleted
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-muted-foreground hidden text-xs sm:block">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector line (not for last item) */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'absolute top-5 left-1/2 h-0.5 w-full -translate-y-1/2',
                    isCompleted ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
