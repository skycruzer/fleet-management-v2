# Renewal Planning Calendar View & PDF Export - Implementation Plan

**Date**: October 24, 2025
**Feature**: Calendar visualization and PDF/Email distribution for renewal planning
**Status**: 📋 Planning Phase
**BMAP Methodology**: Applied

---

## Executive Summary

This document outlines the implementation plan for adding **calendar visualization** (yearly and monthly views), **PDF export functionality**, and **email distribution** to the Certification Renewal Planning system.

**Key Features**:
1. 📅 **Yearly Calendar View** - Visual overview of all 13 roster periods across the year
2. 📆 **Monthly Calendar View** - Detailed pilot-level renewals for a specific month
3. 📄 **PDF Export** - Professional PDF report generation for distribution
4. 📧 **Email Integration** - Direct email delivery to rostering team

---

## BMAP Analysis

### 🎯 Business Analyst Perspective

#### Business Requirements

**1. Calendar Visualization**

**Yearly View**:
- Display all 13 roster periods (RP01-RP13) in a calendar format
- Show renewal counts per period
- Color-coding for capacity utilization:
  - 🟢 Green: <60% utilization (good)
  - 🟡 Yellow: 60-80% utilization (medium)
  - 🔴 Red: >80% utilization (high risk)
- Clickable periods to drill down to details

**Monthly View**:
- Show all renewals scheduled in a specific month
- Group by roster period
- Display pilot name, check type, planned date
- Category breakdown (Flight, Simulator, Ground)
- Filter and sort capabilities

**2. PDF Export**

**Content Structure**:
1. **Cover Page**:
   - Title: "Certification Renewal Planning Report"
   - Report period (e.g., "2025 Annual Plan")
   - Generation date
   - Company branding

2. **Executive Summary**:
   - Total renewals planned
   - Overall utilization percentage
   - High-risk periods (>80% utilization)
   - Key statistics by category

3. **Yearly Calendar**:
   - Visual representation of all 13 roster periods
   - Capacity indicators
   - Renewal counts per period

4. **Roster Period Breakdown**:
   - Detailed table for each roster period
   - Pilot list with check types
   - Capacity utilization

5. **Pilot Schedule Section**:
   - Alphabetical list of pilots
   - Each pilot's scheduled renewals
   - Planned dates and check types

**3. Email Integration**

**Email Template**:
```
Subject: Certification Renewal Planning - [Year]

Dear Rostering Team,

Please find attached the latest Certification Renewal Planning report for [Year].

Summary:
- Total Renewals: [X]
- Roster Periods: 13
- Overall Utilization: [XX]%
- High-Risk Periods: [X]

This plan ensures all pilot certifications are renewed within regulatory grace periods while avoiding December and January holiday months.

Please review the attached PDF for detailed roster period breakdowns and pilot-specific schedules.

Best regards,
Fleet Management System
```

**Configuration**:
- Rostering team email address (stored in admin settings)
- CC recipients (optional)
- Send copies to Fleet Manager and Training Manager

#### User Workflows

**Workflow 1: View Calendar**
1. Navigate to Renewal Planning Dashboard
2. Click "Calendar View" tab
3. View yearly overview
4. Click specific month/roster period
5. View monthly details with pilot list

**Workflow 2: Export PDF**
1. Navigate to Renewal Planning Dashboard
2. Click "Export PDF" button
3. System generates PDF (2-3 seconds)
4. PDF downloads to user's device
5. User can open, review, and distribute

**Workflow 3: Email to Rostering Team**
1. Navigate to Renewal Planning Dashboard
2. Click "Email to Rostering Team" button
3. System confirms rostering team email address
4. User clicks "Send"
5. PDF generated and attached to email
6. Email sent, confirmation message displayed

---

### 👔 Manager Perspective

#### Operational Impact

**Benefits**:

1. **Visual Planning** (Calendar View):
   - ✅ Quick identification of capacity bottlenecks
   - ✅ Easy month-to-month comparison
   - ✅ Better coordination with rostering team
   - ✅ Improved stakeholder communication

