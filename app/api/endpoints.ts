// Centralized Cashier API Endpoints
export const CASHIER_API_ENDPOINTS = {
  auth: {
    login: '/api/cashier/v1/auth/login',
    refresh: '/api/cashier/v1/auth/refresh',
    me: '/api/cashier/v1/auth/me',
    logout: '/api/cashier/v1/auth/logout',
  },
  products: {
    list: '/api/cashier/v1/products',
    detail: (id: string) => `/api/cashier/v1/products/${id}`,
    variants: (productId: string) => `/api/cashier/v1/products/${productId}/variants`,
  },
  productVariants: {
    list: '/api/cashier/v1/product-variants',
    detail: (id: string) => `/api/cashier/v1/product-variants/${id}`,
    qr: (id: string, format: 'png' | 'svg' = 'svg') => `/api/cashier/v1/product-variants/${id}/qr?format=${format}`,
    barcode: (id: string, format: 'png' | 'svg' = 'svg', writeText = false) =>
      `/api/cashier/v1/product-variants/${id}/barcode?format=${format}&write_text=${writeText}`,
    byQr: (ref: string) => `/api/cashier/v1/product-variants/by-qr/${ref}`,
    byBarcode: (barcode: string) => `/api/cashier/v1/product-variants/by-barcode/${barcode}`,
    bySku: (sku: string) => `/api/cashier/v1/product-variants/by-sku/${sku}`,
  },
  sales: {
    list: '/api/cashier/v1/sales',
    detail: (id: string) => `/api/cashier/v1/sales/${id}`,
    create: '/api/cashier/v1/sales',
    complete: (id: string) => `/api/cashier/v1/sales/${id}/complete`,
    cancel: (id: string) => `/api/cashier/v1/sales/${id}/cancel`,
    returns: '/api/cashier/v1/returns',
    createReturn: '/api/cashier/v1/returns',
  },
  inventory: {
    stocks: '/api/cashier/v1/inventory/stocks',
    movements: '/api/cashier/v1/inventory/movements',
  },
  catalog: {
    categories: '/api/cashier/v1/categories',
    brands: '/api/cashier/v1/brands',
    colors: '/api/cashier/v1/colors',
    sizes: '/api/cashier/v1/sizes',
  },
  customers: {
    list: '/api/cashier/v1/customers',
    detail: (id: string) => `/api/cashier/v1/customers/${id}`,
    create: '/api/cashier/v1/customers',
    update: (id: string) => `/api/cashier/v1/customers/${id}`,
  },
  promotions: {
    list: '/api/cashier/v1/promotions',
    validate: '/api/cashier/v1/promotions/validate',
  },
  labels: {
    generate: '/api/cashier/v1/labels/generate',
  },
  branches: {
    list: '/api/cashier/v1/branches/',
  },
  payments: {
    abaKhqr: '/api/cashier/v1/payments/aba/khqr',
    abaPurchaseForm: '/api/cashier/v1/payments/aba/purchase-form',
    abaStatus: (id: string) => `/api/cashier/v1/payments/aba/${id}/status`,
    abaCancel: (id: string) => `/api/cashier/v1/payments/aba/${id}/cancel`,
  },
} as const

export const API_ENDPOINTS = CASHIER_API_ENDPOINTS

