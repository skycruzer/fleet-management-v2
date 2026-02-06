/**
 * Help Center Page
 * FAQs and documentation
 *
 * @author Maurice Rondeau
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { HelpPageClient } from './help-page-client'

export const metadata: Metadata = {
  title: 'Help Center | Fleet Management',
  description: 'Frequently asked questions and documentation',
}

export default async function HelpPage() {
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  return <HelpPageClient />
}
