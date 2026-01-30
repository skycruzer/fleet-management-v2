/**
 * Help Page Client Component
 * Tabbed interface for FAQs and Pilot Feedback
 *
 * @author Maurice Rondeau
 * @version 1.0.0
 */

'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FaqContent } from '@/components/help/faq-content'
import { FeedbackDashboardClient } from '@/components/admin/feedback-dashboard-client'
import { HelpCircle, MessageSquare } from 'lucide-react'
import type { FeedbackWithPilot, FeedbackStats } from '@/lib/services/feedback-service'

type TabValue = 'faqs' | 'feedback'

interface HelpPageClientProps {
  initialFeedback: FeedbackWithPilot[]
  initialStats: FeedbackStats
  currentUserId: string
  currentUserName: string
}

export function HelpPageClient({
  initialFeedback,
  initialStats,
  currentUserId,
  currentUserName,
}: HelpPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentTab = (searchParams.get('tab') as TabValue) || 'faqs'

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'faqs') {
      params.delete('tab')
    } else {
      params.set('tab', value)
    }
    const queryString = params.toString()
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
          Help & Feedback
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">FAQs and pilot feedback management</p>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:inline-grid lg:w-auto">
          <TabsTrigger value="faqs" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            <span>FAQs</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Pilot Feedback</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faqs" className="mt-4">
          <FaqContent />
        </TabsContent>

        <TabsContent value="feedback" className="mt-4">
          <FeedbackDashboardClient
            initialFeedback={initialFeedback}
            initialStats={initialStats}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
