/**
 * Better Stack (Logtail) ingest endpoint resolution.
 *
 * Sources created in Better Stack's Telemetry UI ingest on a **per-source host**
 * (`https://s<sourceId>.<cluster>.betterstackdata.com`), not the legacy shared
 * endpoint. `@logtail/node@0.5.8` still defaults to
 * `https://in.logs.betterstack.com`, which returns **401 Unauthorized** for these
 * tokens — measured 2026-08-16 against the live sources:
 *
 *   POST https://s2682835.eu-central-1a.betterstackdata.com  -> 202 Accepted
 *   POST https://in.logs.betterstack.com                     -> 401 Unauthorized
 *
 * That failure is invisible: the SDK batches asynchronously, so every `log()`
 * call still resolves and the rejected batch never surfaces. Configuring the
 * token without the host would look exactly like working logging while shipping
 * nothing. Resolve the host explicitly, and warn loudly when a token is set
 * without one rather than degrading to a silent no-op.
 *
 * @see https://betterstack.com/docs/logs/javascript/
 */

export interface LogtailEndpointOptions {
  endpoint: string
}

/** The subset of the Logtail client this module needs. */
interface FlushableLogger {
  flush: () => Promise<unknown>
}

let warnedServer = false
let warnedClient = false

/**
 * Options for a server-side `new Logtail(token, options)` call.
 * Returns `undefined` when no host is configured, which leaves the SDK on its
 * legacy default — logs will be dropped, so the warning below is the signal.
 */
export function serverLogtailOptions(): LogtailEndpointOptions | undefined {
  const endpoint = process.env.LOGTAIL_INGESTING_HOST

  if (!endpoint) {
    if (!warnedServer) {
      warnedServer = true
      console.error(
        '[logtail] DEGRADED: LOGTAIL_SOURCE_TOKEN is set but LOGTAIL_INGESTING_HOST is not. ' +
          'The SDK default (https://in.logs.betterstack.com) rejects Telemetry-UI source tokens ' +
          'with 401, so server logs are being dropped silently. Set LOGTAIL_INGESTING_HOST to the ' +
          "source's ingesting host, including the https:// scheme."
      )
    }
    return undefined
  }

  return { endpoint }
}

/**
 * Options for a browser-side `new Logtail(token, options)` call.
 */
export function clientLogtailOptions(): LogtailEndpointOptions | undefined {
  const endpoint = process.env.NEXT_PUBLIC_LOGTAIL_INGESTING_HOST

  if (!endpoint) {
    if (!warnedClient) {
      warnedClient = true
      console.error(
        '[logtail] DEGRADED: NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN is set but ' +
          'NEXT_PUBLIC_LOGTAIL_INGESTING_HOST is not. Browser logs are being dropped silently.'
      )
    }
    return undefined
  }

  return { endpoint }
}

/**
 * Ensure a queued log actually leaves the machine before the serverless
 * invocation is frozen.
 *
 * `@logtail/node` batches (default ~1s) and the send is fire-and-forget from the
 * caller's perspective. On Vercel the function can be frozen the instant it
 * returns a response, so an error logged during a request is routinely
 * discarded before its batch is flushed — the logger reports success and the
 * error never appears in Better Stack.
 *
 * `after()` from `next/server` defers work until after the response is sent
 * while keeping the invocation alive, which is exactly the guarantee needed. It
 * throws outside a request scope (module init, scripts, tests), so fall back to
 * an un-awaited flush there — in those contexts the process is not about to be
 * frozen and the batch has time to drain.
 */
export function scheduleLogtailFlush(logger: FlushableLogger, queued?: unknown): void {
  const deliver = () =>
    Promise.resolve(queued)
      .then(() => logger.flush())
      .catch((error) => {
        console.error('[logtail] flush failed; log line was dropped:', error)
      })

  try {
    // Imported lazily so this module stays usable outside the Next runtime.
    const { after } = require('next/server') as { after: (task: () => unknown) => void }
    after(deliver)
  } catch {
    void deliver()
  }
}