2. **Distribution Efficiency** (PDF Export):
   - ✅ Standardized professional reports
   - ✅ Offline review capability
   - ✅ Shareable with multiple stakeholders
   - ✅ Audit trail (PDF includes generation date)

3. **Communication Automation** (Email Integration):
   - ✅ Reduces manual email composition
   - ✅ Ensures consistent messaging
   - ✅ Faster distribution to rostering team
   - ✅ Automated PDF attachment

**Resource Requirements**:

| Resource | Requirement | Status |
|----------|-------------|--------|
| **Development Time** | 7-10 hours | Planned |
| **Email Provider** | Resend API or Supabase Edge Functions | To configure |
| **PDF Library** | jspdf + jspdf-autotable (already in project) | ✅ Available |
| **Testing Time** | 2-3 hours | Planned |

#### Stakeholder Benefits

| Stakeholder | Benefit |
|-------------|---------|
| **Fleet Manager** | Visual overview, easy PDF distribution |
| **Training Manager** | Advance notice of renewal loads by month |
| **Rostering Team** | Automated plan delivery, professional format |
| **Operations Manager** | Better coordination between departments |
| **Pilots** | Transparent visibility of renewal schedules |

---

### 🏗️ Architect Perspective

#### Technical Architecture

**Component Structure**:

```
app/
├── dashboard/
│   └── renewal-planning/
│       ├── page.tsx                    # Existing dashboard (add tabs)
│       ├── calendar/
│       │   ├── page.tsx                # Calendar view container
│       │   ├── yearly/page.tsx         # Yearly calendar
│       │   └── monthly/[month]/page.tsx # Monthly calendar
│       └── export/
│           └── route.ts                # PDF export API route

components/
├── renewal-planning/
│   ├── renewal-calendar-yearly.tsx     # NEW: Yearly calendar component
│   ├── renewal-calendar-monthly.tsx    # NEW: Monthly calendar component
│   ├── renewal-calendar-day-cell.tsx   # NEW: Individual day cell
│   └── renewal-pdf-preview.tsx         # NEW: PDF preview modal

lib/
├── services/
│   ├── renewal-planning-pdf-service.ts # NEW: PDF generation
│   └── email-service.ts                # NEW: Email sending
└── types/
    └── renewal-planning.ts             # Extend types for calendar

Database:
├── system_settings table               # Store rostering_team_email
└── certification_renewal_plans         # Existing (read-only for PDF)
```

#### Implementation Details

**1. Calendar View Components**

**Yearly Calendar Component**:
```typescript
// components/renewal-planning/renewal-calendar-yearly.tsx

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface RosterPeriodSummary {
  rosterPeriod: string
  periodStartDate: Date
  periodEndDate: Date
  totalPlannedRenewals: number
  totalCapacity: number
  utilizationPercentage: number
  isExcluded: boolean // December/January
}

export function RenewalCalendarYearly({ summaries }: { summaries: RosterPeriodSummary[] }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {summaries.map((summary) => {
        const color = getUtilizationColor(summary.utilizationPercentage)

        return (
          <Link key={summary.rosterPeriod} href={`/dashboard/renewal-planning/calendar/monthly/${summary.rosterPeriod}`}>
            <Card className={`p-4 hover:shadow-lg transition ${color}`}>
              <h3 className="font-bold text-lg">{summary.rosterPeriod}</h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(summary.periodStartDate)} - {formatDate(summary.periodEndDate)}
              </p>

              {summary.isExcluded ? (
                <Badge variant="destructive">Excluded (Holiday)</Badge>
              ) : (
                <>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">{summary.totalPlannedRenewals}</span>
                    <span className="text-muted-foreground"> / {summary.totalCapacity}</span>
                  </div>
                  <Badge className={getBadgeColor(summary.utilizationPercentage)}>
                    {Math.round(summary.utilizationPercentage)}%
                  </Badge>
                </>
              )}
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

function getUtilizationColor(utilization: number): string {
  if (utilization > 80) return 'bg-red-50 border-red-200'
  if (utilization > 60) return 'bg-yellow-50 border-yellow-200'
  return 'bg-green-50 border-green-200'
}
```

