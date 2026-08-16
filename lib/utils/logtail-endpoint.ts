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
