/**
 * Certifications Tabs Container Component
 * Tab-based navigation for different certification views with URL sync
 *
 * @author Maurice Rondeau
 * @version 1.0.0
 * @created 2025-12-19
 */

'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CertificationsTable } from './certifications-table'
import { AttentionRequiredView } from './attention-required-view'
import { CategoryView } from './category-view'
import type { CertificationWithDetails } from '@/lib/services/certification-service'
import { List, AlertTriangle, FolderTree } from 'lucide-react'

type TabValue = 'all' | 'attention' | 'category'

interface CertificationsTabsProps {
  certifications: CertificationWithDetails[]
  attentionCount: number
  onEditCertification?: (certId: string) => void
}

export function CertificationsTabs({
  certifications,
  attentionCount,
  onEditCertification,
}: CertificationsTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get tab from URL or default to 'all'
  const currentTab = (searchParams.get('tab') as TabValue) || 'all'

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('tab')
    } else {
      params.set('tab', value)
    }
    const queryString = params.toString()
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 lg:inline-grid lg:w-auto">
        <TabsTrigger value="all" className="gap-2">
          <List className="h-4 w-4" />
          <span className="hidden sm:inline">All</span>
        </TabsTrigger>
        <TabsTrigger value="attention" className="gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="hidden sm:inline">Attention</span>
          {attentionCount > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
              {attentionCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="category" className="gap-2">
          <FolderTree className="h-4 w-4" />
          <span className="hidden sm:inline">By Category</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-4">
        <CertificationsTable certifications={certifications} />
      </TabsContent>

      <TabsContent value="attention" className="mt-4">
        <AttentionRequiredView
          certifications={certifications}
          onEditCertification={onEditCertification}
        />
      </TabsContent>

      <TabsContent value="category" className="mt-4">
        <CategoryView certifications={certifications} onEditCertification={onEditCertification} />
      </TabsContent>
    </Tabs>
  )
}
