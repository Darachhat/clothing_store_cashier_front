// Cashier auth middleware — restores session and enforces CASHIER or ADMIN role
import { isJwtExpired } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  authStore.restoreSession()

  // If no access token or access token is expired, try refreshing once if refresh token exists
  if (!authStore.accessToken || isJwtExpired(authStore.accessToken, 15)) {
    const refreshed = await authStore.refreshSession()
    if (!refreshed || !authStore.accessToken) {
      authStore.clearLocalSession()
      return navigateTo('/login', { replace: true })
    }
  }

  // If user profile is already cached in localStorage, validate role immediately
  // and refresh user profile in the background without blocking POS page mount
  if (authStore.user) {
    const cachedRoles = authStore.user?.roles?.map((r: any) => r.name) ?? []
    if (!cachedRoles.some((r: string) => ['CASHIER', 'ADMIN'].includes(r))) {
      await authStore.logout()
      return navigateTo('/login', { replace: true })
    }
    authStore.fetchCurrentUser().catch(() => {})
    return
  }

  // Otherwise fetch current user profile before resolving route
  await authStore.fetchCurrentUser()

  if (!authStore.accessToken || !authStore.user) {
    authStore.clearLocalSession()
    return navigateTo('/login', { replace: true })
  }

  // Enforce CASHIER or ADMIN role
  const roles = (authStore.user as any)?.roles?.map((r: any) => r.name) ?? []
  if (!roles.some((r: string) => ['CASHIER', 'ADMIN'].includes(r))) {
    await authStore.logout()
    return navigateTo('/login', { replace: true })
  }
})
