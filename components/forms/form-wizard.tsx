'use client'

/**
 * Form Wizard Component
 * Multi-step form with progress tracking and validation
 * Supports step navigation, validation, and animated transitions
 *
 * @author Maurice (Skycruzer)
 * @version 1.0.0
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

export interface WizardStep {
  /** Step identifier */
  id: string
  /** Step title */
  title: string
  /** Optional description */
  description?: string
  /** Validation function - return true if valid */
  validate?: () => boolean | Promise<boolean>
  /** Optional icon */
  icon?: React.ReactNode
}

interface FormWizardProps {
  /** Step definitions */
  steps: WizardStep[]
  /** Current step index */
  currentStep?: number
  /** Callback when step changes */
  onStepChange?: (step: number) => void
  /** Step content - receives current step index */
  children: React.ReactNode | ((stepIndex: number) => React.ReactNode)
  /** Called when wizard completes */
  onComplete?: () => void | Promise<void>
  /** Loading state for submit */
  isSubmitting?: boolean
  /** Complete button text */
  completeButtonText?: string
  /** Allow clicking on step indicators to navigate */
  allowStepClick?: boolean
  /** Show step numbers in indicators */
  showStepNumbers?: boolean
  /** Additional className */
  className?: string
}

interface FormWizardContextValue {
  currentStep: number
  totalSteps: number
  goToStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

const FormWizardContext = React.createContext<FormWizardContextValue | null>(null)

export function useFormWizard() {
  const context = React.useContext(FormWizardContext)
  if (!context) {
    throw new Error('useFormWizard must be used within a FormWizard')
  }
  return context
}

// Step Indicator Component
function StepIndicator({
  step,
  index,
  currentStep,
  onClick,
  showNumber,
  clickable,
}: {
  step: WizardStep
  index: number
  currentStep: number
  onClick?: () => void
  showNumber: boolean
  clickable: boolean
}) {
  const isActive = index === currentStep
  const isCompleted = index < currentStep

  return (
    <button
      type="button"
      onClick={clickable && index < currentStep ? onClick : undefined}
      disabled={!clickable || index >= currentStep}
      className={cn(
        'flex items-center gap-2 transition-all duration-200',
        clickable && index < currentStep && 'cursor-pointer hover:opacity-80'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-all duration-300',
          isCompleted && 'bg-[var(--color-status-low)] text-white',
          isActive && 'bg-primary text-primary-foreground ring-primary/20 ring-4',
          !isActive && !isCompleted && 'bg-muted text-muted-foreground'
        )}
      >
        {isCompleted ? (
          <Check className="h-4 w-4" />
        ) : showNumber ? (
          index + 1
        ) : step.icon ? (
          step.icon
        ) : (
          index + 1
        )}
      </div>
      <div className="hidden text-left sm:block">
        <p
          className={cn(
            'text-sm font-medium transition-colors',
            isActive && 'text-foreground',
            !isActive && 'text-muted-foreground'
          )}
        >
          {step.title}
        </p>
        {step.description && <p className="text-muted-foreground text-xs">{step.description}</p>}
      </div>
    </button>
  )
}

// Progress Bar
function ProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
      <div
        className="bg-primary h-full transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export function FormWizard({
  steps,
  currentStep: controlledStep,
  onStepChange,
  children,
  onComplete,
  isSubmitting = false,
  completeButtonText = 'Complete',
  allowStepClick = true,
  showStepNumbers = true,
  className,
}: FormWizardProps) {
  const [internalStep, setInternalStep] = React.useState(0)
  const [isValidating, setIsValidating] = React.useState(false)

  // Support both controlled and uncontrolled modes
  const currentStep = controlledStep ?? internalStep
  const setCurrentStep = onStepChange ?? setInternalStep

  const totalSteps = steps.length
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1
  const activeStep = steps[currentStep]

  const goToStep = React.useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step)
      }
    },
    [totalSteps, setCurrentStep]
  )

  const nextStep = React.useCallback(async () => {
    if (activeStep?.validate) {
      setIsValidating(true)
      const isValid = await activeStep.validate()
      setIsValidating(false)
      if (!isValid) return
    }

    if (isLastStep) {
      await onComplete?.()
    } else {
      goToStep(currentStep + 1)
    }
  }, [activeStep, isLastStep, onComplete, goToStep, currentStep])

  const prevStep = React.useCallback(() => {
    if (!isFirstStep) {
      goToStep(currentStep - 1)
    }
  }, [isFirstStep, goToStep, currentStep])

  const contextValue: FormWizardContextValue = {
    currentStep,
    totalSteps,
    goToStep,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
  }

  return (
    <FormWizardContext.Provider value={contextValue}>
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="space-y-4 pb-4">
          {/* Mobile: Progress bar */}
          <div className="sm:hidden">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">{activeStep?.title}</span>
              <span className="text-muted-foreground text-xs">
                Step {currentStep + 1} of {totalSteps}
              </span>
            </div>
            <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
          </div>

          {/* Desktop: Step indicators */}
          <div className="hidden items-center justify-between gap-4 sm:flex">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <StepIndicator
                  step={step}
                  index={index}
                  currentStep={currentStep}
                  onClick={() => goToStep(index)}
                  showNumber={showStepNumbers}
                  clickable={allowStepClick}
                />
                {index < totalSteps - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 transition-colors duration-300',
                      index < currentStep ? 'bg-[var(--color-status-low)]' : 'bg-muted'
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Step content with animation */}
          <div className="relative overflow-hidden">
            <div className="transition-all duration-300 ease-out" key={currentStep}>
              {typeof children === 'function' ? children(currentStep) : children}
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/50 flex justify-between gap-4 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={isFirstStep || isSubmitting}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            type="button"
            onClick={nextStep}
            disabled={isSubmitting || isValidating}
            className="gap-1"
          >
            {isSubmitting || isValidating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isValidating ? 'Validating...' : 'Submitting...'}
              </>
            ) : isLastStep ? (
              completeButtonText
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </FormWizardContext.Provider>
  )
}

/**
 * Individual wizard step wrapper
 * Use to wrap content for each step
 */
export function WizardStepContent({
  stepIndex,
  currentStep,
  children,
  className,
}: {
  stepIndex: number
  currentStep: number
  children: React.ReactNode
  className?: string
}) {
  if (stepIndex !== currentStep) return null

  return (
    <div className={cn('animate-in fade-in slide-in-from-right-4 duration-300', className)}>
      {children}
    </div>
  )
}

export { type FormWizardProps }
