/**
 * Health Check Endpoint
 * Diagnoses deployment issues
 *
 * Developer: Maurice Rondeau
 * Created: 2025-11-24
 */

import { NextResponse } from 'next/server'
import { getAllPilots } from '@/lib/services/pilot-service'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {} as Record<string, { status: 'ok' | 'error'; message: string; details?: unknown }>,
  }

  // 1. Environment Variables Check
  try {
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    checks.checks.environment_variables = {
      status: hasSupabaseUrl && hasSupabaseKey ? 'ok' : 'error',
      message:
        hasSupabaseUrl && hasSupabaseKey
          ? 'All required environment variables present'
          : 'Missing environment variables',
      details: {
        NEXT_PUBLIC_SUPABASE_URL: hasSupabaseUrl ? 'present' : 'MISSING',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: hasSupabaseKey ? 'present' : 'MISSING',
      },
    }
  } catch (error) {
    const s = sanitizeError(error, { operation: 'healthCheckEnvVars', endpoint: '/api/health' })
    checks.checks.environment_variables = {
      status: 'error',
      message: s.error,
    }
  }

  // Checks 2 and 3 are independent, and each is a round trip to Singapore.
  // Running them sequentially made the endpoint cost the sum of both; settled
  // together they cost the slower one. allSettled rather than all so a single
  // failing check still reports the other, which is the point of a health probe.
  const [connectionCheck, dashboardCheck] = await Promise.allSettled([
    getAllPilots(1, 1, false),
    import('@/lib/services/dashboard-service-v4').then((m) => m.getDashboardMetrics()),
  ])

  // 2. Database Connection Check (via service layer)
  if (connectionCheck.status === 'fulfilled') {
    checks.checks.supabase_connection = {
      status: 'ok',
      message: 'Database connection successful',
      details: { totalPilots: connectionCheck.value.total },
    }
  } else {
    const s = sanitizeError(connectionCheck.reason, {
      operation: 'healthCheckSupabaseConnection',
      endpoint: '/api/health',
    })
    checks.checks.supabase_connection = {
      status: 'error',
      message: s.error,
    }
  }

  // 3. Dashboard Service Check
  if (dashboardCheck.status === 'fulfilled') {
    const metrics = dashboardCheck.value

    checks.checks.dashboard_service = {
      status: 'ok',
      message: 'Dashboard metrics loaded successfully',
      details: {
        totalPilots: metrics.pilots.total,
        captains: metrics.pilots.captains,
        firstOfficers: metrics.pilots.firstOfficers,
      },
    }
  } else {
    const s = sanitizeError(dashboardCheck.reason, {
      operation: 'healthCheckDashboardService',
      endpoint: '/api/health',
    })
    checks.checks.dashboard_service = {
      status: 'error',
      message: s.error,
    }
  }

  // Overall status
  const allOk = Object.values(checks.checks).every((check) => check.status === 'ok')

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'unhealthy',
      ...checks,
    },
    {
      status: allOk ? 200 : 503,
    }
  )
}
