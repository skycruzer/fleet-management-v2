/**
 * Retry Logic Integration Examples
 *
 * Demonstrates how to integrate retry logic into various components
 * and service functions in the Fleet Management application.
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

'use client'

import { useState } from 'react'
import { useRetryState, useRetry } from '@/lib/hooks/use-retry-state'
import {
  RetryIndicator,
  NetworkErrorBanner,
  InlineRetryStatus,
} from '@/components/ui/retry-indicator'
import { retryWithBackoff, fetchWithRetry } from '@/lib/utils/retry-utils'
import { selectWithRetry, insertWithRetry } from '@/lib/supabase/retry-client'
import { createClient } from '@/lib/supabase/client'

// ===================================
// EXAMPLE 1: Basic Component with Retry
// ===================================

export function PilotListExample() {
  const { executeWithRetry, isRetrying, statusMessage, progress, retryState } = useRetryState(3)
  const [pilots, setPilots] = useState([])
  const [error, setError] = useState<Error | null>(null)

  const loadPilots = async () => {
    setError(null)

    try {
      const data = await executeWithRetry(
        async () => {
          const response = await fetch('/api/pilots')
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          return response.json()
        },
        {
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 5000,
        }
      )

      setPilots(data)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load pilots after retries:', err)
    }
  }

  return (
    <div className="space-y-4">
      {/* Retry status indicator */}
      <RetryIndicator
        isRetrying={isRetrying}
        statusMessage={statusMessage}
        progress={progress}
        attempt={retryState.attempt}
        maxRetries={retryState.maxRetries}
        variant="default"
        showProgress={true}
      />

      {/* Error banner */}
      <NetworkErrorBanner
        show={!!error && !isRetrying}
        message="Failed to load pilots. Please check your connection and try again."
        onRetry={loadPilots}
      />

      {/* Content */}
      <div>
        <button
          onClick={loadPilots}
          disabled={isRetrying}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isRetrying ? 'Loading...' : 'Load Pilots'}
        </button>

        {pilots.length > 0 && (
          <ul className="mt-4 space-y-2">
            {pilots.map((pilot: any) => (
              <li key={pilot.id} className="rounded border p-2">
                {pilot.first_name} {pilot.last_name} - {pilot.role}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ===================================
// EXAMPLE 2: Supabase Query with Retry
// ===================================

export function CertificationListExample() {
  const { execute, isRetrying, statusMessage, error } = useRetry({ maxRetries: 3 })
  const [certifications, setCertifications] = useState<any[]>([])

  const loadCertifications = async () => {
    const data = await execute(async () => {
      const supabase = createClient()

      // Use Supabase retry wrapper
      const { data, error } = await selectWithRetry(
        async () =>
          supabase
            .from('pilot_checks')
            .select('*, check_types(check_code, check_description)')
            .order('expiry_date', { ascending: true })
            .limit(10),
        { maxRetries: 3 }
      )

      if (error) throw new Error(error.message)
      return data
    })

    if (data) {
      setCertifications(data)
    }
  }

  return (
    <div className="space-y-4">
      {/* Inline retry status */}
      <InlineRetryStatus isRetrying={isRetrying} message={statusMessage} size="md" />

      {/* Error display */}
      {error && !isRetrying && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-900">
          <p className="font-medium">Error: {error.message}</p>
          <button onClick={loadCertifications} className="mt-2 text-sm underline">
            Try again
          </button>
        </div>
      )}

      {/* Content */}
      <button
        onClick={loadCertifications}
        disabled={isRetrying}
        className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
      >
        Load Certifications
      </button>

      {certifications.length > 0 && (
        <ul className="mt-4 space-y-2">
          {certifications.map((cert: any) => (
            <li key={cert.id} className="rounded border p-2">
              {cert.check_types?.check_code} - Expires: {cert.expiry_date}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ===================================
// EXAMPLE 3: Form Submission with Retry
// ===================================

export function CreatePilotFormExample() {
  const { executeWithRetry, isRetrying, statusMessage, retryState } = useRetryState(2)
  const [formData, setFormData] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    role: 'First Officer' as 'Captain' | 'First Officer',
  })
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)

    try {
      await executeWithRetry(
        async () => {
          const supabase = createClient()

          // Use Supabase retry wrapper for write operations
          const { data, error } = await insertWithRetry(
            async () =>
              supabase
                .from('pilots')
                .insert([
                  {
                    employee_id: formData.employee_id,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    role: formData.role,
                    is_active: true,
                  },
                ])
                .select()
                .single(),
            {
              maxRetries: 2, // Fewer retries for write operations
              initialDelayMs: 1000,
            }
          )

          if (error) throw new Error(error.message)
          return data
        },
        {
          onRetry: (attempt, max, delay) => {
            console.log(`Retrying pilot creation (${attempt}/${max}) in ${delay}ms`)
          },
          onFinalFailure: (error, attempts) => {
            console.error(`Failed to create pilot after ${attempts} attempts:`, error)
          },
        }
      )

      setSuccess(true)
      setFormData({ employee_id: '', first_name: '', last_name: '', role: 'First Officer' })
    } catch (error) {
      console.error('Form submission failed:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toast-style retry indicator */}
      <RetryIndicator
        isRetrying={isRetrying}
        statusMessage={statusMessage}
        progress={0}
        attempt={retryState.attempt}
        maxRetries={retryState.maxRetries}
        variant="toast"
      />

      {/* Success message */}
      {success && (
        <div className="rounded border border-green-200 bg-green-50 p-4 text-green-900">
          Pilot created successfully!
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Employee ID"
          value={formData.employee_id}
          onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
          className="w-full rounded border p-2"
          required
        />
        <input
          type="text"
          placeholder="First Name"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          className="w-full rounded border p-2"
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          className="w-full rounded border p-2"
          required
        />
        <select
          value={formData.role}
          onChange={(e) =>
            setFormData({ ...formData, role: e.target.value as 'Captain' | 'First Officer' })
          }
          className="w-full rounded border p-2"
        >
          <option value="First Officer">First Officer</option>
          <option value="Captain">Captain</option>
        </select>
        <button
          type="submit"
          disabled={isRetrying}
          className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isRetrying ? 'Creating...' : 'Create Pilot'}
        </button>
      </form>
    </div>
  )
}

// ===================================
// EXAMPLE 4: Custom Fetch with Retry
// ===================================

export function ExternalAPIExample() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [retryStatus, setRetryStatus] = useState('')

  const fetchExternalData = async () => {
    setLoading(true)
    setRetryStatus('')

    try {
      // Use fetchWithRetry for external APIs
      const response = await fetchWithRetry(
        'https://api.example.com/data',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        {
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 8000,
          onRetry: (attempt, max, delay) => {
            setRetryStatus(`Retrying (${attempt}/${max}) in ${Math.ceil(delay / 1000)}s...`)
          },
          onFinalFailure: () => {
            setRetryStatus('Failed after multiple attempts')
          },
        }
      )

      const result = await response.json()
      setData(result)
      setRetryStatus('')
    } catch (error) {
      console.error('Failed to fetch external data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {retryStatus && (
        <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-yellow-900">
          {retryStatus}
        </div>
      )}

      <button
        onClick={fetchExternalData}
        disabled={loading}
        className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Fetch External Data'}
      </button>

      {data && (
        <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}

// ===================================
// EXAMPLE 5: Advanced Custom Retry Logic
// ===================================

export function AdvancedRetryExample() {
  const [result, setResult] = useState<string>('')

  const performComplexOperation = async () => {
    try {
      const data = await retryWithBackoff(
        async () => {
          // Simulate complex operation
          const random = Math.random()
          if (random < 0.5) {
            throw new Error('Transient failure')
          }
          return 'Success!'
        },
        {
          maxRetries: 5,
          initialDelayMs: 500,
          maxDelayMs: 10000,
          backoffMultiplier: 2,
          useJitter: true,
          timeoutMs: 30000,
          // Custom retry predicate
          isRetryable: (error) => {
            // Only retry if error message contains "Transient"
            return error.message.includes('Transient')
          },
          onRetry: (attempt, max, delay, error) => {
            console.log(`Retry ${attempt}/${max} in ${delay}ms due to:`, error.message)
            setResult(`Retrying... (${attempt}/${max})`)
          },
          onFinalFailure: (error, attempts) => {
            console.error(`Operation failed after ${attempts} attempts:`, error)
            setResult(`Failed after ${attempts} attempts`)
          },
        }
      )

      setResult(data)
    } catch (error) {
      setResult('Operation failed completely')
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={performComplexOperation}
        className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
      >
        Perform Operation
      </button>

      {result && (
        <div className="rounded border p-4">
          <strong>Result:</strong> {result}
        </div>
      )}
    </div>
  )
}

// ===================================
// EXAMPLE 6: Combining Multiple Components
// ===================================

export function DashboardExample() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Retry Logic Examples</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded border p-4">
          <h2 className="mb-4 text-lg font-semibold">Pilot List (Basic Retry)</h2>
          <PilotListExample />
        </div>

        <div className="rounded border p-4">
          <h2 className="mb-4 text-lg font-semibold">Certifications (Supabase Retry)</h2>
          <CertificationListExample />
        </div>

        <div className="rounded border p-4">
          <h2 className="mb-4 text-lg font-semibold">Create Pilot (Form with Retry)</h2>
          <CreatePilotFormExample />
        </div>

        <div className="rounded border p-4">
          <h2 className="mb-4 text-lg font-semibold">External API (Fetch Retry)</h2>
          <ExternalAPIExample />
        </div>
      </div>

      <div className="rounded border p-4">
        <h2 className="mb-4 text-lg font-semibold">Advanced Custom Retry</h2>
        <AdvancedRetryExample />
      </div>
    </div>
  )
}
