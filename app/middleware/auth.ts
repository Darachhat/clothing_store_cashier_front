// Cashier auth middleware — restores session and enforces CASHIER role
export default defineNuxtRouteMiddleware(async (to) => {
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
    return navigateTo('/login')
  }
})
