// Centralized HTTP Client for Cashier POS Frontend
import { isJwtExpired } from '~/stores/auth'

let cachedClientBaseURL: string | null = null

export function createCashierApiClient() {
  const authStore = useAuthStore()

  let baseURL = cachedClientBaseURL || ''
  if (!baseURL || import.meta.server) {
    const config = useRuntimeConfig()
    baseURL = String(import.meta.server ? config.apiBase : (config.public?.apiBase || '/api/proxy')).trim() || '/api/proxy'
    if (!import.meta.server) {
      cachedClientBaseURL = baseURL
    }
  }

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
      if (import.meta.server) {
        try {
          const config = useRuntimeConfig()
          const sysAuth = config.apiBaseAuth as string
          if (sysAuth) headers.set('X-System-Authorization', sysAuth)
        } catch {}
      }
      options.headers = headers
    },
    async onResponseError({ response }) {
      if (response.status === 401) {
        const refreshed = await authStore.refreshSession()
        if (!refreshed) {
          await authStore.logout()
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.replace('/login')
          }
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
