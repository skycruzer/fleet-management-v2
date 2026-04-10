/**
 * Requests Tab Navigation
 * Developer: Maurice Rondeau
 *
 * Client component for tab-based category switching on the requests page.
 * Uses router.push for URL navigation instead of asChild+Link (avoids button>a nesting).
 */

'use client'

import { useRouter } from 'next/navigation'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'

interface RequestsTabNavProps {
  activeTab: string
  viewMode: string
}

export function RequestsTabNav({ activeTab, viewMode }: RequestsTabNavProps) {
  const router = useRouter()

  return (
    <TabsList className="grid w-full max-w-md grid-cols-2">
      <TabsTrigger
        value="leave"
        onClick={() => router.push(`/dashboard/requests?tab=leave&view=${viewMode}`)}
      >
        Leave Requests
      </TabsTrigger>
      <TabsTrigger
        value="flight"
        onClick={() => router.push(`/dashboard/requests?tab=flight&view=${viewMode}`)}
      >
        RDO/SDO Requests
      </TabsTrigger>
    </TabsList>
  )
}
