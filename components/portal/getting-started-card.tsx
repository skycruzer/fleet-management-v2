'use client'

/**
 * Getting Started Onboarding Card
 *
 * Shown to pilots on their first visit to the dashboard.
 * Dismissal is stored in localStorage so it only appears once.
 */

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Plane, FileCheck, Calendar, MessageSquare } from 'lucide-react'

const DISMISSED_KEY = 'portal_getting_started_dismissed'

export function GettingStartedCard() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DISMISSED_KEY)
      if (!dismissed) {
        setVisible(true)
      }
    } catch {
      // localStorage may be unavailable in some environments — silently skip
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // ignore
    }
  }

  if (!visible) return null

  return (
    <div className="mb-8">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-foreground mb-1 text-lg font-semibold">
                Welcome to the Pilot Portal
              </h2>
              <p className="text-muted-foreground mb-4 text-sm">
                Get started by exploring the key features available to you.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <FileCheck className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="text-foreground">View your certifications and expiry dates</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="text-foreground">Submit leave and RDO/SDO requests</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Plane className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="text-foreground">Track your leave bid status</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="text-foreground">Submit feedback to management</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={dismiss}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Dismiss getting started card"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
