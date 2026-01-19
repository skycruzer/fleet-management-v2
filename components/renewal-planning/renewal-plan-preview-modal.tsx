/**
 * Renewal Plan Preview Modal
 *
 * Category-centric preview of renewal plan before emailing/exporting.
 * Uses tabs to show each category's distribution, capacity, and pilots.
 */

'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Download,
  Mail,
  Calendar,
  BarChart3,
  Users,
  UserX,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Loader2,
  Stethoscope,
  Plane,
  Monitor,
  GraduationCap,
  LayoutGrid,
  Link2,
  FileText,
  Table2,
} from 'lucide-react'
import { CategoryDetailTab } from './category-detail-tab'
import { PairingVisualizationPanel } from './pairing-visualization-panel'
import { cn } from '@/lib/utils'
import type { PairedCrew, UnpairedPilot, PairingStatistics } from '@/lib/types/pairing'

interface RosterPeriodSummary {
  rosterPeriod: string
  periodStartDate: Date
  periodEndDate: Date
  totalPlannedRenewals: number
  totalCapacity: number
  utilizationPercentage: number
  categoryBreakdown: Record<
    string,
    {
      plannedCount: number
      capacity: number
      pilots: Array<{ id: string; name: string; checkType: string; employeeId?: string }>
    }
  >
}

interface RenewalPlanPreviewModalProps {
  open: boolean
  onClose: () => void
  year: number
  summaries: RosterPeriodSummary[]
  onExportPDF?: () => void
  onExportCSV?: () => void
  onSendEmail?: () => Promise<void>
  // Pairing data for Flight/Simulator checks
  pairingData?: {
    pairs: PairedCrew[]
    unpaired: UnpairedPilot[]
    statistics: PairingStatistics
  }
  onUnpair?: (pairId: string) => void
  onFindPair?: (pilotId: string) => void
}

const CATEGORIES = [
  { id: 'Pilot Medical', label: 'Medical', icon: Stethoscope, color: 'text-red-500' },
  { id: 'Flight Checks', label: 'Flight', icon: Plane, color: 'text-blue-500' },
  { id: 'Simulator Checks', label: 'Simulator', icon: Monitor, color: 'text-purple-500' },
  { id: 'Ground Courses Refresher', label: 'Ground', icon: GraduationCap, color: 'text-green-500' },
]

