/**
 * Nuxt server-side proxy — all client-side API calls go through here so the
 * X-System-Authorization credential is attached server-side and never exposed
 * in the browser. The proxy transparently forwards the path, query string,
 * method, body, and the user's Authorization (JWT) header to the backend.
 *
 * Uses native `fetch` instead of `proxyRequest` so Cloudflare internal headers
 * (`cdn-loop`, `cf-ray`, `cf-ew-via`, `cf-worker`) are never forwarded onto
 * same-zone subrequests.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const rawBase = String(config.apiBase || '').trim().replace(/\/$/, '')
  if (!rawBase) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server Configuration Error',
      message: 'NUXT_API_BASE is not configured in environment variables.',
    })
  }

  const sysAuth = String(config.apiBaseAuth || '').trim()
  if (!sysAuth) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server Configuration Error',
      message: 'NUXT_API_BASE_AUTH is not configured in environment variables.',
    })
  }

  // Strip the leading /api/proxy prefix to reconstruct the backend path + query
  const path = event.path.replace(/^\/api\/proxy/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const targetUrl = `${rawBase}${cleanPath}`

  // Forward only clean application headers (never forward cf-* or cdn-loop headers)
  const forwardHeaders: Record<string, string> = {
    accept: getHeader(event, 'accept') || 'application/json',
    'x-system-authorization': sysAuth,
  }

  const userAuth = getHeader(event, 'authorization')
  if (userAuth) forwardHeaders['authorization'] = userAuth

  const contentType = getHeader(event, 'content-type')
  if (contentType) forwardHeaders['content-type'] = contentType

  const method = (event.method || 'GET').toUpperCase()
  let body: BodyInit | undefined
  if (method !== 'GET' && method !== 'HEAD') {
    const rawBody = await readRawBody(event, false)
    if (rawBody !== undefined && rawBody !== null) {
      body = rawBody as unknown as BodyInit
    }
  }

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined,
    })

    const resHeaders = new Headers()
    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase()
      if (
        lower === 'content-encoding' ||
        lower === 'content-length' ||
        lower === 'transfer-encoding' ||
        lower === 'connection'
      ) {
        return
      }
      resHeaders.set(key, value)
    })

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: resHeaders,
    })
  } catch (err: any) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Bad Gateway',
      message: `Backend proxy request failed: ${err?.message || 'Unknown error'}`,
    })
  }
})
