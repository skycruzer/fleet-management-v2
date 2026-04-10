/**
 * Professional Sidebar (Server Component Wrapper)
 *
 * Fetches the dynamic app title from settings and user role, then passes to the client sidebar component.
 * This allows the sidebar to display the configurable fleet title and conditionally show admin-only links.
 */

import { getAppTitle } from '@/lib/services/admin-service'
import { createClient } from '@/lib/supabase/server'
import { ProfessionalSidebarClient } from './professional-sidebar-client'

/**
 * Server component that fetches app title, user role, and renders the client sidebar
 */
export async function ProfessionalSidebar() {
  const appTitle = await getAppTitle()

  // Get user role for conditional navigation
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRole: string | null = null
  if (user) {
    const { data: userData } = await supabase
      .from('an_users')
      .select('role')
      .eq('id', user.id)
      .single()

    userRole = userData?.role || null
  }

  return <ProfessionalSidebarClient appTitle={appTitle} userRole={userRole} />
}
