// Centralized HTTP Client for Cashier POS Frontend

function isJwtExpired(token: string, bufferSeconds = 30): boolean {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return false
    const base64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/')
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonStr)
    if (typeof payload.exp === 'number') {
      return Date.now() >= (payload.exp - bufferSeconds) * 1000
    }
  } catch {
    // If decoding fails, assume not expired and let backend handle
  }
  return false
}

export function createCashierApiClient() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const baseURL = (import.meta.server
    ? (config.apiBase || 'http://backend:8000')
    : config.public.apiBase) as string

  const apiFetch = $fetch.create({
    baseURL,
    retry: 1,
    retryStatusCodes: [401],
    async onRequest({ options }) {
      if (!authStore.accessToken && typeof window !== 'undefined') {
        authStore.restoreSession()
      }
      let token =
        authStore.accessToken ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('cashier_access_token') || localStorage.getItem('access_token')
          : null)

      if (typeof window !== 'undefined') {
        const hasRefresh = !!(
          authStore.$state.refreshToken ||
          localStorage.getItem('cashier_refresh_token') ||
          localStorage.getItem('refresh_token')
        )
        if (hasRefresh && (!token || isJwtExpired(token, 30))) {
          const ok = await authStore.refreshSession()
          if (ok && authStore.accessToken) {
            token = authStore.accessToken
          }
        }
      }

      const headers = new Headers(options.headers || {})
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      // Attach system credential server-side only (credential stays private)
      if (import.meta.server) {
        const sysAuth = config.apiBaseAuth as string
        if (sysAuth) headers.set('X-System-Authorization', sysAuth)
      }
      options.headers = headers
    },
    async onResponseError({ response }) {
      if (response.status === 401) {
        const refreshed = await authStore.refreshSession()
        if (!refreshed) {
          authStore.logout()
          await navigateTo('/login')
        }
      }
    },
  })

  return {
    baseURL,
    fetch: apiFetch,
    get: <T = unknown>(url: string, params?: Record<string, unknown>, opts?: Record<string, unknown>) =>
      apiFetch<T>(url, { ...opts, params, query: params } as any),
    post: <T = unknown>(url: string, body?: unknown, opts?: Record<string, unknown>) =>
      apiFetch<T>(url, { ...opts, method: 'POST', body: body as any } as any),
    put: <T = unknown>(url: string, body?: unknown, opts?: Record<string, unknown>) =>
      apiFetch<T>(url, { ...opts, method: 'PUT', body: body as any } as any),
    patch: <T = unknown>(url: string, body?: unknown, opts?: Record<string, unknown>) =>
      apiFetch<T>(url, { ...opts, method: 'PATCH', body: body as any } as any),
    delete: <T = unknown>(url: string, opts?: Record<string, unknown>) =>
      apiFetch<T>(url, { ...opts, method: 'DELETE' } as any),
  }
}

export type CashierApiClient = ReturnType<typeof createCashierApiClient>

