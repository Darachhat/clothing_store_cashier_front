// Cashier auth middleware — restores session and enforces CASHIER role
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const authStore = useAuthStore()

  if (process.client) {
    authStore.restoreSession()
    if (authStore.accessToken && !authStore.user) {
      await authStore.fetchCurrentUser()
    }
  }

  if (!authStore.accessToken) {
    return navigateTo('/login')
  }

  // Enforce CASHIER or ADMIN role
  const roles = authStore.user?.roles?.map((r: any) => r.name) ?? []
  if (!roles.some((r: string) => ['CASHIER', 'ADMIN'].includes(r))) {
    await authStore.logout()
    return navigateTo('/login')
  }
})
