/**
 * Users API Route
 * Handles user listing and creation
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { getAllUsers, createUser, getUsersByRole } from '@/lib/services/user-service'
import { UserCreateSchema } from '@/lib/validations/user-validation'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { UserRole } from '@/lib/middleware/authorization-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/users
 * List all users with optional role filter
 */
export const GET = createAdminRoute(
  {
    operation: 'getUsers',
    endpoint: '/api/users',
    rateLimit: false,
  },
  async ({ request }) => {
    try {
      // Get query parameters
      const searchParams = request.nextUrl.searchParams
      const role = searchParams.get('role')?.toLowerCase() as 'admin' | 'manager' | 'user' | null

      // Fetch users
      const users = role ? await getUsersByRole(role) : await getAllUsers()

      return NextResponse.json({
        success: true,
        data: users,
        count: users.length,
      })
    } catch (error) {
      console.error('GET /api/users error:', error)
      const s = sanitizeError(error, { operation: 'getUsers', endpoint: '/api/users' })
      return NextResponse.json({ success: false, error: s.error }, { status: s.statusCode || 500 })
    }
  }
)

/**
 * POST /api/users
 * Create a new user
 */
export const POST = createAdminRoute(
  {
    operation: 'createUser',
    endpoint: '/api/users',
    rateLimit: false,
    roles: [UserRole.ADMIN],
  },
  async ({ request }) => {
    try {
      // Parse and validate request body
      const body = await request.json()
      const validatedData = UserCreateSchema.parse(body)

      // Create user
      const newUser = await createUser(validatedData)

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

      const s = sanitizeError(error, { operation: 'createUser', endpoint: '/api/users' })
      return NextResponse.json({ success: false, error: s.error }, { status: s.statusCode || 500 })
    }
  }
)