export function RenewalPlanPreviewModal({
  open,
  onClose,
  year,
  summaries,
  onExportPDF,
  onExportCSV,
  onSendEmail,
  pairingData,
  onUnpair,
  onFindPair,
}: RenewalPlanPreviewModalProps) {
  const [isEmailing, setIsEmailing] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Aggregate data by category
  const categoryData = useMemo(() => {
    const data: Record<
      string,
      {
        totalRenewals: number
        totalCapacity: number
        utilization: number
        periodDistribution: Array<{
          rosterPeriod: string
          plannedCount: number
          capacity: number
          utilization: number
          pilots: Array<{
            id: string
            name: string
            employeeId: string
            checkType: string
            rosterPeriod: string
            plannedDate: Date
            expiryDate: Date
          }>
        }>
        pilots: Array<{
          id: string
          name: string
          employeeId: string
          checkType: string
          rosterPeriod: string
          plannedDate: Date
          expiryDate: Date
        }>
      }
    > = {}

    // Initialize categories
    CATEGORIES.forEach((cat) => {
      data[cat.id] = {
        totalRenewals: 0,
        totalCapacity: 0,
        utilization: 0,
        periodDistribution: [],
        pilots: [],
      }
    })

    // Aggregate from summaries
    summaries.forEach((summary) => {
      Object.entries(summary.categoryBreakdown).forEach(([category, breakdown]) => {
        if (!data[category]) return

        data[category].totalRenewals += breakdown.plannedCount
        data[category].totalCapacity += breakdown.capacity

        // Add period distribution
        data[category].periodDistribution.push({
          rosterPeriod: summary.rosterPeriod,
          plannedCount: breakdown.plannedCount,
          capacity: breakdown.capacity,
          utilization:
            breakdown.capacity > 0 ? (breakdown.plannedCount / breakdown.capacity) * 100 : 0,
          pilots: breakdown.pilots.map((p) => ({
            id: p.id,
            name: p.name,
            employeeId: p.employeeId || '',
            checkType: p.checkType,
            rosterPeriod: summary.rosterPeriod,
            plannedDate: summary.periodStartDate,
            expiryDate: summary.periodEndDate,
          })),
        })

        // Add pilots to overall list
        breakdown.pilots.forEach((pilot) => {
          data[category].pilots.push({
            id: pilot.id,
            name: pilot.name,
            employeeId: pilot.employeeId || '',
            checkType: pilot.checkType,
            rosterPeriod: summary.rosterPeriod,
            plannedDate: summary.periodStartDate,
            expiryDate: summary.periodEndDate,
          })
        })
      })
    })

    // Calculate utilization for each category
    Object.keys(data).forEach((category) => {
      const cat = data[category]
      cat.utilization = cat.totalCapacity > 0 ? (cat.totalRenewals / cat.totalCapacity) * 100 : 0
    })

    return data
  }, [summaries])

  // Calculate overall statistics
  const totalRenewals = summaries.reduce((sum, s) => sum + s.totalPlannedRenewals, 0)
  const totalCapacity = summaries.reduce((sum, s) => sum + s.totalCapacity, 0)
  const avgUtilization = totalCapacity > 0 ? (totalRenewals / totalCapacity) * 100 : 0
  const activePeriods = summaries.filter((s) => s.totalPlannedRenewals > 0).length
  const highRiskPeriods = summaries.filter((s) => s.utilizationPercentage > 80).length

  const handleSendEmail = async () => {
    if (!onSendEmail) return
    setIsEmailing(true)
    try {
      await onSendEmail()
      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 3000)
    } catch (error) {
      console.error('Failed to send email:', error)
    } finally {
      setIsEmailing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="text-primary h-5 w-5" />
            Renewal Plan Preview - {year}
          </DialogTitle>
          <DialogDescription>
            Review renewal plan by category before exporting or emailing
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <TabsList className="mb-4 grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            {pairingData && (
              <TabsTrigger value="pairing" className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-cyan-500" />
                <span className="hidden sm:inline">Pairing</span>
                {pairingData.statistics.totalUnpaired > 0 && (
                  <Badge
                    variant="outline"
                    className="ml-1 h-4 border-orange-300 px-1 text-[10px] text-orange-600"
                  >
                    {pairingData.statistics.totalUnpaired}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const catData = categoryData[cat.id]
              return (
                <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-1.5">
                  <Icon className={cn('h-3.5 w-3.5', cat.color)} />
                  <span className="hidden sm:inline">{cat.label}</span>
                  {catData && catData.totalRenewals > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {catData.totalRenewals}
                    </Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-2">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* Summary Statistics */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard
                  icon={Users}
                  label="Total Renewals"
                  value={totalRenewals}
                  iconColor="text-blue-500"
                />
                <StatCard
                  icon={Calendar}
                  label="Active Periods"
                  value={activePeriods}
                  subtext={`of ${summaries.length}`}
                  iconColor="text-purple-500"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Avg Utilization"
                  value={`${Math.round(avgUtilization)}%`}
                  iconColor={
                    avgUtilization > 80
                      ? 'text-red-500'
                      : avgUtilization > 60
                        ? 'text-yellow-500'
                        : 'text-green-500'
                  }
                />
                <StatCard
                  icon={AlertTriangle}
                  label="High Risk"
                  value={highRiskPeriods}
                  subtext="periods >80%"
                  iconColor={highRiskPeriods > 0 ? 'text-red-500' : 'text-green-500'}
                  variant={highRiskPeriods > 0 ? 'warning' : 'default'}
                />
              </div>

              <Separator />

              {/* Category Summary Cards */}
              <div>
                <h3 className="text-foreground mb-3 font-semibold">By Category</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon
                    const catData = categoryData[cat.id]
                    if (!catData) return null

                    return (
                      <Card
                        key={cat.id}
                        className={cn(
                          'hover:bg-muted/50 cursor-pointer p-4 transition-colors',
                          activeTab === cat.id && 'ring-primary ring-2'
                        )}
                        onClick={() => setActiveTab(cat.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-muted rounded-lg p-2">
                              <Icon className={cn('h-5 w-5', cat.color)} />
                            </div>
                            <div>
                              <h4 className="font-semibold">{cat.id}</h4>
                              <p className="text-muted-foreground text-sm">
                                {catData.totalRenewals} renewals / {catData.totalCapacity} capacity
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              catData.utilization > 80 && 'border-red-300 text-red-600',
                              catData.utilization > 60 &&
                                catData.utilization <= 80 &&
                                'border-yellow-300 text-yellow-600',
                              catData.utilization <= 60 && 'border-green-300 text-green-600'
                            )}
                          >
                            {Math.round(catData.utilization)}%
                          </Badge>
                        </div>

                        {/* Mini progress bar */}
                        <div className="bg-secondary mt-3 h-1.5 w-full overflow-hidden rounded-full">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              catData.utilization > 80 && 'bg-red-500',
                              catData.utilization > 60 &&
                                catData.utilization <= 80 &&
                                'bg-yellow-500',
                              catData.utilization <= 60 && 'bg-green-500'
                            )}
                            style={{ width: `${Math.min(catData.utilization, 100)}%` }}
                          />
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Status Banners */}
              {highRiskPeriods > 0 && (
                <Card className="border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                        Capacity Warning
                      </h4>
                      <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                        {highRiskPeriods} roster period{highRiskPeriods > 1 ? 's' : ''} exceed
                        {highRiskPeriods === 1 ? 's' : ''} 80% utilization. Click on category tabs
                        to see details.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {highRiskPeriods === 0 && totalRenewals > 0 && (
                <Card className="border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Renewal plan is well-balanced and ready for distribution
                    </span>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Pairing Tab */}
            {pairingData && (
              <TabsContent value="pairing" className="mt-0">
                <PairingVisualizationPanel
                  pairs={pairingData.pairs}
                  unpaired={pairingData.unpaired}
                  statistics={pairingData.statistics}
                  onUnpair={onUnpair}
                  onFindPair={onFindPair}
                  showActions={!!onUnpair || !!onFindPair}
                />
              </TabsContent>
            )}

            {/* Category Tabs */}
            {CATEGORIES.map((cat) => {
              const catData = categoryData[cat.id]
              if (!catData) return null

              return (
                <TabsContent key={cat.id} value={cat.id} className="mt-0">
                  <CategoryDetailTab
                    category={cat.id}
                    totalRenewals={catData.totalRenewals}
                    totalCapacity={catData.totalCapacity}
                    utilization={catData.utilization}
                    periodDistribution={catData.periodDistribution}
                    pilots={catData.pilots}
                  />
                </TabsContent>
              )
            })}
          </div>
        </Tabs>

        <DialogFooter className="mt-4 flex-col gap-2 border-t pt-4 sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onExportPDF} disabled={totalRenewals === 0}>
              <FileText className="mr-2 h-4 w-4 text-red-500" />
              PDF
            </Button>
            <Button variant="outline" onClick={onExportCSV} disabled={totalRenewals === 0}>
              <Table2 className="mr-2 h-4 w-4 text-green-500" />
              CSV
            </Button>
          </div>
          <Button onClick={handleSendEmail} disabled={totalRenewals === 0 || isEmailing}>
            {isEmailing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : emailSent ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Email Sent!
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Email to Team
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Stat Card Component
 */
interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  subtext?: string
  iconColor?: string
  variant?: 'default' | 'warning'
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  iconColor = 'text-primary',
  variant = 'default',
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'p-4',
        variant === 'warning' &&
          'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'bg-muted rounded-lg p-2',
            variant === 'warning' && 'bg-yellow-100 dark:bg-yellow-900'
          )}
        >
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-foreground text-2xl font-bold">{value}</span>
            {subtext && <span className="text-muted-foreground text-xs">{subtext}</span>}
          </div>
          <p className="text-muted-foreground text-xs">{label}</p>
        </div>
      </div>
    </Card>
  )
}
