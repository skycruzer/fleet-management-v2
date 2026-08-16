import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Regression cover for the two ways Better Stack logging fails silently.
 *
 * 1. Sources created in Better Stack's Telemetry UI ingest on a per-source host.
 *    `@logtail/node@0.5.8` defaults to `https://in.logs.betterstack.com`, which
 *    returns 401 for those tokens. Measured 2026-08-16 against the live sources.
 *    Without an explicit endpoint every log call still resolves and the batch is
 *    rejected out of sight.
 * 2. The SDK batches for ~1s. Vercel can freeze the invocation the moment a
 *    response is sent, so a fire-and-forget error log is routinely discarded.
 *
 * Both failure modes look identical to "no errors happened", which is why they
 * are asserted here rather than left to manual checking.
 */

const ORIGINAL_ENV = { ...process.env }

async function importFresh() {
  vi.resetModules()
  return await import('@/lib/utils/logtail-endpoint')
}

beforeEach(() => {
  delete process.env.LOGTAIL_INGESTING_HOST
  delete process.env.NEXT_PUBLIC_LOGTAIL_INGESTING_HOST
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.restoreAllMocks()
})

describe('serverLogtailOptions', () => {
  it('returns the configured ingesting host so the SDK does not use its 401-ing default', async () => {
    process.env.LOGTAIL_INGESTING_HOST = 'https://s2682835.eu-central-1a.betterstackdata.com'

    const { serverLogtailOptions } = await importFresh()

    expect(serverLogtailOptions()).toEqual({
      endpoint: 'https://s2682835.eu-central-1a.betterstackdata.com',
    })
  })

  it('warns loudly instead of degrading silently when the host is missing', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { serverLogtailOptions } = await importFresh()

    expect(serverLogtailOptions()).toBeUndefined()
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(consoleError.mock.calls[0][0]).toContain('[logtail] DEGRADED')
    expect(consoleError.mock.calls[0][0]).toContain('LOGTAIL_INGESTING_HOST')
  })

  it('warns once, not on every request', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { serverLogtailOptions } = await importFresh()
    serverLogtailOptions()
    serverLogtailOptions()
    serverLogtailOptions()

    expect(consoleError).toHaveBeenCalledTimes(1)
  })
})

describe('clientLogtailOptions', () => {
  it('returns the configured browser ingesting host', async () => {
    process.env.NEXT_PUBLIC_LOGTAIL_INGESTING_HOST =
      'https://s2682840.eu-central-1a.betterstackdata.com'

    const { clientLogtailOptions } = await importFresh()

    expect(clientLogtailOptions()).toEqual({
      endpoint: 'https://s2682840.eu-central-1a.betterstackdata.com',
    })
  })

  it('warns when the browser host is missing', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { clientLogtailOptions } = await importFresh()

    expect(clientLogtailOptions()).toBeUndefined()
    expect(consoleError.mock.calls[0][0]).toContain('[logtail] DEGRADED')
  })
})

describe('scheduleLogtailFlush', () => {
  it('flushes the batch so the log survives the invocation being frozen', async () => {
    const flush = vi.fn().mockResolvedValue(undefined)
    const { scheduleLogtailFlush } = await importFresh()

    scheduleLogtailFlush({ flush }, Promise.resolve('queued'))
    await vi.waitFor(() => expect(flush).toHaveBeenCalledTimes(1))
  })

  it('waits for the queued log before flushing', async () => {
    const order: string[] = []
    const flush = vi.fn(async () => {
      order.push('flush')
    })
    const queued = Promise.resolve().then(() => {
      order.push('queued')
    })

    const { scheduleLogtailFlush } = await importFresh()
    scheduleLogtailFlush({ flush }, queued)

    await vi.waitFor(() => expect(flush).toHaveBeenCalled())
    expect(order).toEqual(['queued', 'flush'])
  })

  it('never throws when the flush itself fails — logging must not break the request', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const flush = vi.fn().mockRejectedValue(new Error('network down'))

    const { scheduleLogtailFlush } = await importFresh()

    expect(() => scheduleLogtailFlush({ flush }, undefined)).not.toThrow()
    await vi.waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('[logtail] flush failed'),
        expect.any(Error)
      )
    )
  })

  it('still flushes outside a Next request scope, where after() is unavailable', async () => {
    // Vitest runs outside a request scope, so `after()` throws here. The
    // fallback path is what scripts and module-init code rely on.
    const flush = vi.fn().mockResolvedValue(undefined)
    const { scheduleLogtailFlush } = await importFresh()

    scheduleLogtailFlush({ flush }, undefined)
    await vi.waitFor(() => expect(flush).toHaveBeenCalledTimes(1))
  })
})