**Monthly Calendar Component**:
```typescript
// components/renewal-planning/renewal-calendar-monthly.tsx

import { Table } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface RenewalItem {
  id: string
  pilot: {
    first_name: string
    last_name: string
    employee_id: string
  }
  check_type: {
    check_code: string
    check_description: string
    category: string
  }
  planned_renewal_date: string
  roster_period: string
}

export function RenewalCalendarMonthly({ renewals, rosterPeriod }: {
  renewals: RenewalItem[]
  rosterPeriod: string
}) {
  // Group renewals by category
  const byCategory = renewals.reduce((acc, renewal) => {
    const category = renewal.check_type.category
    if (!acc[category]) acc[category] = []
    acc[category].push(renewal)
    return acc
  }, {} as Record<string, RenewalItem[]>)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Renewals for {rosterPeriod}</h2>

      {Object.entries(byCategory).map(([category, items]) => (
        <Card key={category} className="p-6">
          <h3 className="text-lg font-semibold mb-4">{category}</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pilot</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Check Type</TableHead>
                <TableHead>Planned Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((renewal) => (
                <TableRow key={renewal.id}>
                  <TableCell>
                    {renewal.pilot.first_name} {renewal.pilot.last_name}
                  </TableCell>
                  <TableCell>{renewal.pilot.employee_id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{renewal.check_type.check_code}</p>
                      <p className="text-xs text-muted-foreground">
                        {renewal.check_type.check_description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(renewal.planned_renewal_date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ))}
    </div>
  )
}
```

**2. PDF Generation Service**

```typescript
// lib/services/renewal-planning-pdf-service.ts

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from '@/lib/utils/date-utils'

interface RenewalPlanPDFData {
  year: number
  summaries: RosterPeriodSummary[]
  renewals: RenewalItem[]
  generatedAt: Date
}

export async function generateRenewalPlanPDF(data: RenewalPlanPDFData): Promise<Blob> {
  const doc = new jsPDF()

  // Page 1: Cover Page
  addCoverPage(doc, data)

  // Page 2: Executive Summary
  doc.addPage()
  addExecutiveSummary(doc, data)

  // Page 3+: Yearly Calendar
  doc.addPage()
  addYearlyCalendar(doc, data)

  // Page 4+: Roster Period Breakdown
  data.summaries.forEach((summary) => {
    if (!summary.isExcluded) {
      doc.addPage()
      addRosterPeriodDetail(doc, summary, data.renewals)
    }
  })

  // Page N: Pilot Schedule
  doc.addPage()
  addPilotSchedules(doc, data)

  return doc.output('blob')
}

function addCoverPage(doc: jsPDF, data: RenewalPlanPDFData) {
  // Company logo (if available)
  // doc.addImage(logoBase64, 'PNG', 15, 15, 40, 20)

  // Title
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Certification Renewal Planning', 105, 80, { align: 'center' })

  doc.setFontSize(16)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.year} Annual Plan`, 105, 95, { align: 'center' })

  // Metadata
  doc.setFontSize(12)
  doc.text(`Generated: ${formatDate(data.generatedAt)}`, 105, 120, { align: 'center' })
  doc.text('Fleet Management System', 105, 130, { align: 'center' })

  // Footer
  doc.setFontSize(10)
  doc.text('Air Niugini - B767 Fleet', 105, 280, { align: 'center' })
}

