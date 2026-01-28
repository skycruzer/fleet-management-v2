/**
 * Privacy Policy Page
 *
 * Developer: Maurice Rondeau
 *
 * @route /privacy
 */

import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Fleet Management',
  description: 'Privacy policy for the Fleet Management system',
}

export default function PrivacyPolicyPage() {
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
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          <p className="text-muted-foreground">Last updated: January 2026</p>
        </CardHeader>
        <CardContent className="prose prose-slate dark:prose-invert max-w-none">
          <h2>1. Information We Collect</h2>
          <p>
            The Fleet Management system collects information necessary for aviation crew management,
            including:
          </p>
          <ul>
            <li>Personal identification information (name, employee ID, contact details)</li>
            <li>Professional qualifications and certifications</li>
            <li>Leave requests and scheduling data</li>
            <li>Authentication credentials</li>
            <li>System usage logs for security purposes</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>Your information is used to:</p>
          <ul>
            <li>Manage pilot certifications and compliance requirements</li>
            <li>Process leave and flight requests</li>
            <li>Generate operational reports and schedules</li>
            <li>Ensure regulatory compliance</li>
            <li>Communicate important updates and notifications</li>
          </ul>

          <h2>3. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data, including
            encryption, secure authentication, and access controls. All data is stored in secure,
            compliant cloud infrastructure.
          </p>

          <h2>4. Data Retention</h2>
          <p>
            We retain your data for as long as necessary to fulfill the purposes outlined in this
            policy and to comply with aviation regulatory requirements.
          </p>

          <h2>5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (subject to regulatory requirements)</li>
            <li>Receive a copy of your data in a portable format</li>
          </ul>

          <h2>6. Contact Us</h2>
          <p>
            For privacy-related inquiries, please contact your fleet management administrator or
            email us at <a href="mailto:privacy@fleetmanagement.com">privacy@fleetmanagement.com</a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
