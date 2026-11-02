// Backward-compatible API facade delegating to centralized client & endpoints
import { createCashierApiClient } from '~/api/client'
import { CASHIER_API_ENDPOINTS } from '~/api/endpoints'

export function useApi() {
  const client = createCashierApiClient()

  return {
    baseURL: client.baseURL,
    apiFetch: client.fetch,
    get: client.get,
    post: client.post,
    patch: client.patch,
    put: client.put,
    delete: client.delete,
  }
}

// Typed POS Domain API Helpers (targeting /api/cashier/v1/*)
export function useProductApi() {
  const { apiFetch } = useApi()

  return {
    listProducts: <T = any>(params?: Record<string, unknown>) =>
      apiFetch<T>(CASHIER_API_ENDPOINTS.products.list, { params, query: params }),
    getProduct: (id: string) =>
      apiFetch(CASHIER_API_ENDPOINTS.products.detail(id)),
    getVariants: (productId: string) =>
      apiFetch(CASHIER_API_ENDPOINTS.products.variants(productId)),
    getVariantQr: (variantId: string, format: 'png' | 'svg' = 'svg') =>
      `${useRuntimeConfig().public.apiBase}${CASHIER_API_ENDPOINTS.productVariants.qr(variantId, format)}`,
    getVariantBarcode: (variantId: string, format: 'png' | 'svg' = 'svg', writeText = false) =>
      `${useRuntimeConfig().public.apiBase}${CASHIER_API_ENDPOINTS.productVariants.barcode(variantId, format, writeText)}`,
    searchByQr: (ref: string) =>
      apiFetch(CASHIER_API_ENDPOINTS.productVariants.byQr(ref)),
    searchByBarcode: (barcode: string) =>
      apiFetch(CASHIER_API_ENDPOINTS.productVariants.byBarcode(barcode)),
    searchBySku: (sku: string) =>
      apiFetch(CASHIER_API_ENDPOINTS.productVariants.bySku(sku)),
  }
}

export function useSaleApi() {
  const { apiFetch } = useApi()

  return {
    listSales: (params?: Record<string, unknown>) =>
      apiFetch(CASHIER_API_ENDPOINTS.sales.list, { params, query: params }),
    getSale: (id: string) =>
      apiFetch(CASHIER_API_ENDPOINTS.sales.detail(id)),
    createSale: (body: unknown) =>
      apiFetch(CASHIER_API_ENDPOINTS.sales.create, { method: 'POST', body: body as any }),
    completeSale: (id: string, body: unknown) =>
      apiFetch(CASHIER_API_ENDPOINTS.sales.complete(id), { method: 'POST', body: body as any }),
    cancelSale: (id: string) =>
      apiFetch(CASHIER_API_ENDPOINTS.sales.cancel(id), { method: 'POST' }),
    listReturns: (params?: Record<string, unknown>) =>
      apiFetch(CASHIER_API_ENDPOINTS.sales.returns, { params, query: params }),
    createReturn: (body: unknown) =>
      apiFetch(CASHIER_API_ENDPOINTS.sales.createReturn, { method: 'POST', body: body as any }),
  }
}

export function useInventoryApi() {
  const { apiFetch } = useApi()

  return {
    listStocks: (params?: Record<string, unknown>) =>
      apiFetch(CASHIER_API_ENDPOINTS.inventory.stocks, { params, query: params }),
    listMovements: (params?: Record<string, unknown>) =>
      apiFetch(CASHIER_API_ENDPOINTS.inventory.movements, { params, query: params }),
  }
}

export function useCatalogApi() {
  const { apiFetch } = useApi()

  return {
    listCategories: (params?: Record<string, unknown>) =>
      apiFetch(CASHIER_API_ENDPOINTS.catalog.categories, { params, query: params }),
    listBrands: (params?: Record<string, unknown>) =>
      apiFetch(CASHIER_API_ENDPOINTS.catalog.brands, { params, query: params }),
    listColors: (params?: Record<string, unknown>) =>
      apiFetch(CASHIER_API_ENDPOINTS.catalog.colors, { params, query: params }),
    listSizes: (params?: Record<string, unknown>) =>
      apiFetch(CASHIER_API_ENDPOINTS.catalog.sizes, { params, query: params }),
  }
}

export function useVariantApi() {
  const { apiFetch } = useApi()

  return {
    listVariants: (params?: Record<string, unknown>) =>
      apiFetch(CASHIER_API_ENDPOINTS.productVariants.list, { params, query: params }),
    getVariant: (id: string) =>
      apiFetch(CASHIER_API_ENDPOINTS.productVariants.detail(id)),
    getQrUrl: (id: string, format: 'png' | 'svg' = 'svg') =>
      `${useRuntimeConfig().public.apiBase}${CASHIER_API_ENDPOINTS.productVariants.qr(id, format)}`,
    getBarcodeUrl: (id: string, format: 'png' | 'svg' = 'svg', writeText = false) =>
      `${useRuntimeConfig().public.apiBase}${CASHIER_API_ENDPOINTS.productVariants.barcode(id, format, writeText)}`,
  }
}

export function useCustomerApi() {
  const { apiFetch } = useApi()

  return {
    listCustomers: (params?: Record<string, unknown>) =>
      apiFetch(CASHIER_API_ENDPOINTS.customers.list, { params, query: params }),
    getCustomer: (id: string) =>
      apiFetch(CASHIER_API_ENDPOINTS.customers.detail(id)),
    createCustomer: (body: unknown) =>
      apiFetch(CASHIER_API_ENDPOINTS.customers.create, { method: 'POST', body: body as any }),
    updateCustomer: (id: string, body: unknown) =>
      apiFetch(CASHIER_API_ENDPOINTS.customers.update(id), { method: 'PUT', body: body as any }),
  }
}

export function usePromotionApi() {
  const { apiFetch } = useApi()

  return {
    listPromotions: (params?: Record<string, unknown>) =>
      apiFetch(CASHIER_API_ENDPOINTS.promotions.list, { params, query: params }),
    validateCoupon: (body: { code: string; cart_total: number }) =>
      apiFetch(CASHIER_API_ENDPOINTS.promotions.validate, { method: 'POST', body }),
  }
}

export function useLabelApi() {
  const { apiFetch } = useApi()

  return {
    generateLabels: (body: unknown) =>
      apiFetch(CASHIER_API_ENDPOINTS.labels.generate, { method: 'POST', body: body as any, responseType: 'blob' as any }),
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
      }>>(CASHIER_API_ENDPOINTS.branches.list),
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
      }>(CASHIER_API_ENDPOINTS.payments.abaKhqr, {
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
      }>(CASHIER_API_ENDPOINTS.payments.abaPurchaseForm, {
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
      }>(CASHIER_API_ENDPOINTS.payments.abaStatus(paymentId)),

    cancel: (paymentId: string) =>
      apiFetch<{ id: string; status: string }>(
        CASHIER_API_ENDPOINTS.payments.abaCancel(paymentId),
        { method: 'POST' },
      ),
  }
}

export function useTerminalApi() {
  const { apiFetch } = useApi()

  return {
    listTerminals: (params?: { branch_id?: string; status_code?: string }) =>
      apiFetch<any[]>(CASHIER_API_ENDPOINTS.terminals.list, { params, query: params }),
    getTerminal: (id: string) =>
      apiFetch<any>(CASHIER_API_ENDPOINTS.terminals.detail(id)),
    heartbeat: (id: string) =>
      apiFetch<any>(CASHIER_API_ENDPOINTS.terminals.heartbeat(id), { method: 'POST' }),
  }
}
