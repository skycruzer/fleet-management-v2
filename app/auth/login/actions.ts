'use server'

import { adminLogin } from '@/lib/services/admin-auth-service'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // Best-effort client IP for lockout attribution/audit (left of x-forwarded-for chain).
  const headerList = await headers()
  const ipAddress =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerList.get('x-real-ip') ||
    undefined

  const result = await adminLogin({ email, password }, { ipAddress })

  if (!result.success) {
    return { error: result.error || 'Invalid credentials' }
  }

  redirect('/dashboard')
}