function addExecutiveSummary(doc: jsPDF, data: RenewalPlanPDFData) {
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Executive Summary', 15, 20)

  const totalRenewals = data.summaries.reduce((sum, s) => sum + s.totalPlannedRenewals, 0)
  const totalCapacity = data.summaries.reduce((sum, s) => sum + s.totalCapacity, 0)
  const avgUtilization = (totalRenewals / totalCapacity) * 100
  const highRiskPeriods = data.summaries.filter(s => s.utilizationPercentage > 80)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')

  const stats = [
    `Total Renewals Planned: ${totalRenewals}`,
    `Total Capacity: ${totalCapacity}`,
    `Overall Utilization: ${Math.round(avgUtilization)}%`,
    `Roster Periods: 13`,
    `Excluded Periods: 2 (December, January)`,
    `High-Risk Periods (>80%): ${highRiskPeriods.length}`,
  ]

  stats.forEach((stat, index) => {
    doc.text(stat, 15, 40 + (index * 10))
  })

  // Category Breakdown
  const byCategory = data.renewals.reduce((acc, r) => {
    const cat = r.check_type.category
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  doc.setFont('helvetica', 'bold')
  doc.text('Category Breakdown:', 15, 110)
  doc.setFont('helvetica', 'normal')

  Object.entries(byCategory).forEach(([category, count], index) => {
    doc.text(`${category}: ${count}`, 15, 120 + (index * 8))
  })
}

function addYearlyCalendar(doc: jsPDF, data: RenewalPlanPDFData) {
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Yearly Calendar', 15, 20)

  // Create table data
  const tableData = data.summaries.map(s => [
    s.rosterPeriod,
    `${formatDate(s.periodStartDate)} - ${formatDate(s.periodEndDate)}`,
    s.isExcluded ? 'EXCLUDED' : `${s.totalPlannedRenewals} / ${s.totalCapacity}`,
    s.isExcluded ? 'N/A' : `${Math.round(s.utilizationPercentage)}%`,
  ])

  autoTable(doc, {
    head: [['Roster Period', 'Dates', 'Renewals', 'Utilization']],
    body: tableData,
    startY: 30,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
  })
}

function addRosterPeriodDetail(doc: jsPDF, summary: RosterPeriodSummary, allRenewals: RenewalItem[]) {
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`${summary.rosterPeriod} - Detailed Schedule`, 15, 20)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`${formatDate(summary.periodStartDate)} - ${formatDate(summary.periodEndDate)}`, 15, 28)
  doc.text(`Capacity: ${summary.totalPlannedRenewals} / ${summary.totalCapacity}`, 15, 35)
  doc.text(`Utilization: ${Math.round(summary.utilizationPercentage)}%`, 15, 42)

  // Filter renewals for this roster period
  const periodRenewals = allRenewals.filter(r => r.roster_period === summary.rosterPeriod)

  // Create table
  const tableData = periodRenewals.map(r => [
    `${r.pilot.first_name} ${r.pilot.last_name}`,
    r.pilot.employee_id,
    r.check_type.check_code,
    r.check_type.category,
    formatDate(r.planned_renewal_date),
  ])

  autoTable(doc, {
    head: [['Pilot', 'Emp ID', 'Check Type', 'Category', 'Planned Date']],
    body: tableData,
    startY: 50,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [52, 152, 219] },
  })
}

function addPilotSchedules(doc: jsPDF, data: RenewalPlanPDFData) {
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Pilot Renewal Schedules', 15, 20)

  // Group renewals by pilot
  const byPilot = data.renewals.reduce((acc, r) => {
    const key = `${r.pilot.first_name} ${r.pilot.last_name}`
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {} as Record<string, RenewalItem[]>)

  // Sort pilots alphabetically
  const pilots = Object.keys(byPilot).sort()

  const tableData = pilots.flatMap(pilotName => {
    const renewals = byPilot[pilotName]
    return renewals.map((r, index) => [
      index === 0 ? pilotName : '', // Only show pilot name on first row
      r.check_type.check_code,
      r.check_type.category,
      formatDate(r.planned_renewal_date),
      r.roster_period,
    ])
  })

  autoTable(doc, {
    head: [['Pilot', 'Check Type', 'Category', 'Planned Date', 'Roster Period']],
    body: tableData,
    startY: 30,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [46, 204, 113] },
  })
}
```

**3. Email Service**

```typescript
// lib/services/email-service.ts

