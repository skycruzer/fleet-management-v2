'use server'

import { adminLogin } from '@/lib/services/admin-auth-service'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const result = await adminLogin({ email, password })

  if (!result.success) {
    return { error: result.error || 'Invalid credentials' }
  }

  redirect('/dashboard')
}
