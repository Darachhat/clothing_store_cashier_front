// Guest middleware — redirects already-authenticated cashiers away from login
import { isJwtExpired } from '~/stores/auth'

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  authStore.restoreSession()

  // Only redirect away from login if the user has an active token AND a verified valid user role
  if (authStore.accessToken && !isJwtExpired(authStore.accessToken, 15) && authStore.user) {
    const roles = authStore.user?.roles?.map((r: any) => r.name) ?? []
    if (roles.some((r: string) => ['CASHIER', 'ADMIN'].includes(r))) {
      return navigateTo('/pos', { replace: true })
    }
    authStore.clearLocalSession()
  }
})
