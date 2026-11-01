/**
 * Nuxt server-side proxy — all client-side API calls go through here so the
 * X-System-Authorization credential is attached server-side and never exposed
 * in the browser.  The proxy transparently forwards the path, query string,
 * method, body, and the user's Authorization (JWT) header to the backend.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  // Strip the leading /api/proxy prefix to reconstruct the backend path
  const path = event.path.replace(/^\/api\/proxy/, '')
  const rawBase = (config.apiBase || 'http://backend:8000').replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const targetUrl = `${rawBase}${cleanPath}`

  // Forward the user Authorization header if present (user JWT stays intact)
  const forwardHeaders: Record<string, string> = {}
  const userAuth = getHeader(event, 'authorization')
  if (userAuth) forwardHeaders['authorization'] = userAuth

  // Inject the private system credential (server-only runtimeConfig)
  const sysAuth = config.apiBaseAuth as string
  if (sysAuth) forwardHeaders['x-system-authorization'] = sysAuth

  // Forward content-type for POST/PUT/PATCH
  const contentType = getHeader(event, 'content-type')
  if (contentType) forwardHeaders['content-type'] = contentType

  return proxyRequest(event, targetUrl, { headers: forwardHeaders })
})

