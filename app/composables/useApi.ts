// Helper to decode JWT payload safely
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

// Centralized Cashier API composable — wraps $fetch with auth headers, SSR-safe base URL, and token refresh
export function useApi() {
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
      let token = authStore.accessToken || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)

      if (typeof window !== 'undefined') {
        const hasRefresh = !!(authStore.$state.refreshToken || localStorage.getItem('refresh_token'))
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
    apiFetch,
    get: <T = any>(url: string, params?: Record<string, unknown>) =>
      apiFetch<T>(url, { params, query: params }),
    post: <T = any>(url: string, body?: unknown) =>
      apiFetch<T>(url, { method: 'POST', body: body as any }),
    patch: <T = any>(url: string, body?: unknown) =>
      apiFetch<T>(url, { method: 'PATCH', body: body as any }),
    put: <T = any>(url: string, body?: unknown) =>
      apiFetch<T>(url, { method: 'PUT', body: body as any }),
    delete: <T = any>(url: string) =>
      apiFetch<T>(url, { method: 'DELETE' }),
  }
}


// Typed POS Domain API Helpers (targeting /api/cashier/v1/*)
export function useProductApi() {
  const { apiFetch } = useApi()

  return {
    listProducts: <T = any>(params?: Record<string, unknown>) =>
      apiFetch<T>('/api/cashier/v1/products', { params, query: params }),
    getProduct: (id: string) =>
      apiFetch(`/api/cashier/v1/products/${id}`),
    getVariants: (productId: string) =>
      apiFetch(`/api/cashier/v1/products/${productId}/variants`),
    getVariantQr: (variantId: string, format: 'png' | 'svg' = 'svg') =>
      `${useRuntimeConfig().public.apiBase}/api/cashier/v1/product-variants/${variantId}/qr?format=${format}`,
    getVariantBarcode: (variantId: string, format: 'png' | 'svg' = 'svg', writeText = false) =>
      `${useRuntimeConfig().public.apiBase}/api/cashier/v1/product-variants/${variantId}/barcode?format=${format}&write_text=${writeText}`,
    searchByQr: (ref: string) =>
      apiFetch(`/api/cashier/v1/product-variants/by-qr/${ref}`),
    searchByBarcode: (barcode: string) =>
      apiFetch(`/api/cashier/v1/product-variants/by-barcode/${barcode}`),
    searchBySku: (sku: string) =>
      apiFetch(`/api/cashier/v1/product-variants/by-sku/${sku}`),
  }
}

export function useSaleApi() {
  const { apiFetch } = useApi()

  return {
    listSales: (params?: Record<string, unknown>) =>
      apiFetch('/api/cashier/v1/sales', { params, query: params }),
    getSale: (id: string) =>
      apiFetch(`/api/cashier/v1/sales/${id}`),
    createSale: (body: unknown) =>
      apiFetch('/api/cashier/v1/sales', { method: 'POST', body: body as any }),
    completeSale: (id: string, body: unknown) =>
      apiFetch(`/api/cashier/v1/sales/${id}/complete`, { method: 'POST', body: body as any }),
    cancelSale: (id: string) =>
      apiFetch(`/api/cashier/v1/sales/${id}/cancel`, { method: 'POST' }),
    listReturns: (params?: Record<string, unknown>) =>
      apiFetch('/api/cashier/v1/returns', { params, query: params }),
    createReturn: (body: unknown) =>
      apiFetch('/api/cashier/v1/returns', { method: 'POST', body: body as any }),
  }
}

export function useInventoryApi() {
  const { apiFetch } = useApi()

  return {
    listStocks: (params?: Record<string, unknown>) =>
      apiFetch('/api/cashier/v1/inventory/stocks', { params, query: params }),
    listMovements: (params?: Record<string, unknown>) =>
      apiFetch('/api/cashier/v1/inventory/movements', { params, query: params }),
  }
}

export function useCatalogApi() {
  const { apiFetch } = useApi()

  return {
    listCategories: (params?: Record<string, unknown>) =>
      apiFetch('/api/cashier/v1/categories', { params, query: params }),
    listBrands: (params?: Record<string, unknown>) =>
      apiFetch('/api/cashier/v1/brands', { params, query: params }),
    listColors: (params?: Record<string, unknown>) =>
      apiFetch('/api/cashier/v1/colors', { params, query: params }),
    listSizes: (params?: Record<string, unknown>) =>
      apiFetch('/api/cashier/v1/sizes', { params, query: params }),
  }
}

