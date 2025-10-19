/**
 * Tests for Retry Utilities
 *
 * Comprehensive test suite for retry logic with exponential backoff.
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  retryWithBackoff,
  isNetworkError,
  isServerError,
  isClientError,
  isRetryableError,
  calculateBackoffDelay,
  fetchWithRetry,
  getRetryStatusMessage,
  createRetryState,
  DEFAULT_RETRY_CONFIG,
} from '../retry-utils'

// ===================================
// ERROR CLASSIFICATION TESTS
// ===================================

describe('Error Classification', () => {
  describe('isNetworkError', () => {
    it('should detect network errors', () => {
      expect(isNetworkError(new Error('Failed to fetch'))).toBe(true)
      expect(isNetworkError(new Error('Network request failed'))).toBe(true)
      expect(isNetworkError(new Error('NetworkError'))).toBe(true)
      expect(isNetworkError(new Error('ECONNREFUSED'))).toBe(true)
    })

    it('should not detect non-network errors', () => {
      expect(isNetworkError(new Error('Invalid input'))).toBe(false)
      expect(isNetworkError(new Error('Not found'))).toBe(false)
    })
  })

  describe('isServerError', () => {
    it('should detect 5xx server errors', () => {
      expect(isServerError(new Error('HTTP 500: Internal Server Error'))).toBe(true)
      expect(isServerError(new Error('Status 502 Bad Gateway'))).toBe(true)
      expect(isServerError(new Error('503 Service Unavailable'))).toBe(true)
      expect(isServerError(new Error('504'))).toBe(true)
    })

    it('should not detect non-server errors', () => {
      expect(isServerError(new Error('HTTP 404: Not Found'))).toBe(false)
      expect(isServerError(new Error('400 Bad Request'))).toBe(false)
    })
  })

  describe('isClientError', () => {
    it('should detect 4xx client errors', () => {
      expect(isClientError(new Error('HTTP 400: Bad Request'))).toBe(true)
      expect(isClientError(new Error('Status 401 Unauthorized'))).toBe(true)
      expect(isClientError(new Error('403 Forbidden'))).toBe(true)
      expect(isClientError(new Error('404 Not Found'))).toBe(true)
    })

    it('should not detect non-client errors', () => {
      expect(isClientError(new Error('HTTP 500: Internal Server Error'))).toBe(false)
      expect(isClientError(new Error('Network error'))).toBe(false)
    })
  })

  describe('isRetryableError', () => {
    it('should mark network errors as retryable', () => {
      expect(isRetryableError(new Error('Failed to fetch'))).toBe(true)
      expect(isRetryableError(new Error('NetworkError'))).toBe(true)
    })

    it('should mark server errors as retryable', () => {
      expect(isRetryableError(new Error('HTTP 500'))).toBe(true)
      expect(isRetryableError(new Error('503 Service Unavailable'))).toBe(true)
    })

    it('should mark client errors as non-retryable', () => {
      expect(isRetryableError(new Error('HTTP 400'))).toBe(false)
      expect(isRetryableError(new Error('401 Unauthorized'))).toBe(false)
      expect(isRetryableError(new Error('404 Not Found'))).toBe(false)
    })

    it('should mark unknown errors as non-retryable', () => {
      expect(isRetryableError(new Error('Some random error'))).toBe(false)
    })
  })
})

// ===================================
// BACKOFF CALCULATION TESTS
// ===================================

describe('Backoff Calculation', () => {
  it('should calculate exponential backoff correctly', () => {
    const config = {
      ...DEFAULT_RETRY_CONFIG,
      initialDelayMs: 1000,
      backoffMultiplier: 2,
      maxDelayMs: 30000,
      useJitter: false,
    }

    expect(calculateBackoffDelay(0, config)).toBe(1000) // 1000 * 2^0 = 1000
    expect(calculateBackoffDelay(1, config)).toBe(2000) // 1000 * 2^1 = 2000
    expect(calculateBackoffDelay(2, config)).toBe(4000) // 1000 * 2^2 = 4000
    expect(calculateBackoffDelay(3, config)).toBe(8000) // 1000 * 2^3 = 8000
  })

  it('should cap delay at maxDelayMs', () => {
    const config = {
      ...DEFAULT_RETRY_CONFIG,
      initialDelayMs: 1000,
      backoffMultiplier: 2,
      maxDelayMs: 5000,
      useJitter: false,
    }

    expect(calculateBackoffDelay(3, config)).toBe(5000) // Capped at 5000
    expect(calculateBackoffDelay(4, config)).toBe(5000) // Still capped
  })

  it('should add jitter when enabled', () => {
    const config = {
      ...DEFAULT_RETRY_CONFIG,
      initialDelayMs: 1000,
      backoffMultiplier: 2,
      maxDelayMs: 30000,
      useJitter: true,
    }

    const delay1 = calculateBackoffDelay(1, config)
    const delay2 = calculateBackoffDelay(1, config)

    // With jitter, delays should vary
    // Base delay is 2000, jitter adds 0-25% (0-500ms)
    expect(delay1).toBeGreaterThanOrEqual(2000)
    expect(delay1).toBeLessThanOrEqual(2500)
    expect(delay2).toBeGreaterThanOrEqual(2000)
    expect(delay2).toBeLessThanOrEqual(2500)
  })
})

// ===================================
// RETRY WITH BACKOFF TESTS
// ===================================

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should succeed on first try if operation succeeds', async () => {
    const mockFn = vi.fn().mockResolvedValue('success')

    const result = await retryWithBackoff(mockFn, { maxRetries: 3 })

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should retry on retryable errors', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockRejectedValueOnce(new Error('HTTP 503'))
      .mockResolvedValue('success')

    const promise = retryWithBackoff(mockFn, {
      maxRetries: 3,
      initialDelayMs: 100,
      useJitter: false,
    })

    // Fast-forward through retries
    await vi.runAllTimersAsync()

    const result = await promise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('should not retry on client errors', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('HTTP 400: Bad Request'))

    await expect(
      retryWithBackoff(mockFn, { maxRetries: 3, initialDelayMs: 100 })
    ).rejects.toThrow('HTTP 400: Bad Request')

    expect(mockFn).toHaveBeenCalledTimes(1) // No retries
  })

  it('should respect maxRetries limit', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Failed to fetch'))

    const promise = retryWithBackoff(mockFn, {
      maxRetries: 2,
      initialDelayMs: 100,
      useJitter: false,
    })

    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow('Failed to fetch')
    expect(mockFn).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })

  it('should call onRetry callback', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success')

    const onRetry = vi.fn()

    const promise = retryWithBackoff(mockFn, {
      maxRetries: 3,
      initialDelayMs: 100,
      useJitter: false,
      onRetry,
    })

    await vi.runAllTimersAsync()
    await promise

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledWith(
      1,
      3,
      expect.any(Number),
      expect.any(Error)
    )
  })

  it('should call onFinalFailure callback', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Network error'))
    const onFinalFailure = vi.fn()

    const promise = retryWithBackoff(mockFn, {
      maxRetries: 2,
      initialDelayMs: 100,
      useJitter: false,
      onFinalFailure,
    })

    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow('Network error')

    expect(onFinalFailure).toHaveBeenCalledTimes(1)
    expect(onFinalFailure).toHaveBeenCalledWith(
      expect.any(Error),
      3 // Initial + 2 retries
    )
  })
})

// ===================================
// FETCH WITH RETRY TESTS
// ===================================

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should retry failed fetch requests', async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'success' }),
      } as Response)

    const promise = fetchWithRetry('/api/test', undefined, {
      maxRetries: 3,
      initialDelayMs: 100,
      useJitter: false,
    })

    await vi.runAllTimersAsync()
    const response = await promise

    expect(response.ok).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should throw on HTTP errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response)

    const promise = fetchWithRetry('/api/test', undefined, {
      maxRetries: 2,
      initialDelayMs: 100,
      useJitter: false,
    })

    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow('HTTP 500')
  })
})

// ===================================
// RETRY STATE TESTS
// ===================================

describe('Retry State', () => {
  it('should create initial retry state', () => {
    const state = createRetryState(3)

    expect(state).toEqual({
      attempt: 0,
      maxRetries: 3,
      nextDelayMs: 0,
      isRetrying: false,
      lastError: null,
    })
  })

  it('should generate status message for retrying state', () => {
    const state = createRetryState(3)
    state.isRetrying = true
    state.attempt = 1
    state.nextDelayMs = 2000

    const message = getRetryStatusMessage(state)

    expect(message).toContain('Retrying')
    expect(message).toContain('2s')
  })

  it('should generate status message for final retry', () => {
    const state = createRetryState(3)
    state.isRetrying = true
    state.attempt = 3
    state.nextDelayMs = 1000

    const message = getRetryStatusMessage(state)

    expect(message).toContain('last attempt')
  })

  it('should return empty message when not retrying', () => {
    const state = createRetryState(3)

    const message = getRetryStatusMessage(state)

    expect(message).toBe('')
  })
})
