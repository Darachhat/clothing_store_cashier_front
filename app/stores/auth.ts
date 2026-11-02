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
}

function getApiBase() {
  const config = useRuntimeConfig()
  return (import.meta.server ? (config.apiBase || 'http://backend:8000') : config.public.apiBase) as string
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
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
      return state.user?.roles?.some((r) =>
        r.permissions?.some((p) => p.code === code)
      ) ?? false
    },
    isAdmin: (state): boolean =>
      state.user?.roles?.some((r) => r.name === 'ADMIN') ?? false,
  },

  actions: {
    async login(username: string, password: string) {
      const data = await $fetch<{
        access_token: string
        refresh_token: string
        user: User
      }>(CASHIER_API_ENDPOINTS.auth.login, {
        baseURL: getApiBase(),
        method: 'POST',
        body: { username, password },
      })

      this.accessToken = data.access_token
      this.$state.refreshToken = data.refresh_token
      this.user = data.user

      if (process.client) {
        localStorage.setItem('cashier_access_token', data.access_token)
        localStorage.setItem('cashier_refresh_token', data.refresh_token)
      }
    },

    async refreshSession(): Promise<boolean> {
      const currentRefresh =
        this.$state.refreshToken ||
        (process.client
          ? localStorage.getItem('cashier_refresh_token') || localStorage.getItem('refresh_token')
          : null)
      if (!currentRefresh) return false
      try {
        const data = await $fetch<{
          access_token: string
          refresh_token: string
        }>(CASHIER_API_ENDPOINTS.auth.refresh, {
          baseURL: getApiBase(),
          method: 'POST',
          body: { refresh_token: currentRefresh },
        })
        this.accessToken = data.access_token
        this.$state.refreshToken = data.refresh_token
        if (process.client) {
          localStorage.setItem('cashier_access_token', data.access_token)
          localStorage.setItem('cashier_refresh_token', data.refresh_token)
        }
        return true
      } catch (err) {
        console.warn('[Auth] Token refresh failed:', err)
        return false
      }
    },

    async logout() {
      const currentRefresh =
        this.$state.refreshToken ||
        (process.client
          ? localStorage.getItem('cashier_refresh_token') || localStorage.getItem('refresh_token')
          : null)
      if (currentRefresh) {
        try {
          await $fetch(CASHIER_API_ENDPOINTS.auth.logout, {
            baseURL: getApiBase(),
            method: 'POST',
            body: { refresh_token: currentRefresh },
            headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : undefined,
          })
        } catch {}
      }
      this.user = null
      this.accessToken = null
      this.$state.refreshToken = null
      if (process.client) {
        localStorage.removeItem('cashier_access_token')
        localStorage.removeItem('cashier_refresh_token')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    },

    restoreSession() {
      if (process.client) {
        const token = localStorage.getItem('cashier_access_token') || localStorage.getItem('access_token')
        const refresh = localStorage.getItem('cashier_refresh_token') || localStorage.getItem('refresh_token')
        if (token) this.accessToken = token
        if (refresh) this.$state.refreshToken = refresh
      }
    },

    async fetchCurrentUser() {
      if (!this.accessToken) {
        this.restoreSession()
      }
      if (!this.accessToken) return

      try {
        const user = await $fetch<User>(CASHIER_API_ENDPOINTS.auth.me, {
          baseURL: getApiBase(),
          headers: { Authorization: `Bearer ${this.accessToken}` },
        })
        this.user = user
      } catch {
        const ok = await this.refreshSession()
        if (ok && this.accessToken) {
          try {
            const user = await $fetch<User>(CASHIER_API_ENDPOINTS.auth.me, {
              baseURL: getApiBase(),
              headers: { Authorization: `Bearer ${this.accessToken}` },
            })
            this.user = user
            return
          } catch {}
        }
        this.logout()
      }
    },
  },
})
