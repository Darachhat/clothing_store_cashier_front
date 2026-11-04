/**
 * usePosProducts — Composable for server-side paginated product browsing in the POS.
 *
 * Responsibilities:
 *  - Fetch paginated products from the API (/api/v1/products)
 *  - Manage page, pageSize, search, category, brand, sort state
 *  - Debounce text search and reset page to 1 on any filter change
 *  - Expose pagination metadata for the ProductPagination component
 *  - Handle loading, error, and retry states scoped to the product grid area
 *
 * The POS cart is NOT affected by this composable.
 */

import type { Product } from '~/types/index'
import { usePosOfflineCatalog } from './usePosOfflineCatalog'

// ── Constants ────────────────────────────────────────────────────────
/** Default number of products per page in the POS grid (6 cols × 4 rows). */
export const POS_PRODUCT_PAGE_SIZE = 24

/** Maximum page size the API accepts. */
const MAX_PAGE_SIZE = 100

/** Debounce delay in milliseconds for text search. */
const SEARCH_DEBOUNCE_MS = 350

// ── Types ────────────────────────────────────────────────────────────
export interface PosProductPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface PosProductFilters {
  search: string
  category: string   // slug / name / '' = all
  brand: string      // slug / name / '' = all
  status: string     // 'ACTIVE' | 'ALL' etc.
  sort: string
  sortDirection: 'asc' | 'desc'
}

