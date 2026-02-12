/**
 * Add New User Page
 * Form for creating new system users
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserCreateSchema } from '@/lib/validations/user-validation'
import Link from 'next/link'

type UserFormData = z.infer<typeof UserCreateSchema>

export default function NewUserPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(UserCreateSchema),
    defaultValues: {
      role: 'User',
    },
  })

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user')
      }

      // Success - redirect to users list
      router.push('/dashboard/admin/users')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Add New User</h2>
          <p className="text-muted-foreground mt-1">Create a new system user account</p>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="outline">← Back to Admin</Button>
        </Link>
      </div>

      {/* Form Card */}
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="border-destructive/20 rounded-lg border bg-[var(--color-destructive-muted)] p-4">
              <p className="text-sm text-[var(--color-danger-600)]">{error}</p>
            </div>
          )}

          {/* User Information Section */}
          <div className="space-y-4">
            <h3 className="text-foreground border-b pb-2 text-lg font-semibold">
              User Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Full Name */}
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="name">
                  Full Name <span className="text-[var(--color-danger-500)]">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., John Smith"
                  {...register('name')}
                  className={errors.name ? 'border-[var(--color-danger-500)]' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-[var(--color-danger-600)]">{errors.name.message}</p>
                )}
                <p className="text-muted-foreground text-xs">Minimum 2 characters</p>
              </div>

              {/* Email Address */}
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="email">
                  Email Address <span className="text-[var(--color-danger-500)]">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., john.smith@example.com"
                  {...register('email')}
                  className={errors.email ? 'border-[var(--color-danger-500)]' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-[var(--color-danger-600)]">{errors.email.message}</p>
                )}
                <p className="text-muted-foreground text-xs">Must be a valid email address</p>
              </div>
            </div>
          </div>

          {/* Role Assignment Section */}
          <div className="space-y-4">
            <h3 className="text-foreground border-b pb-2 text-lg font-semibold">Role Assignment</h3>

            <div className="space-y-2">
              <Label htmlFor="role">
                User Role <span className="text-[var(--color-danger-500)]">*</span>
              </Label>
              <select
                id="role"
                {...register('role')}
                className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-[var(--color-primary-500)] focus:outline-none ${
                  errors.role ? 'border-[var(--color-danger-500)]' : 'border-border'
                }`}
              >
                <option value="User">User (Read-only access)</option>
                <option value="Manager">Manager (View and approve requests)</option>
                <option value="Admin">Admin (Full system access)</option>
              </select>
              {errors.role && (
                <p className="text-sm text-[var(--color-danger-600)]">{errors.role.message}</p>
              )}
            </div>

            {/* Role Descriptions */}
            <div className="bg-primary/5 space-y-3 rounded-lg border border-[var(--color-primary-500)]/20 p-4">
              <p className="text-foreground text-sm font-medium">Role Permissions:</p>
              <ul className="text-card-foreground space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <span className="font-bold text-[var(--color-primary-600)]">•</span>
                  <div>
                    <span className="font-medium">User:</span> View pilot data, certifications, and
                    leave requests. Cannot make changes.
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold text-[var(--color-primary-600)]">•</span>
                  <div>
                    <span className="font-medium">Manager:</span> All User permissions, plus
                    approve/deny leave requests and submit forms.
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold text-[var(--color-primary-600)]">•</span>
                  <div>
                    <span className="font-medium">Admin:</span> Full system access, including user
                    management, pilot CRUD, and system configuration.
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 border-t pt-6">
            <Link href="/dashboard/admin/users">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <span className="animate-spin">⏳</span>
                  <span>Creating...</span>
                </span>
              ) : (
                'Create User'
              )}
            </Button>
          </div>
        </form>
      </Card>

    </div>
  )
}
