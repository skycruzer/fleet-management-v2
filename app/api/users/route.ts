/**
 * Users API Route
 * Handles user listing and creation
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAllUsers, createUser, getUsersByRole } from '@/lib/services/user-service'
import { UserCreateSchema } from '@/lib/validations/user-validation'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/users
 * List all users with optional role filter
 */
export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = _request.nextUrl.searchParams
    const role = searchParams.get('role') as 'Admin' | 'Manager' | 'User' | null

    // Fetch users
    const users = role ? await getUsersByRole(role) : await getAllUsers()

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    })
  } catch (error) {
    console.error('GET /api/users error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users
 * Create a new user
 */
export async function POST(_request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await _request.json()
    const validatedData = UserCreateSchema.parse(body)

    // Create user
    const newUser = await createUser(validatedData)

    // Revalidate user pages to clear Next.js cache
    revalidatePath('/dashboard/users')
    revalidatePath('/dashboard/admin/users')
    revalidatePath('/dashboard')
    revalidatePath('/api/users')

    return NextResponse.json(
      {
        success: true,
        data: newUser,
        message: 'User created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/users error:', error)

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user',
      },
      { status: 500 }
    )
  }
}
