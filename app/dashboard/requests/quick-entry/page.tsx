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
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { QuickEntryForm } from '@/components/requests/quick-entry-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const metadata = {
  title: 'Quick Entry Form | Fleet Management',
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
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load pilots. Please try again later.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!pilots || pilots.length === 0) {
    return (
      <div className="container mx-auto p-6">
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
    <div className="container mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/requests">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Button>
        </Link>

        <h1 className="text-3xl font-bold tracking-tight">Quick Entry Form</h1>
        <p className="text-muted-foreground mt-2">
          Manually enter pilot requests received via email, phone, or Oracle system
        </p>
      </div>

      {/* Instructions Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
          <CardDescription>
            How to use the quick entry form for manual request submission
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 font-semibold">When to Use This Form</h4>
            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              <li>Pilot submits request via email</li>
              <li>Phone call request from pilot</li>
              <li>Request imported from Oracle system</li>
              <li>Backfilling historical requests</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-semibold">Required Information</h4>
            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              <li>Pilot name (select from dropdown)</li>
              <li>Request category and type</li>
              <li>Start date (and end date for leave requests)</li>
              <li>Submission channel (EMAIL, PHONE, or ORACLE)</li>
              <li>Optional: Reason, source reference, and admin notes</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-semibold">Important Notes</h4>
            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              <li>
                Requests are automatically flagged as &quot;late&quot; if submitted with less than
                21 days advance notice
              </li>
              <li>The form will check for conflicting requests and display warnings</li>
              <li>Roster periods are calculated automatically from the start date</li>
              <li>All requests default to PENDING status for manager review</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Quick Entry Form */}
      <QuickEntryForm pilots={pilots} />
    </div>
  )
}
