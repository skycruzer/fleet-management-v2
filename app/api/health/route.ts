/**
 * Health Check Endpoint
 * Diagnoses deployment issues
 *
 * Developer: Maurice Rondeau
 * Created: 2025-11-24
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    checks.checks.environment_variables = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // 2. Supabase Connection Check
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('pilots').select('count').limit(1).single()

    checks.checks.supabase_connection = {
      status: error ? 'error' : 'ok',
      message: error
        ? `Database connection failed: ${error.message}`
        : 'Database connection successful',
      details: error ? { code: error.code, hint: error.hint } : { count: data },
    }
  } catch (error) {
    checks.checks.supabase_connection = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown database error',
    }
  }

  // 3. Dashboard Service Check
  try {
    const { getDashboardMetrics } = await import('@/lib/services/dashboard-service')
    const metrics = await getDashboardMetrics()

    checks.checks.dashboard_service = {
      status: 'ok',
      message: 'Dashboard metrics loaded successfully',
      details: {
        totalPilots: metrics.pilots.total,
        captains: metrics.pilots.captains,
        firstOfficers: metrics.pilots.firstOfficers,
      },
    }
  } catch (error) {
    checks.checks.dashboard_service = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Dashboard service failed',
      details: error instanceof Error ? { stack: error.stack?.split('\n').slice(0, 3) } : undefined,
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