import { createClient } from '@/lib/supabase/server'

export interface EmailOptions {
  to: string
  cc?: string[]
  subject: string
  htmlBody: string
  attachments?: {
    filename: string
    content: Buffer | Blob
    contentType: string
  }[]
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    // Option 1: Use Supabase Edge Function
    const supabase = await createClient()
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: options.to,
        cc: options.cc,
        subject: options.subject,
        html: options.htmlBody,
        attachments: options.attachments,
      },
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}

export async function sendRenewalPlanEmail(
  rosteringTeamEmail: string,
  pdfBlob: Blob,
  year: number
): Promise<{ success: boolean; error?: string }> {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .summary { background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #7f8c8d; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Certification Renewal Planning - ${year}</h1>
      </div>
      <div class="content">
        <p>Dear Rostering Team,</p>

        <p>Please find attached the latest <strong>Certification Renewal Planning report for ${year}</strong>.</p>

        <div class="summary">
          <h3>Summary</h3>
          <ul>
            <li>This plan ensures all pilot certifications are renewed within regulatory grace periods</li>
            <li>December and January are excluded from renewal scheduling (holiday months)</li>
            <li>Renewals are distributed across 11 eligible roster periods (RP03-RP13)</li>
            <li>Capacity limits are respected for all categories (Flight, Simulator, Ground)</li>
          </ul>
        </div>

        <p>Please review the attached PDF for:</p>
        <ul>
          <li>Yearly calendar overview</li>
          <li>Detailed roster period breakdowns</li>
          <li>Pilot-specific renewal schedules</li>
          <li>Capacity utilization analysis</li>
        </ul>

        <p>If you have any questions or require adjustments, please contact the Fleet Management team.</p>

        <p>Best regards,<br>
        <strong>Fleet Management System</strong><br>
        Air Niugini - B767 Fleet</p>
      </div>
      <div class="footer">
        <p>This email was generated automatically by the Fleet Management V2 system.</p>
      </div>
    </body>
    </html>
  `

  // Convert Blob to Buffer for attachment
  const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer())

  return sendEmail({
    to: rosteringTeamEmail,
    subject: `Certification Renewal Planning - ${year}`,
    htmlBody,
    attachments: [
      {
        filename: `Renewal_Plan_${year}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  })
}
```

**4. API Routes**

```typescript
// app/api/renewal-planning/export-pdf/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRenewalPlanPDF } from '@/lib/services/renewal-planning-pdf-service'
import { getRosterPeriodCapacity } from '@/lib/services/certification-renewal-planning-service'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    // Get all roster period summaries
    const { data: periods } = await supabase
      .from('roster_period_capacity')
      .select('roster_period')
      .like('roster_period', `%/${year}`)
      .order('period_start_date')

    const summaries = await Promise.all(
      (periods || []).map(p => getRosterPeriodCapacity(p.roster_period))
    )

    // Get all renewals for the year
    const { data: renewals } = await supabase
      .from('certification_renewal_plans')
      .select(`
        *,
        pilot:pilots(*),
        check_type:check_types(*)
      `)
      .like('roster_period', `%/${year}`)
      .eq('status', 'confirmed')

    // Generate PDF
    const pdfBlob = await generateRenewalPlanPDF({
      year: parseInt(year),
      summaries: summaries.filter(Boolean),
      renewals: renewals || [],
      generatedAt: new Date(),
    })

    // Return PDF as download
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="Renewal_Plan_${year}.pdf"`)

    return new NextResponse(pdfBlob, { headers })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
```

```typescript
// app/api/renewal-planning/email/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRenewalPlanPDF } from '@/lib/services/renewal-planning-pdf-service'
import { sendRenewalPlanEmail } from '@/lib/services/email-service'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { year } = await request.json()

    // Get rostering team email from settings
    const { data: setting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'rostering_team_email')
      .single()

    if (!setting || !setting.value) {
      return NextResponse.json(
        { error: 'Rostering team email not configured' },
        { status: 400 }
      )
    }

    const rosteringEmail = setting.value

    // Generate PDF (same as export route)
    const pdfBlob = await generateRenewalPlanPDF({...})

    // Send email
    const result = await sendRenewalPlanEmail(rosteringEmail, pdfBlob, year)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Email sent successfully' })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
```

