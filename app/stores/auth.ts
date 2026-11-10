// Auth store — manages JWT tokens and current user
import { defineStore } from 'pinia'
import { CASHIER_API_ENDPOINTS } from '~/api/endpoints'
import type { USER_RESPONSE_SCHEMA } from '~/types/api.generated'

export interface UserRole {
  name: string
  permissions?: Array<{ code: string }>
}

export interface User extends Omit<USER_RESPONSE_SCHEMA, 'roles'> {
  roles?: UserRole[]
  branch?: { id?: string; name?: string } | null
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  refreshRejected: boolean
}

export function isJwtExpired(token: string | null | undefined, bufferSeconds = 15): boolean {
  if (!token) return true
  try {
    const parts = token.split('.')
    if (parts.length < 2) return false
    const base64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const jsonStr = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonStr)
    if (typeof payload.exp === 'number') {
      return Date.now() >= (payload.exp - bufferSeconds) * 1000
    }
  } catch {
    // If decoding fails, let backend validate
  }
  return false
}

let cachedApiBase: string | null = null
let refreshInFlight: Promise<boolean> | null = null

function getApiBase(): string {
  if (cachedApiBase) return cachedApiBase
  const config = useRuntimeConfig()
  const base = String(import.meta.server ? config.apiBase : (config.public?.apiBase || '/api/proxy')).trim()
  cachedApiBase = base || '/api/proxy'
  return cachedApiBase
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    refreshRejected: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken && !!state.user,
    currentUser: (state) => state.user,
    permissions: (state): Set<string> => {
      const perms = new Set<string>()
      state.user?.roles?.forEach((role) => {
        role.permissions?.forEach((p) => perms.add(p.code))
      })
      return perms
    },
    hasPermission: (state) => (code: string): boolean => {
      return (
        state.user?.roles?.some((r) => r.permissions?.some((p) => p.code === code)) ?? false
      )
    },
    isAdmin: (state): boolean =>
      state.user?.roles?.some((r) => r.name === 'ADMIN') ?? false,
  },

  actions: {
    clearLocalSession() {
      this.user = null
      this.accessToken = null
      this.$state.refreshToken = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cashier_access_token')
        localStorage.removeItem('cashier_refresh_token')
        localStorage.removeItem('cashier_user')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    },

    async login(username: string, password: string) {
      const apiBase = getApiBase()
      const data = await $fetch<{
        access_token: string
        refresh_token: string
        user: User
      }>(CASHIER_API_ENDPOINTS.auth.login, {
        baseURL: apiBase,
        method: 'POST',
        body: { username, password },
        timeout: 12000,
      })

      this.accessToken = data.access_token
      this.$state.refreshToken = data.refresh_token
      this.user = data.user

      if (typeof window !== 'undefined') {
        localStorage.setItem('cashier_access_token', data.access_token)
        localStorage.setItem('cashier_refresh_token', data.refresh_token)
        try {
          localStorage.setItem('cashier_user', JSON.stringify(data.user))
        } catch {}
      }
    },

    async getTelegramConfig(): Promise<{ enabled: boolean; bot_username?: string | null; bot_id?: string | null }> {
      try {
        const res = await $fetch<{ enabled: boolean; bot_username?: string | null; bot_id?: string | null }>(
          CASHIER_API_ENDPOINTS.auth.telegramConfig,
          {
            baseURL: getApiBase(),
            method: 'GET',
            timeout: 6000,
          }
        )
        return {
          enabled: res.enabled,
          bot_username: res.bot_username ? res.bot_username.replace(/^@/, '') : null,
          bot_id: res.bot_id || null,
        }
      } catch {
        return { enabled: false, bot_username: null, bot_id: null }
      }
    },

    async loginWithTelegram(payload: Record<string, unknown>) {
      const apiBase = getApiBase()
      const data = await $fetch<{
        access_token: string
        refresh_token: string
        user: User
      }>(CASHIER_API_ENDPOINTS.auth.telegramLogin, {
        baseURL: apiBase,
        method: 'POST',
        body: payload,
        timeout: 12000,
      })

      this.accessToken = data.access_token
      this.$state.refreshToken = data.refresh_token
      this.user = data.user

      if (typeof window !== 'undefined') {
        localStorage.setItem('cashier_access_token', data.access_token)
        localStorage.setItem('cashier_refresh_token', data.refresh_token)
        try {
          localStorage.setItem('cashier_user', JSON.stringify(data.user))
        } catch {}
      }
    },

    async createTelegramAppChallenge(): Promise<{
      challenge_token: string
      bot_username: string
      tg_app_url: string
      tg_web_url: string
      expires_in_seconds: number
    }> {
      return await $fetch(CASHIER_API_ENDPOINTS.auth.telegramAppChallenge, {
        baseURL: getApiBase(),
        method: 'POST',
        timeout: 10000,
      })
    },

    async pollTelegramAppStatus(challengeToken: string): Promise<{
      status: string
      message?: string
      access_token?: string
      refresh_token?: string
      user?: User
    }> {
      const res = await $fetch<{
        status: string
        message?: string
        access_token?: string
        refresh_token?: string
        user?: User
      }>(CASHIER_API_ENDPOINTS.auth.telegramAppStatus(challengeToken), {
        baseURL: getApiBase(),
        method: 'GET',
        timeout: 10000,
      })

      if (res.status === 'APPROVED' && res.access_token && res.refresh_token && res.user) {
        this.accessToken = res.access_token
        this.$state.refreshToken = res.refresh_token
        this.user = res.user
        if (typeof window !== 'undefined') {
          localStorage.setItem('cashier_access_token', res.access_token)
          localStorage.setItem('cashier_refresh_token', res.refresh_token)
          try {
            localStorage.setItem('cashier_user', JSON.stringify(res.user))
          } catch {}
        }
      }
      return res
    },

    /**
     * Refresh tokens are single-use (rotated). Concurrent callers share one in-flight request,
     * and a failure caused by another tab having already rotated the token is recovered from storage.
     */
    refreshSession(): Promise<boolean> {
      if (refreshInFlight) return refreshInFlight
      refreshInFlight = this._doRefresh().finally(() => {
        refreshInFlight = null
      })
      return refreshInFlight
    },

    async _doRefresh(): Promise<boolean> {
      const apiBase = getApiBase()
      const readStored = () =>
        typeof window !== 'undefined'
          ? localStorage.getItem('cashier_refresh_token') || localStorage.getItem('refresh_token')
          : null
      const currentRefresh = readStored() || this.$state.refreshToken
      if (!currentRefresh) return false
      try {
        const data = await $fetch<{
          access_token: string
          refresh_token: string
        }>(CASHIER_API_ENDPOINTS.auth.refresh, {
          baseURL: apiBase,
          method: 'POST',
          body: { refresh_token: currentRefresh },
          timeout: 8000,
        })
        this.accessToken = data.access_token
        this.$state.refreshToken = data.refresh_token
        if (typeof window !== 'undefined') {
          localStorage.setItem('cashier_access_token', data.access_token)
          localStorage.setItem('cashier_refresh_token', data.refresh_token)
        }
        this.refreshRejected = false
        return true
      } catch (err: any) {
        const status = err?.status || err?.statusCode || err?.response?.status
        // Another tab may have rotated the token first: adopt its tokens.
        const latest = readStored()
        if (latest && latest !== currentRefresh && typeof window !== 'undefined') {
          const access = localStorage.getItem('cashier_access_token')
          if (access) {
            this.accessToken = access
            this.$state.refreshToken = latest
            this.refreshRejected = false
            return true
          }
        }
        console.warn('[Auth] Token refresh failed:', err)
        // Only an explicit auth rejection means the session is truly dead (not network/5xx).
        this.refreshRejected = status === 400 || status === 401 || status === 403
        return false
      }
    },

    async logout() {
      const apiBase = getApiBase()
      const currentAccess = this.accessToken
      const currentRefresh =
        this.$state.refreshToken ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('cashier_refresh_token') || localStorage.getItem('refresh_token')
          : null)

      // Clear local state and localStorage synchronously FIRST to prevent redirect loops
      this.clearLocalSession()

      if (currentRefresh) {
        try {
          await $fetch(CASHIER_API_ENDPOINTS.auth.logout, {
            baseURL: apiBase,
            method: 'POST',
            body: { refresh_token: currentRefresh },
            headers: currentAccess ? { Authorization: `Bearer ${currentAccess}` } : undefined,
            timeout: 4000,
          })
        } catch {}
      }
    },

    restoreSession() {
      if (typeof window !== 'undefined') {
        const token =
          localStorage.getItem('cashier_access_token') || localStorage.getItem('access_token')
        const refresh =
          localStorage.getItem('cashier_refresh_token') || localStorage.getItem('refresh_token')
        if (token) this.accessToken = token
        if (refresh) this.$state.refreshToken = refresh
        if (!this.user) {
          const rawUser = localStorage.getItem('cashier_user')
          if (rawUser) {
            try {
              this.user = JSON.parse(rawUser) as User
            } catch {
              localStorage.removeItem('cashier_user')
            }
          }
        }
      }
    },

    async fetchCurrentUser() {
      const apiBase = getApiBase()
      if (!this.accessToken) {
        this.restoreSession()
      }
      if (!this.accessToken) return

      try {
        const user = await $fetch<User>(CASHIER_API_ENDPOINTS.auth.me, {
          baseURL: apiBase,
          headers: { Authorization: `Bearer ${this.accessToken}` },
          timeout: 8000,
        })
        this.user = user
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('cashier_user', JSON.stringify(user))
          } catch {}
        }
      } catch {
        const ok = await this.refreshSession()
        if (ok && this.accessToken) {
          try {
            const user = await $fetch<User>(CASHIER_API_ENDPOINTS.auth.me, {
              baseURL: apiBase,
              headers: { Authorization: `Bearer ${this.accessToken}` },
              timeout: 8000,
            })
            this.user = user
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem('cashier_user', JSON.stringify(user))
              } catch {}
            }
            return
          } catch {}
        }
        await this.logout()
      }
    },
  },
})
