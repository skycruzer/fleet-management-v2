/**
 * Editable Contact Information Card
 *
 * Client component that allows pilots to update their email and phone number
 * from the portal profile page.
 *
 * Developer: Maurice Rondeau
 * @version 1.0.0
 * @date February 2026
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Phone, MapPin, Pencil, Check, X, Loader2 } from 'lucide-react'

interface EditableContactCardProps {
  email: string
  phone: string | null
  address: string | null
}

export function EditableContactCard({ email, phone, address }: EditableContactCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [formEmail, setFormEmail] = useState(email)
  const [formPhone, setFormPhone] = useState(phone || '')

  // Display state (updates after save)
  const [displayEmail, setDisplayEmail] = useState(email)
  const [displayPhone, setDisplayPhone] = useState(phone)

  const handleEdit = () => {
    setFormEmail(displayEmail)
    setFormPhone(displayPhone || '')
    setError(null)
    setSuccess(false)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
  }

  const handleSave = async () => {
    setError(null)
    setIsSaving(true)

    try {
      const res = await fetch('/api/portal/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formEmail,
          phone_number: formPhone || null,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to update contact information')
        return
      }

      // Update display state
      setDisplayEmail(formEmail)
      setDisplayPhone(formPhone || null)
      setIsEditing(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="h-full p-6 transition-all hover:shadow-md">
      <div className="mb-4 flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-info-bg)]">
            <Mail className="h-5 w-5 text-[var(--color-primary-600)]" />
          </div>
          <h3 className="text-foreground text-lg font-semibold">Contact Information</h3>
        </div>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={handleEdit} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </div>

      {success && (
        <div className="mb-4 rounded-lg bg-[var(--color-success-muted)] p-3 text-sm text-[var(--color-success-600)]">
          Contact information updated successfully.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-[var(--color-destructive-muted)] p-3 text-sm text-[var(--color-danger-600)]">
          {error}
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="edit-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="pl-10"
                placeholder="pilot@airniugini.com.pg"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone" className="text-sm font-medium">
              Phone Number
            </Label>
            <div className="relative">
              <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="edit-phone"
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="pl-10"
                placeholder="+675 XXX XXXX (optional)"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-1.5">
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              size="sm"
              className="gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <InfoRow icon={Mail} label="Email Address" value={displayEmail} />
          {displayPhone && <InfoRow icon={Phone} label="Phone Number" value={displayPhone} />}
          {address && <InfoRow icon={MapPin} label="Address" value={address} />}
          {!displayPhone && !address && (
            <p className="text-muted-foreground text-sm italic">
              No additional contact information available
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-muted mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
        <Icon className="text-muted-foreground h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <p className="text-foreground mt-0.5 truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}
