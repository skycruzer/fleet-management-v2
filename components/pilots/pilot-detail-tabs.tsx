/**
 * Pilot Detail Tabs Component
 *
 * Provides tabbed navigation for pilot details (Overview + Certifications)
 * Replaces modal-based certification editing with full-page tabs.
 *
 * Developer: Maurice Rondeau
 * @date December 6, 2025
 */

'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PilotOverviewTab } from './pilot-overview-tab'
import { PilotCertificationsTab } from './pilot-certifications-tab'
import { User, FileCheck, Plane } from 'lucide-react'

// Pilot interface - aligned with Supabase pilots table schema
export interface Pilot {
  id: string
  employee_id: string
  first_name: string
  middle_name: string | null
  last_name: string
  role: 'Captain' | 'First Officer'
  is_active: boolean
  seniority_number: number | null
  date_of_birth: string | null
  commencement_date: string | null
  nationality: string | null
  passport_number: string | null
  passport_expiry: string | null
  licence_type: 'ATPL' | 'CPL' | null
  licence_number: string | null
  contract_type: string | null
  contract_type_id: string | null
  captain_qualifications: Record<string, boolean> | string[] | null
  qualification_notes: string | null
  rhs_captain_expiry: string | null
  user_id: string | null
  created_at: string
  updated_at: string
  // Computed field from API response
  certificationStatus: {
    current: number
    expiring: number
    expired: number
  }
}

// Certification interface - aligned with Supabase pilot_checks + check_types schema
export interface Certification {
  id: string
  pilot_id: string
  check_type_id: string
  expiry_date: string | null
  created_at: string
  updated_at: string
  check_type?: {
    id: string
    check_code: string
    check_description: string
    category: string | null
  }
}

interface PilotDetailTabsProps {
  pilot: Pilot
  initialCertifications: Certification[]
  retirementAge: number
  onPilotDelete: () => Promise<void>
  onCertificationUpdate: () => void
  csrfToken: string | null
  isDeleting: boolean
}

export function PilotDetailTabs({
  pilot,
  initialCertifications,
  retirementAge,
  onPilotDelete,
  onCertificationUpdate,
  csrfToken,
  isDeleting,
}: PilotDetailTabsProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [certifications, setCertifications] = useState<Certification[]>(initialCertifications)

  const handleSwitchToCertifications = () => {
    setActiveTab('certifications')
  }

  const handleCertificationSaved = () => {
    onCertificationUpdate()
  }

  const handleCertificationsLoaded = (certs: Certification[]) => {
    setCertifications(certs)
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-2 lg:w-[400px]">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Overview</span>
        </TabsTrigger>
        <TabsTrigger value="certifications" className="flex items-center gap-2">
          <FileCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Certifications</span>
          {(pilot.certificationStatus.expiring > 0 || pilot.certificationStatus.expired > 0) && (
            <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-500 px-1.5 text-xs font-bold text-white">
              {pilot.certificationStatus.expiring + pilot.certificationStatus.expired}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <PilotOverviewTab
          pilot={pilot}
          retirementAge={retirementAge}
          onPilotDelete={onPilotDelete}
          onViewCertifications={handleSwitchToCertifications}
          isDeleting={isDeleting}
        />
      </TabsContent>

      <TabsContent value="certifications">
        <PilotCertificationsTab
          pilot={pilot}
          initialCertifications={certifications}
          csrfToken={csrfToken}
          onCertificationSaved={handleCertificationSaved}
          onCertificationsLoaded={handleCertificationsLoaded}
        />
      </TabsContent>
    </Tabs>
  )
}