export function useVariantApi() {
  const { apiFetch } = useApi()

  return {
    listVariants: (params?: Record<string, unknown>) =>
      apiFetch('/api/cashier/v1/product-variants', { params, query: params }),
    getVariant: (id: string) =>
      apiFetch(`/api/cashier/v1/product-variants/${id}`),
    getQrUrl: (id: string, format: 'png' | 'svg' = 'svg') =>
      `${useRuntimeConfig().public.apiBase}/api/cashier/v1/product-variants/${id}/qr?format=${format}`,
    getBarcodeUrl: (id: string, format: 'png' | 'svg' = 'svg', writeText = false) =>
      `${useRuntimeConfig().public.apiBase}/api/cashier/v1/product-variants/${id}/barcode?format=${format}&write_text=${writeText}`,
  }
}

export function useCustomerApi() {
  const { apiFetch } = useApi()

  return {
    listCustomers: (params?: Record<string, unknown>) =>
      apiFetch('/api/cashier/v1/customers', { params, query: params }),
    getCustomer: (id: string) =>
      apiFetch(`/api/cashier/v1/customers/${id}`),
    createCustomer: (body: unknown) =>
      apiFetch('/api/cashier/v1/customers', { method: 'POST', body: body as any }),
    updateCustomer: (id: string, body: unknown) =>
      apiFetch(`/api/cashier/v1/customers/${id}`, { method: 'PUT', body: body as any }),
  }
}

export function usePromotionApi() {
  const { apiFetch } = useApi()

  return {
    listPromotions: (params?: Record<string, unknown>) =>
      apiFetch('/api/cashier/v1/promotions', { params, query: params }),
    validateCoupon: (body: { code: string; cart_total: number }) =>
      apiFetch('/api/cashier/v1/promotions/validate', { method: 'POST', body }),
  }
}

export function useLabelApi() {
  const { apiFetch } = useApi()

  return {
    generateLabels: (body: unknown) =>
      apiFetch('/api/cashier/v1/labels/generate', { method: 'POST', body: body as any, responseType: 'blob' as any }),
  }
}

export function useBranchApi() {
  const { apiFetch } = useApi()

  return {
    listBranches: () =>
      apiFetch<Array<{
        id: string
        code: string
        name: string
        address?: string
        phone?: string
        status: string
        warehouses: Array<{
          id: string
          branch_id: string
          name: string
          is_default: boolean
          status: string
        }>
      }>>('/api/cashier/v1/branches/'),
  }
}

export function usePaymentApi() {
  const { apiFetch } = useApi()

  return {
    createKhqr: (saleId: string) =>
      apiFetch<{
        id: string
        tran_id: string
        sale_id: string
        status: string
        amount: number
        currency: string
        qr_string: string | null
        qr_image: string | null
        checkout_url: string | null
        apv: string | null
        expires_at: string | null
        paid_at: string | null
      }>('/api/cashier/v1/payments/aba/khqr', {
        method: 'POST',
        body: { sale_id: saleId },
      }),

    createPurchaseForm: (saleId: string, paymentOption: string = 'cards') =>
      apiFetch<{
        action_url: string
        form_data: Record<string, string>
        payment_id: string
        tran_id: string
        amount: number
        currency: string
      }>('/api/cashier/v1/payments/aba/purchase-form', {
        method: 'POST',
        body: { sale_id: saleId, payment_option: paymentOption },
      }),

    getStatus: (paymentId: string) =>
      apiFetch<{
        id: string
        tran_id: string
        status: string
        amount: number
        apv: string | null
        expires_at: string | null
        paid_at: string | null
      }>(`/api/cashier/v1/payments/aba/${paymentId}/status`),

    cancel: (paymentId: string) =>
      apiFetch<{ id: string; status: string }>(
        `/api/cashier/v1/payments/aba/${paymentId}/cancel`,
        { method: 'POST' },
      ),
  }
}
