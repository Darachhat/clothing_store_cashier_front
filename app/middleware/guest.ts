// Guest middleware — redirects already-authenticated users away from login
export default defineNuxtRouteMiddleware(() => {
  if (process.client) {
    const token = localStorage.getItem('cashier_access_token') || localStorage.getItem('access_token')
    if (token) {
      return navigateTo('/pos')
    }
  }
})
