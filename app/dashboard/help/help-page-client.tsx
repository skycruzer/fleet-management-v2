/**
 * Help Center Client Component
 * FAQ content display
 *
 * @author Maurice Rondeau
 */
'use client'

import { FaqContent } from '@/components/help/faq-content'
import { Breadcrumb } from '@/components/navigation/breadcrumb'

export function HelpPageClient() {
  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div>
        <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
          Help Center
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Frequently asked questions and documentation
        </p>
      </div>
      <FaqContent />
    </div>
  )
}
