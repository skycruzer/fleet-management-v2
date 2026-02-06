'use client'

/**
 * Pilot Portal Registration Page
 *
 * Allows new pilots to register for portal access.
 * Registrations require admin approval before access is granted.
 *
 * @spec 001-missing-core-features (US1, US8)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  PilotRegistrationSchema,
  type PilotRegistrationInput,
} from '@/lib/validations/pilot-portal-schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'

export default function PilotRegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<PilotRegistrationInput>({
    resolver: zodResolver(PilotRegistrationSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: '',
      rank: 'Captain',
      // Optional fields use undefined, not empty string (Zod .optional() requires undefined)
      employee_id: undefined,
      date_of_birth: undefined,
      phone_number: undefined,
      address: undefined,
    },
  })

  const onSubmit = async (data: PilotRegistrationInput) => {
    setIsLoading(true)
    setError('')

    try {
      // Call the registration API endpoint which handles password hashing
      const response = await fetch('/api/portal/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(
          result.error?.message || result.message || 'Registration failed. Please try again.'
        )
        setIsLoading(false)
        return
      }

      // Success - show success message
      setSuccess(true)
      setIsLoading(false)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/portal/login')
      }, 3000)
    } catch (err) {
      console.error('Registration error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <Card className="bg-card w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-[var(--color-success-400)]">
              Registration Submitted!
            </CardTitle>
            <CardDescription>
              Your registration has been submitted for admin approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                You will receive an email notification once your registration is reviewed. This
                typically takes 1-2 business days.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-muted-foreground text-sm">Redirecting to login page...</p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="bg-card w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-foreground text-2xl font-bold">Pilot Registration</CardTitle>
          <CardDescription>
            Complete this form to request access to the pilot portal
          </CardDescription>
        </CardHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    placeholder="John"
                    {...form.register('first_name')}
                    disabled={isLoading}
                  />
                  {form.formState.errors.first_name && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.first_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    placeholder="Doe"
                    {...form.register('last_name')}
                    disabled={isLoading}
                  />
                  {form.formState.errors.last_name && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.last_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rank">Rank *</Label>
                <Select
                  onValueChange={(value) =>
                    form.setValue('rank', value as 'Captain' | 'First Officer')
                  }
                  defaultValue={form.getValues('rank')}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Captain">Captain</SelectItem>
                    <SelectItem value="First Officer">First Officer</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.rank && (
                  <p className="text-destructive text-sm">{form.formState.errors.rank.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input
                    id="employee_id"
                    placeholder="EMP12345"
                    {...form.register('employee_id')}
                    disabled={isLoading}
                  />
                  {form.formState.errors.employee_id && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.employee_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    {...form.register('date_of_birth')}
                    disabled={isLoading}
                  />
                  {form.formState.errors.date_of_birth && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.date_of_birth.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="+675 1234 5678"
                  {...form.register('phone_number')}
                  disabled={isLoading}
                />
                {form.formState.errors.phone_number && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.phone_number.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Street address"
                  {...form.register('address')}
                  disabled={isLoading}
                />
                {form.formState.errors.address && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.address.message}
                  </p>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Account Information</h3>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="pilot@airniugini.com"
                  {...form.register('email')}
                  disabled={isLoading}
                />
                {form.formState.errors.email && (
                  <p className="text-destructive text-sm">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    {...form.register('password')}
                    disabled={isLoading}
                  />
                  {form.formState.errors.password && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    {...form.register('confirmPassword')}
                    disabled={isLoading}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-muted-foreground text-xs">
                Password must contain at least one uppercase letter, one lowercase letter, one
                number, and one special character.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Registration'}
            </Button>

            <div className="text-muted-foreground text-center text-sm">
              Already have an account?{' '}
              <Link
                href="/portal/login"
                className="text-primary font-medium hover:text-[var(--color-primary-500)]"
              >
                Sign in here
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
