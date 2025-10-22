/**
 * Edit Certification Page
 * Edit existing pilot certification details
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface Pilot {
  id: string
  first_name: string
  last_name: string
  employee_id: string
}

interface CheckType {
  id: string
  check_code: string
  check_description: string
  category: string | null
}

interface Certification {
  id: string
  pilot_id: string
  check_type_id: string
  expiry_date: string | null
  pilot?: Pilot
  check_type?: CheckType
}

export default function EditCertificationPage() {
  const router = useRouter()
  const params = useParams()
  const certificationId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [certification, setCertification] = useState<Certification | null>(null)

  const [expiryDate, setExpiryDate] = useState('')

  // Fetch certification data
  useEffect(() => {
    async function fetchCertification() {
      try {
        const response = await fetch(`/api/certifications/${certificationId}`)
        const result = await response.json()

        if (!result.success) {
          setError(result.error || 'Failed to load certification')
          return
        }

        const cert = result.data
        setCertification(cert)

        // Set form values
        if (cert.expiry_date) {
          // Convert ISO date to YYYY-MM-DD for input
          const date = new Date(cert.expiry_date)
          setExpiryDate(date.toISOString().split('T')[0])
        }
      } catch (err) {
        setError('An error occurred while loading certification')
      } finally {
        setLoading(false)
      }
    }

    fetchCertification()
  }, [certificationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const formattedData = {
        expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
      }

      const response = await fetch(`/api/certifications/${certificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to update certification')
        return
      }

      // Success - redirect to certifications list
      router.push('/dashboard/certifications')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading certification...</p>
      </div>
    )
  }

  if (!certification) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-destructive">Certification not found</p>
          <Link href="/dashboard/certifications">
            <Button className="mt-4">Back to Certifications</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Edit Certification</h2>
          <p className="text-muted-foreground mt-1">
            Update certification expiry date for {certification.pilot?.first_name}{' '}
            {certification.pilot?.last_name}
          </p>
        </div>
        <Link href="/dashboard/certifications">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      {/* Edit Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="border-destructive/20 rounded-lg border bg-red-50 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Read-only Pilot Info */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label className="text-foreground mb-2 block text-sm font-medium">
                Pilot Name
              </Label>
              <Input
                type="text"
                value={`${certification.pilot?.first_name || ''} ${certification.pilot?.last_name || ''}`}
                disabled
                className="bg-muted/50"
              />
            </div>

            <div>
              <Label className="text-foreground mb-2 block text-sm font-medium">
                Employee ID
              </Label>
              <Input
                type="text"
                value={certification.pilot?.employee_id || 'N/A'}
                disabled
                className="bg-muted/50"
              />
            </div>
          </div>

          {/* Read-only Check Type Info */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label className="text-foreground mb-2 block text-sm font-medium">
                Check Type
              </Label>
              <Input
                type="text"
                value={certification.check_type?.check_description || 'N/A'}
                disabled
                className="bg-muted/50"
              />
            </div>

            <div>
              <Label className="text-foreground mb-2 block text-sm font-medium">
                Check Code
              </Label>
              <Input
                type="text"
                value={certification.check_type?.check_code || 'N/A'}
                disabled
                className="bg-muted/50"
              />
            </div>
          </div>

          {/* Editable Expiry Date */}
          <div>
            <Label htmlFor="expiry_date" className="text-foreground mb-2 block text-sm font-medium">
              Expiry Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="expiry_date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
              disabled={submitting}
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Select the new expiry date for this certification
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <Link href="/dashboard/certifications">
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