**5. Admin Settings**

```typescript
// app/dashboard/admin/settings/page.tsx (add new section)

<Card className="p-6">
  <h3 className="text-lg font-semibold mb-4">Renewal Planning Settings</h3>

  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium mb-2">
        Rostering Team Email
      </label>
      <Input
        type="email"
        value={rosteringTeamEmail}
        onChange={(e) => setRosteringTeamEmail(e.target.value)}
        placeholder="rostering@airniugini.com"
      />
      <p className="text-xs text-muted-foreground mt-1">
        Email address to receive certification renewal planning reports
      </p>
    </div>

    <Button onClick={saveRosteringEmail}>
      Save Settings
    </Button>
  </div>
</Card>
```

#### Database Changes

**New System Setting**:

```sql
-- Add rostering team email setting
INSERT INTO system_settings (key, value, category, description)
VALUES (
  'rostering_team_email',
  'rostering@airniugini.com.pg',  -- Default value
  'renewal_planning',
  'Email address for rostering team to receive renewal planning reports'
);
```

#### UI Integration

**Dashboard Updates**:

```typescript
// app/dashboard/renewal-planning/page.tsx

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="calendar">Calendar View</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    {/* Existing overview content */}

    {/* Add export buttons */}
    <div className="flex gap-2">
      <Button variant="outline" onClick={exportPDF}>
        <Download className="mr-2 h-4 w-4" />
        Export PDF
      </Button>

      <Button onClick={emailRosteringTeam}>
        <Mail className="mr-2 h-4 w-4" />
        Email to Rostering Team
      </Button>
    </div>
  </TabsContent>

  <TabsContent value="calendar">
    <RenewalCalendarYearly summaries={summaries} />
  </TabsContent>
</Tabs>
```

---

### 📋 Project Manager Perspective

#### Implementation Roadmap

**Phase 1: Calendar View** (2-3 hours)

**Tasks**:
1. Create `renewal-calendar-yearly.tsx` component (45 min)
2. Create `renewal-calendar-monthly.tsx` component (45 min)
3. Create calendar page routes (30 min)
4. Add tab navigation to renewal planning dashboard (15 min)
5. Test calendar views with production data (30 min)

**Deliverables**:
- ✅ Functional yearly calendar view
- ✅ Functional monthly calendar view
- ✅ Drill-down navigation
- ✅ Color-coded capacity indicators

**Phase 2: PDF Export** (2-3 hours)

**Tasks**:
1. Create `renewal-planning-pdf-service.ts` (90 min)
2. Implement cover page, summary, calendar pages (60 min)
3. Create PDF export API route (30 min)
4. Add export button to dashboard (15 min)
5. Test PDF generation and download (30 min)

**Deliverables**:
- ✅ PDF service with all sections
- ✅ Export API endpoint
- ✅ Download functionality
- ✅ Professional PDF formatting

**Phase 3: Email Integration** (2-3 hours)

**Tasks**:
1. Research email provider setup (Resend or Supabase Edge Function) (45 min)
2. Create `email-service.ts` (60 min)
3. Implement email template (30 min)
4. Create email API route (30 min)
5. Test email sending with PDF attachment (30 min)

**Deliverables**:
- ✅ Email service integration
- ✅ Professional email template
- ✅ PDF attachment functionality
- ✅ Error handling

**Phase 4: Admin Settings** (1 hour)

**Tasks**:
1. Add rostering_team_email to system_settings table (5 min)
2. Create settings UI in admin panel (30 min)
3. Implement save/load settings (15 min)
4. Test settings persistence (10 min)

**Deliverables**:
- ✅ Rostering team email setting
- ✅ Admin UI for configuration
- ✅ Settings persistence

