/**
 * Quick Entry Page
 *
 * Admin page for manually entering pilot requests from external sources.
 * Example integration of the QuickEntryForm component.
 *
 * @author Maurice Rondeau
 * @route /dashboard/requests/quick-entry
 */

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { QuickEntryForm } from '@/components/requests/quick-entry-form'
import { PageHeader } from '@/components/layout/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const metadata = {
  title: 'Quick Entry Form',
  description: 'Manually enter pilot requests from email, phone, or Oracle',
}

export default async function QuickEntryPage() {
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  const supabase = await createClient()

  // Fetch all active pilots
  const { data: pilots, error } = await supabase
    .from('pilots')
    .select(
      `
      id,
      first_name,
      middle_name,
      last_name,
      employee_id,
      role
    `
    )
    .eq('is_active', true)
    .order('employee_id', { ascending: true })

  if (error) {
    console.error('Failed to fetch pilots:', error)
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load pilots. Please try again later.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!pilots || pilots.length === 0) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTitle>No Pilots Available</AlertTitle>
          <AlertDescription>
            No active pilots found. Please add pilots before creating requests.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <PageHeader
        title="Quick Entry Form"
        description="Manually enter pilot requests received via email, phone, or Oracle system"
        breadcrumbs={[{ label: 'Requests', href: '/dashboard/requests' }, { label: 'Quick Entry' }]}
      />

      {/* How quick entry works — collapsed by default */}
      <details className="border-border bg-card rounded-lg border px-4 py-3">
        <summary className="text-foreground cursor-pointer text-sm font-medium select-none">
          How quick entry works
        </summary>
        <ul className="text-muted-foreground mt-3 list-inside list-disc space-y-1 text-sm">
          <li>Use this form for requests received by email, phone, or Oracle</li>
          <li>Select the pilot, category, type, dates, and submission channel</li>
          <li>Requests with less than 21 days notice are flagged as late</li>
          <li>Conflicting requests are checked and shown as warnings</li>
          <li>
            Roster periods are calculated from the start date; all requests are created as Submitted
          </li>
        </ul>
      </details>

      {/* Quick Entry Form */}
      <QuickEntryForm pilots={pilots} />
    </div>
  )
}
