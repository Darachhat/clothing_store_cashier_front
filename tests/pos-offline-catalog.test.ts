import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

/**
 * Offline Catalog Cache simulation matching usePosOfflineCatalog.ts logic
 */
class OfflineCatalogSimulator {
  variantsMap = new Map<string, any>()
  lastSyncedAt: string | null = null

  async saveVariants(variants: any[]): Promise<number> {
    for (const v of variants) {
      if (v?.id) {
        this.variantsMap.set(v.id, { ...v })
      }
    }
    this.lastSyncedAt = new Date().toISOString()
    return variants.length
  }

  async syncProducts(products: any[]): Promise<number> {
    const variants: any[] = []
    for (const p of products) {
      for (const v of p.variants || []) {
        variants.push({
          ...v,
          product_id: p.id,
          product: {
            id: p.id,
            name: p.name,
            code: p.code || p.sku,
            category: p.category,
            brand: p.brand,
          },
        })
      }
    }
    return this.saveVariants(variants)
  }

  async findVariantByCode(rawCode: string): Promise<any | null> {
    const code = rawCode.trim().toLowerCase()
    if (!code) return null

    for (const v of this.variantsMap.values()) {
      if (
        v.barcode?.toLowerCase() === code ||
        v.sku?.toLowerCase() === code ||
        v.qr_reference?.toLowerCase() === code
      ) {
        return v
      }
    }
    return null
  }

  getCachedCount(): number {
    return this.variantsMap.size
  }

  clear(): void {
    this.variantsMap.clear()
    this.lastSyncedAt = null
  }
}

/**
 * Scanner Lookup Pipeline matching useBarcodeLookup.ts with offline fallback
 */
class BarcodeLookupPipelineSimulator {
  activePageVariants: any[]
  offlineCatalog: OfflineCatalogSimulator
  mockApi: { searchByBarcode: (code: string) => Promise<any> }
  cart: any[]

  constructor(
    activePageVariants: any[],
    offlineCatalog: OfflineCatalogSimulator,
    mockApi: { searchByBarcode: (code: string) => Promise<any> },
    cart: any[] = [],
  ) {
    this.activePageVariants = activePageVariants
    this.offlineCatalog = offlineCatalog
    this.mockApi = mockApi
    this.cart = cart
  }

  async processBarcode(code: string): Promise<{ success: boolean; source: string; item?: any }> {
    const trimmed = code.trim()
    if (!trimmed) return { success: false, source: 'none' }

    // 1. In-memory active page check
    const pageMatch = this.activePageVariants.find(
      (v) =>
        v.barcode?.toLowerCase() === trimmed.toLowerCase() ||
        v.sku?.toLowerCase() === trimmed.toLowerCase(),
    )
    if (pageMatch) {
      this.cart.push(pageMatch)
      return { success: true, source: 'active_page', item: pageMatch }
    }

    // 2. Offline resilient cache check
    const offlineMatch = await this.offlineCatalog.findVariantByCode(trimmed)
    if (offlineMatch) {
      this.cart.push(offlineMatch)
      return { success: true, source: 'offline_cache', item: offlineMatch }
    }

    // 3. Remote API check
    try {
      const apiResult = await this.mockApi.searchByBarcode(trimmed)
      if (apiResult) {
        await this.offlineCatalog.saveVariants([apiResult])
        this.cart.push(apiResult)
        return { success: true, source: 'remote_api', item: apiResult }
      }
    } catch {
      // Network failure
    }

    return { success: false, source: 'not_found' }
  }

  getCart(): any[] {
    return this.cart
  }
}

