/**
 * Terms of Service Page
 *
 * Developer: Maurice Rondeau
 *
 * @route /terms
 */

import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Fleet Management',
  description: 'Terms of service for the Fleet Management system',
}

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm">
            ← Back to Home
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
          <p className="text-muted-foreground">Last updated: January 2026</p>
        </CardHeader>
        <CardContent className="prose prose-slate dark:prose-invert max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using the Fleet Management system, you agree to be bound by these Terms
            of Service and all applicable laws and regulations. If you do not agree with any of
            these terms, you are prohibited from using this system.
          </p>

          <h2>2. Authorized Use</h2>
          <p>
            This system is intended for authorized personnel only. Access is granted to employees,
            pilots, and administrators as designated by your organization. Unauthorized access or
            use is strictly prohibited.
          </p>

          <h2>3. User Responsibilities</h2>
          <p>As a user of this system, you agree to:</p>
          <ul>
            <li>Maintain the confidentiality of your login credentials</li>
            <li>Provide accurate and up-to-date information</li>
            <li>Report any security concerns or suspicious activity immediately</li>
            <li>Use the system only for its intended purposes</li>
            <li>Comply with all applicable aviation regulations</li>
          </ul>

          <h2>4. Data Accuracy</h2>
          <p>
            Users are responsible for ensuring the accuracy of information they submit, including
            certification records, leave requests, and personal details. Inaccurate information may
            impact operational safety and compliance.
          </p>

          <h2>5. System Availability</h2>
          <p>
            While we strive to maintain continuous system availability, we do not guarantee
            uninterrupted access. Scheduled maintenance and updates may require temporary system
            downtime.
          </p>

          <h2>6. Intellectual Property</h2>
          <p>
            The Fleet Management system and its original content, features, and functionality are
            owned by the organization and are protected by applicable intellectual property laws.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            The system is provided &quot;as is&quot; without warranties of any kind. We shall not be
            liable for any indirect, incidental, special, or consequential damages arising from the
            use of this system.
          </p>

          <h2>8. Modifications</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the system
            after changes constitutes acceptance of the updated terms.
          </p>

          <h2>9. Contact</h2>
          <p>
            For questions about these Terms of Service, please contact your fleet management
            administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
