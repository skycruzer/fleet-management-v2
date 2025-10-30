/**
 * Email Renewal Plan Button Component
 * Client component for sending renewal plan emails
 *
 * FEATURES:
 * - Loading state during email send
 * - Toast notifications for success/error
 * - Disabled state when no data exists
 * - Form submission with year parameter
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface EmailRenewalPlanButtonProps {
  year: number
  disabled?: boolean
  hasData?: boolean
}

export function EmailRenewalPlanButton({ year, disabled, hasData = true }: EmailRenewalPlanButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('year', year.toString())

      const response = await fetch('/api/renewal-planning/email', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 404) {
          toast.error('No Data Available', {
            description: data.details || `No renewal plans found for ${year}`,
          })
        } else if (response.status === 503) {
          // Email service not configured
          toast.error('Email Service Not Configured', {
            description: 'Please install Resend package and configure environment variables',
            duration: 8000,
          })
          console.error('Setup instructions:', data.setup)
        } else {
          toast.error('Email Failed', {
            description: data.details || 'Failed to send email',
          })
        }
        return
      }

      // Success
      toast.success('Email Sent Successfully', {
        description: `Renewal plan for ${year} has been sent to the rostering team`,
        duration: 5000,
      })

      console.log('Email sent:', data)
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Network Error', {
        description: 'Failed to connect to email service. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = disabled || !hasData || isLoading

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="year" value={year} />
      <Button size="sm" type="submit" disabled={isDisabled}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Email to Rostering Team
          </>
        )}
      </Button>
    </form>
  )
}