#### Testing Plan

**Test Cases**:

1. **Calendar View**:
   - ✅ Yearly view loads all 13 roster periods
   - ✅ Color coding matches utilization levels
   - ✅ December/January periods marked as excluded
   - ✅ Click navigation works to monthly view
   - ✅ Monthly view shows correct pilot list

2. **PDF Export**:
   - ✅ PDF generates successfully
   - ✅ Cover page displays correct year
   - ✅ Summary statistics are accurate
   - ✅ Yearly calendar table is complete
   - ✅ Roster period details are correct
   - ✅ Pilot schedules are alphabetical
   - ✅ PDF downloads with correct filename

3. **Email Integration**:
   - ✅ Email sends successfully
   - ✅ PDF attachment is included
   - ✅ Email template renders correctly
   - ✅ Rostering team receives email
   - ✅ Error handling works (invalid email)

4. **Admin Settings**:
   - ✅ Settings save correctly
   - ✅ Settings load on page refresh
   - ✅ Email validation works
   - ✅ Error messages display properly

#### Success Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| **Calendar Load Time** | <2 seconds | Performance testing |
| **PDF Generation Time** | <5 seconds | Performance testing |
| **Email Delivery Time** | <30 seconds | Email send testing |
| **PDF File Size** | <2 MB | File size measurement |
| **User Satisfaction** | >90% | Stakeholder feedback |

#### Risk Management

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Email Provider Issues** | Medium | High | Use Supabase Edge Functions with Resend as fallback |
| **PDF Performance** | Low | Medium | Optimize PDF generation, limit data to 1 year |
| **Browser Compatibility** | Low | Low | Test on Chrome, Firefox, Safari |
| **Email Deliverability** | Medium | Medium | Use reputable email service, test spam filters |

---

## Dependencies

### NPM Packages

**Already Installed** ✅:
- `jspdf` (^2.5.2) - PDF generation
- `jspdf-autotable` (^3.8.4) - PDF tables

**To Install**:
- None (using existing packages)

### Email Provider Setup

**Option 1: Resend (Recommended)**:
```bash
npm install resend
```

**Supabase Edge Function**:
```typescript
// supabase/functions/send-email/index.ts
import { Resend } from 'resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async (req) => {
  const { to, cc, subject, html, attachments } = await req.json()

  const result = await resend.emails.send({
    from: 'Fleet Management <noreply@airniugini.com.pg>',
    to,
    cc,
    subject,
    html,
    attachments,
  })

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**Option 2: Supabase Auth Email** (Not recommended for bulk):
- Limited to transactional emails
- May have rate limits

---

## Timeline Summary

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| **Planning** | 1 hour | Day 1 | Day 1 |
| **Calendar View** | 2-3 hours | Day 1 | Day 1-2 |
| **PDF Export** | 2-3 hours | Day 2 | Day 2 |
| **Email Integration** | 2-3 hours | Day 2-3 | Day 3 |
| **Admin Settings** | 1 hour | Day 3 | Day 3 |
| **Testing** | 2-3 hours | Day 3 | Day 3 |
| **Total** | **10-14 hours** | | **3 days** |

---

## Next Steps

1. **Approve This Plan**: Review and approve this implementation plan
2. **Set Up Email Provider**: Configure Resend API key in Supabase Edge Functions
3. **Begin Phase 1**: Start with calendar view components
4. **Iterative Development**: Complete each phase sequentially
5. **Stakeholder Review**: Demo to Fleet Manager and Rostering Team after each phase
6. **Production Deployment**: Deploy after full testing

---

**Plan Author**: Claude Code
**Reviewed By**: Maurice (Skycruzer)
**Status**: 📋 **AWAITING APPROVAL**
**BMAP Analysis Date**: October 24, 2025

**Estimated ROI**:
- **Time Saved**: 2-3 hours per week (manual PDF creation + email distribution)
- **Stakeholder Satisfaction**: High (professional reports, automated distribution)
- **Operational Efficiency**: +30% (better coordination with rostering team)
