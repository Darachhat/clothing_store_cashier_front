// Guest middleware — redirects already-authenticated cashiers away from login
import { isJwtExpired } from '~/stores/auth'

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  authStore.restoreSession()

  if (authStore.accessToken && !isJwtExpired(authStore.accessToken, 15)) {
    if (authStore.user) {
      const roles = authStore.user?.roles?.map((r: any) => r.name) ?? []
      if (!roles.some((r: string) => ['CASHIER', 'ADMIN'].includes(r))) {
        authStore.clearLocalSession()
        return
      }
    }
    return navigateTo('/pos', { replace: true })
  }
})
