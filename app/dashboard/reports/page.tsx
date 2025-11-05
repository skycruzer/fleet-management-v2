/**
 * Reports Page - Leave, Flight Requests, and Certifications
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Streamlined reporting for three key areas
 */

import { Metadata } from 'next'
import { ReportsClient } from './reports-client'

export const metadata: Metadata = {
  title: 'Reports | Fleet Management',
  description: 'Generate reports for leave requests, flight requests, and certifications',
}

export default function ReportsPage() {
  return <ReportsClient />
}
