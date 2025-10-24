import { NextResponse } from 'next/server'
import { getContractTypes } from '@/lib/services/admin-service'

/**
 * GET /api/contract-types
 * Returns all active contract types from the database
 * Used by pilot forms to populate contract type dropdowns
 */
export async function GET() {
  try {
    const contractTypes = await getContractTypes()

    // Filter to only active contract types
    const activeTypes = contractTypes.filter((ct) => ct.is_active)

    return NextResponse.json({
      success: true,
      data: activeTypes,
    })
  } catch (error) {
    console.error('Error fetching contract types:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch contract types',
      },
      { status: 500 }
    )
  }
}