describe('POS Offline Catalog & Resilient Barcode Scanning', () => {
  let catalog: OfflineCatalogSimulator

  beforeEach(() => {
    catalog = new OfflineCatalogSimulator()
  })

  it('correctly ingests products and flattens variants with attached product metadata', async () => {
    const products = [
      {
        id: 'prod-1',
        name: 'Classic Linen Shirt',
        code: 'CLS-001',
        category: { id: 'cat-1', name: 'Shirts' },
        variants: [
          { id: 'v-1', sku: 'CLS-WHITE-M', barcode: '885001234567', price: 29.99, size: 'M', color: 'White' },
          { id: 'v-2', sku: 'CLS-WHITE-L', barcode: '885001234568', price: 29.99, size: 'L', color: 'White' },
        ],
      },
      {
        id: 'prod-2',
        name: 'Slim Chino Pants',
        code: 'SCP-002',
        category: { id: 'cat-2', name: 'Pants' },
        variants: [
          { id: 'v-3', sku: 'SCP-NAVY-32', barcode: '885009876543', price: 45.00, size: '32', color: 'Navy' },
        ],
      },
    ]

    const savedCount = await catalog.syncProducts(products)
    assert.strictEqual(savedCount, 3)
    assert.strictEqual(catalog.getCachedCount(), 3)
    assert.ok(catalog.lastSyncedAt !== null)

    // Lookup by barcode
    const matchBarcode = await catalog.findVariantByCode('885001234567')
    assert.ok(matchBarcode)
    assert.strictEqual(matchBarcode.sku, 'CLS-WHITE-M')
    assert.strictEqual(matchBarcode.product.name, 'Classic Linen Shirt')

    // Lookup by SKU
    const matchSku = await catalog.findVariantByCode('SCP-NAVY-32')
    assert.ok(matchSku)
    assert.strictEqual(matchSku.id, 'v-3')
    assert.strictEqual(matchSku.price, 45.00)
  })

  it('scans barcodes from offline cache when server is completely unreachable', async () => {
    // Populate offline cache
    await catalog.saveVariants([
      {
        id: 'v-offline-1',
        sku: 'OFFLINE-HOODIE',
        barcode: '999123456789',
        price: 35.00,
        product: { name: 'Fleece Hoodie' },
      },
    ])

    // Active page has no items (e.g. empty or on a different category page)
    const activePageVariants: any[] = []

    // Remote API is completely down/throwing network error
    const offlineMockApi = {
      searchByBarcode: async () => {
        throw new Error('TypeError: Failed to fetch (Network disconnected)')
      },
    }

    const pipeline = new BarcodeLookupPipelineSimulator(activePageVariants, catalog, offlineMockApi)

    // Attempt scan with dead network
    const result = await pipeline.processBarcode('999123456789')
    assert.strictEqual(result.success, true)
    assert.strictEqual(result.source, 'offline_cache')
    assert.strictEqual(result.item.sku, 'OFFLINE-HOODIE')
    assert.strictEqual(pipeline.getCart().length, 1)
  })

  it('caches remote API results so subsequent scans work offline', async () => {
    const activePageVariants: any[] = []
    let networkAvailable = true

    const flakyApi = {
      searchByBarcode: async (code: string) => {
        if (!networkAvailable) throw new Error('Offline')
        if (code === '777123') {
          return { id: 'v-fresh', sku: 'FRESH-DENIM', barcode: '777123', price: 50.00 }
        }
        return null
      },
    }

    const pipeline = new BarcodeLookupPipelineSimulator(activePageVariants, catalog, flakyApi)

    // 1. Initial scan with working network -> fetches from API and caches
    const res1 = await pipeline.processBarcode('777123')
    assert.strictEqual(res1.success, true)
    assert.strictEqual(res1.source, 'remote_api')
    assert.strictEqual(catalog.getCachedCount(), 1)

    // 2. Cut off network
    networkAvailable = false

    // 3. Second scan -> resolves from offline cache without touching network!
    const res2 = await pipeline.processBarcode('777123')
    assert.strictEqual(res2.success, true)
    assert.strictEqual(res2.source, 'offline_cache')
    assert.strictEqual(res2.item.sku, 'FRESH-DENIM')
  })

  it('performs case-insensitive and trimmed barcode/SKU lookups', async () => {
    await catalog.saveVariants([
      { id: 'v-mixed', sku: 'Khmer-Silk-Scarf', barcode: 'BAR-001-KHM', price: 15.00 },
    ])

    const matchLower = await catalog.findVariantByCode('  khmer-silk-scarf  ')
    assert.ok(matchLower)
    assert.strictEqual(matchLower.id, 'v-mixed')

    const matchBarcodeLower = await catalog.findVariantByCode('bar-001-khm')
    assert.ok(matchBarcodeLower)
    assert.strictEqual(matchBarcodeLower.sku, 'Khmer-Silk-Scarf')
  })
})