// ── Composable ───────────────────────────────────────────────────────
export function usePosProducts() {
  const { listProducts } = useProductApi()
  const offlineCatalog = usePosOfflineCatalog()

  // ── Reactive State ──────────────────────────────────────────────
  const products = ref<Product[]>([])
  const loading = ref(true)
  const error = ref(false)
  const errorMessage = ref('')

  const pagination = ref<PosProductPagination>({
    page: 1,
    pageSize: POS_PRODUCT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  })

  const filters = ref<PosProductFilters>({
    search: '',
    category: '',
    brand: '',
    status: 'ACTIVE',
    sort: 'created_at',
    sortDirection: 'desc',
  })

  // ── Internal debounce handle ────────────────────────────────────
  let _searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

  // ── Core Fetch ──────────────────────────────────────────────────
  async function fetchProducts() {
    loading.value = true
    error.value = false
    errorMessage.value = ''

    const f = filters.value
    const p = pagination.value

    const params: Record<string, string | number | boolean | undefined> = {
      page: p.page,
      page_size: Math.min(p.pageSize, MAX_PAGE_SIZE),
      sort: f.sort,
      sort_direction: f.sortDirection,
      // include_variants=true so product cards have color/size/SKU data
      include_variants: true,
      include_stock: false,
    }

    if (f.search.trim()) params.search = f.search.trim()
    if (f.category && f.category !== 'all') params.category = f.category
    if (f.brand && f.brand !== 'all') params.brand = f.brand
    if (f.status && f.status !== 'ALL') params.status = f.status

    try {
      const response = await listProducts<any>(params)

      const items = Array.isArray(response)
        ? response
        : (response?.items || response?.data || [])
      products.value = items

      // Sync active page products into offline local cache in background
      if (items.length > 0) {
        offlineCatalog.syncProducts(items).catch(() => {})
      }

      const meta = response?.pagination || response?.meta || {
        page: pagination.value.page || 1,
        page_size: pagination.value.pageSize || POS_PRODUCT_PAGE_SIZE,
        total: items.length,
        total_pages: Math.max(1, Math.ceil(items.length / (pagination.value.pageSize || POS_PRODUCT_PAGE_SIZE))),
        has_next: false,
        has_previous: (pagination.value.page || 1) > 1,
      }

      // Guard: if page is beyond new total_pages, clamp and re-fetch
      if (meta.total_pages > 0 && meta.page > meta.total_pages) {
        pagination.value.page = meta.total_pages
        return fetchProducts()
      }

      pagination.value = {
        page: Number(meta.page) || 1,
        pageSize: Number(meta.page_size || meta.pageSize) || POS_PRODUCT_PAGE_SIZE,
        total: Number(meta.total) || items.length,
        totalPages: Number(meta.total_pages || meta.totalPages) || 1,
        hasNext: Boolean(meta.has_next ?? meta.hasNext),
        hasPrevious: Boolean(meta.has_previous ?? meta.hasPrevious),
      }
    } catch (err: any) {
      error.value = true
      errorMessage.value =
        err?.data?.detail ||
        err?.message ||
        'Unable to load products. Check your connection and try again.'
      products.value = []
    } finally {
      loading.value = false
    }
  }

  // ── Pagination Actions ──────────────────────────────────────────
  async function goToPage(page: number) {
    const targetPage = Math.max(1, page)
    if (pagination.value.totalPages > 0 && targetPage > pagination.value.totalPages) return
    pagination.value.page = targetPage
    await fetchProducts()
  }

  async function nextPage() {
    if (pagination.value.hasNext) {
      await goToPage(pagination.value.page + 1)
    }
  }

  async function previousPage() {
    if (pagination.value.hasPrevious) {
      await goToPage(pagination.value.page - 1)
    }
  }

  /** Reset page to 1 without triggering a fetch (caller should call fetchProducts). */
  function resetPage() {
    pagination.value.page = 1
  }

  // ── Filter Actions ──────────────────────────────────────────────
  /** Set category filter and reset to page 1, then fetch. */
  async function setCategory(category: string) {
    filters.value.category = category
    resetPage()
    await fetchProducts()
  }

  /** Set brand filter and reset to page 1, then fetch. */
  async function setBrand(brand: string) {
    filters.value.brand = brand
    resetPage()
    await fetchProducts()
  }

  /** Set status filter and reset to page 1, then fetch. */
  async function setStatus(status: string) {
    filters.value.status = status
    resetPage()
    await fetchProducts()
  }

  /** Set sort options and reset to page 1, then fetch. */
  async function setSort(sort: string, direction: 'asc' | 'desc') {
    filters.value.sort = sort
    filters.value.sortDirection = direction
    resetPage()
    await fetchProducts()
  }

  /**
   * Update the search query and debounce the API call.
   * Resets to page 1 when search changes.
   */
  function setSearch(query: string) {
    filters.value.search = query
    if (_searchDebounceTimer) clearTimeout(_searchDebounceTimer)
    _searchDebounceTimer = setTimeout(async () => {
      resetPage()
      await fetchProducts()
    }, SEARCH_DEBOUNCE_MS)
  }

  /** Immediately apply a search query (no debounce, e.g. on Enter or clear). */
  async function applySearch(query: string) {
    if (_searchDebounceTimer) clearTimeout(_searchDebounceTimer)
    filters.value.search = query
    resetPage()
    await fetchProducts()
  }

  /** Reset all filters (search, category, brand, sort) and go to page 1. */
  async function resetFilters() {
    if (_searchDebounceTimer) clearTimeout(_searchDebounceTimer)
    filters.value = {
      search: '',
      category: '',
      brand: '',
      status: 'ACTIVE',
      sort: 'created_at',
      sortDirection: 'desc',
    }
    resetPage()
    await fetchProducts()
  }

  // ── Computed Helpers ────────────────────────────────────────────
  const showingFrom = computed(() => {
    if (pagination.value.total === 0) return 0
    return (pagination.value.page - 1) * pagination.value.pageSize + 1
  })

  const showingTo = computed(() => {
    return Math.min(pagination.value.page * pagination.value.pageSize, pagination.value.total)
  })

  const showingLabel = computed(() => {
    if (pagination.value.total === 0) return 'Showing 0 of 0 products'
    return `Showing ${showingFrom.value}–${showingTo.value} of ${pagination.value.total} products`
  })

  return {
    // State
    products,
    loading,
    error,
    errorMessage,
    pagination,
    filters,
    // Derived
    showingFrom,
    showingTo,
    showingLabel,
    // Actions
    fetchProducts,
    goToPage,
    nextPage,
    previousPage,
    resetPage,
    setCategory,
    setBrand,
    setStatus,
    setSort,
    setSearch,
    applySearch,
    resetFilters,
    // Offline Cache
    offlineCatalog,
  }
}
