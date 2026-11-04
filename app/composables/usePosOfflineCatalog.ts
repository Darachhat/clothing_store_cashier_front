/**
 * usePosOfflineCatalog — Resilient Local Offline Product & Barcode Cache (IndexedDB).
 *
 * Provides instant sub-millisecond barcode & SKU lookups even during network drops
 * or high-latency store connectivity.
 */

import type { Product, ProductVariant } from '~/types/index'

const DB_NAME = 'pos_offline_cache'
const DB_VERSION = 1
const STORE_VARIANTS = 'variants'
const STORE_META = 'meta'

// In-memory fallback if IndexedDB is not supported or restricted (e.g. tests / SSR)
const memoryVariantsMap = new Map<string, ProductVariant>()
let memoryLastSynced: string | null = null

function getIndexedDB(): IDBFactory | null {
  if (typeof window !== 'undefined' && window.indexedDB) {
    return window.indexedDB
  }
  return null
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const idb = getIndexedDB()
    if (!idb) {
      return reject(new Error('IndexedDB is not available'))
    }

    const request = idb.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Store: variants
      if (!db.objectStoreNames.contains(STORE_VARIANTS)) {
        const store = db.createObjectStore(STORE_VARIANTS, { keyPath: 'id' })
        store.createIndex('barcode', 'barcode', { unique: false })
        store.createIndex('sku', 'sku', { unique: false })
        store.createIndex('qr_reference', 'qr_reference', { unique: false })
      }

      // Store: metadata
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function usePosOfflineCatalog() {
  const isSyncing = ref(false)
  const cachedCount = ref(0)
  const lastSyncTime = ref<string | null>(null)

  /**
   * Save an array of variants into IndexedDB and memory fallback.
   */
  async function saveVariants(variants: ProductVariant[]): Promise<number> {
    if (!variants || variants.length === 0) return 0

    // Update in-memory fallback
    for (const v of variants) {
      if (v?.id) {
        memoryVariantsMap.set(v.id, { ...v })
      }
    }

    const idb = getIndexedDB()
    if (!idb) {
      cachedCount.value = memoryVariantsMap.size
      return variants.length
    }

    try {
      const db = await openDatabase()
      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_VARIANTS, STORE_META], 'readwrite')
        const variantStore = tx.objectStore(STORE_VARIANTS)
        const metaStore = tx.objectStore(STORE_META)

        for (const v of variants) {
          if (v && v.id) {
            variantStore.put(v)
          }
        }

        const now = new Date().toISOString()
        metaStore.put({ key: 'last_synced_at', value: now })
        metaStore.put({ key: 'cached_count', value: memoryVariantsMap.size })

        tx.oncomplete = () => {
          lastSyncTime.value = now
          updateCachedCount().catch(() => {})
          resolve(variants.length)
        }

        tx.onerror = () => reject(tx.error)
      })
    } catch {
      cachedCount.value = memoryVariantsMap.size
      return variants.length
    }
  }

  /**
   * Extract variants from products and cache them with parent product data.
   */
  async function syncProducts(products: Product[]): Promise<number> {
    if (!products || products.length === 0) return 0

    const variantsToStore: ProductVariant[] = []

    for (const p of products) {
      const variants = (p as any).variants || []
      for (const v of variants) {
        // Attach parent product context so cart displays name, image, category properly
        const enrichedVariant: ProductVariant = {
          ...v,
          product_id: p.id,
          product: {
            id: p.id,
            name: p.name,
            code: (p as any).code || (p as any).sku,
            category: (p as any).category,
            brand: (p as any).brand,
            images: (p as any).images || [],
          } as any,
        }
        variantsToStore.push(enrichedVariant)
      }
    }

    return saveVariants(variantsToStore)
  }

  /**
   * Fast offline lookup by barcode, SKU, or QR reference.
   * Checks in-memory cache first, then IndexedDB store.
   */
  async function findVariantByCode(rawCode: string): Promise<ProductVariant | null> {
    const code = rawCode.trim().toLowerCase()
    if (!code) return null

    // 1. Check in-memory fallback
    for (const v of memoryVariantsMap.values()) {
      if (
        v.barcode?.toLowerCase() === code ||
        v.sku?.toLowerCase() === code ||
        (v as any).qr_reference?.toLowerCase() === code
      ) {
        return v
      }
    }

    // 2. Query IndexedDB if available
    const idb = getIndexedDB()
    if (!idb) return null

    try {
      const db = await openDatabase()
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_VARIANTS, 'readonly')
        const store = tx.objectStore(STORE_VARIANTS)

        // Try barcode index first
        const barcodeIndex = store.index('barcode')
        const reqBarcode = barcodeIndex.get(rawCode.trim())

        reqBarcode.onsuccess = () => {
          if (reqBarcode.result) {
            // Update memory cache
            memoryVariantsMap.set(reqBarcode.result.id, reqBarcode.result)
            return resolve(reqBarcode.result)
          }

          // Try SKU index
          const skuIndex = store.index('sku')
          const reqSku = skuIndex.get(rawCode.trim())

          reqSku.onsuccess = () => {
            if (reqSku.result) {
              memoryVariantsMap.set(reqSku.result.id, reqSku.result)
              return resolve(reqSku.result)
            }

            // Fallback: cursor scan case-insensitive
            const cursorReq = store.openCursor()
            cursorReq.onsuccess = (e: any) => {
              const cursor = e.target.result
              if (cursor) {
                const item = cursor.value
                if (
                  item.barcode?.toLowerCase() === code ||
                  item.sku?.toLowerCase() === code ||
                  item.qr_reference?.toLowerCase() === code
                ) {
                  memoryVariantsMap.set(item.id, item)
                  return resolve(item)
                }
                cursor.continue()
              } else {
                resolve(null)
              }
            }
            cursorReq.onerror = () => resolve(null)
          }
          reqSku.onerror = () => resolve(null)
        }
        reqBarcode.onerror = () => resolve(null)
      })
    } catch {
      return null
    }
  }

  /**
   * Refresh the count of cached variants.
   */
  async function updateCachedCount(): Promise<number> {
    const idb = getIndexedDB()
    if (!idb) {
      cachedCount.value = memoryVariantsMap.size
      return cachedCount.value
    }

    try {
      const db = await openDatabase()
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_VARIANTS, 'readonly')
        const store = tx.objectStore(STORE_VARIANTS)
        const req = store.count()

        req.onsuccess = () => {
          cachedCount.value = req.result
          resolve(req.result)
        }
        req.onerror = () => {
          cachedCount.value = memoryVariantsMap.size
          resolve(cachedCount.value)
        }
      })
    } catch {
      cachedCount.value = memoryVariantsMap.size
      return cachedCount.value
    }
  }

  /**
   * Background fetch of all active products to hydrate offline cache.
   */
  async function prefetchFullCatalog(fetchFn?: (params: any) => Promise<any>): Promise<number> {
    if (isSyncing.value) return cachedCount.value
    isSyncing.value = true

    try {
      let productsList: Product[] = []
      if (fetchFn) {
        const res = await fetchFn({
          page: 1,
          page_size: 100,
          status: 'ACTIVE',
          include_variants: true,
        })
        productsList = Array.isArray(res) ? res : (res?.items || res?.data || [])
      }

      if (productsList.length > 0) {
        await syncProducts(productsList)
      }
      await updateCachedCount()
      return cachedCount.value
    } catch {
      return cachedCount.value
    } finally {
      isSyncing.value = false
    }
  }

  /**
   * Clear all cached offline data.
   */
  async function clearCache(): Promise<void> {
    memoryVariantsMap.clear()
    cachedCount.value = 0
    lastSyncTime.value = null

    const idb = getIndexedDB()
    if (!idb) return

    try {
      const db = await openDatabase()
      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_VARIANTS, STORE_META], 'readwrite')
        tx.objectStore(STORE_VARIANTS).clear()
        tx.objectStore(STORE_META).clear()
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    } catch {}
  }

  return {
    isSyncing,
    cachedCount,
    lastSyncTime,
    saveVariants,
    syncProducts,
    findVariantByCode,
    updateCachedCount,
    prefetchFullCatalog,
    clearCache,
  }
}

