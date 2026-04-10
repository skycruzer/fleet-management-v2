/**
 * Certifications Tabs Container Component
 * Tab-based navigation for different certification views with URL sync
 *
 * @author Maurice Rondeau
 * @version 1.1.0
 * @created 2025-12-19
 * @updated 2026-02 - Migrated to nuqs for URL state management
 */

'use client'

import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CertificationsTable } from './certifications-table'
import { AttentionRequiredView } from './attention-required-view'
import { CategoryView } from './category-view'
import type { CertificationWithDetails } from '@/lib/services/certification-service'
import { List, AlertTriangle, FolderTree } from 'lucide-react'

const TAB_VALUES = ['all', 'attention', 'category'] as const
type TabValue = (typeof TAB_VALUES)[number]

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
  // nuqs manages URL sync automatically — replaces manual useSearchParams + router.push
  const [currentTab, setCurrentTab] = useQueryState(
    'tab',
    parseAsStringLiteral(TAB_VALUES).withDefault('all')
  )

  return (
    <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as TabValue)} className="w-full">
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
