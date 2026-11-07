import type { Ref } from 'vue'
import type { ProductVariant } from '~/types/index'
import { normalizeScannedCode } from '~/utils/scanCode'
import { usePosAudio } from './usePosAudio'
import { usePosOfflineCatalog } from './usePosOfflineCatalog'

export interface BarcodeLookupContext {
  allVariants: Ref<ProductVariant[]>
  getVariantStock: (variantId: string) => number
  getLineStock: (variantId: string) => number | null
  setVariantStock?: (variantId: string, stock: number) => void
  onProductMatched?: (product: any) => void
  posStore: ReturnType<typeof usePosStore>
  soundBeep?: Ref<boolean>
  toast?: any
}

/**
 * useBarcodeLookup
 *
 * Unified product lookup pipeline for hardware scanners, camera scanning,
 * image decoding, and manual barcode entry with offline resilient caching.
 */
export function useBarcodeLookup(ctx: BarcodeLookupContext) {
  const { scanCode, searchByBarcode, searchBySku, searchByQr } = useProductApi()
  const { playBeep, playError } = usePosAudio()
  const offlineCatalog = usePosOfflineCatalog()

  let lastProcessedCode = ''
  let lastProcessedAt = 0

  /**
   * Helper to handle successful variant addition to cart with audio & toast.
   */
  function handleVariantMatch(variant: ProductVariant, sourceLabel = 'Item Scanned', freshStock?: number): boolean {
    if (typeof freshStock === 'number' && ctx.setVariantStock) {
      ctx.setVariantStock(variant.id, freshStock)
    }
    const stock = typeof freshStock === 'number' ? freshStock : ctx.getVariantStock(variant.id)
    if (ctx.getLineStock(variant.id) !== null && stock <= 0) {
      playError(true)
      ctx.toast?.add({
        title: 'Out of Stock',
        description: `Item ${variant.sku} has no stock`,
        color: 'red',
      })
      return false
    }

    const res = ctx.posStore.addVariant(variant, 1, stock)
    playBeep(ctx.soundBeep?.value ?? true)
    ctx.toast?.add({
      title: sourceLabel,
      description: `${(variant as any).product?.name || 'Product'} (${variant.sku})`,
      color: 'green',
    })
    if (res?.reachedLimit) {
      ctx.toast?.add({
        title: 'Stock Limit',
        description: `Reached warehouse stock limit of ${stock}`,
        color: 'amber',
      })
    }
    return true
  }

  /**
   * Process a scanned or typed barcode/SKU/QR string.
   * Normalizes URLs (/p/VAR-xxxxx), strips control characters, and debounces duplicate scans within 600ms.
   *
   * @param rawCode - The raw barcode, QR URL, QR reference, SKU, or Product Code string.
   * @returns true if product/variant was found and handled, false otherwise.
   */
  async function processBarcode(rawCode: string): Promise<boolean> {
    const code = normalizeScannedCode(rawCode)
    if (!code) return false

    // Debounce duplicate scans within 600ms
    const now = Date.now()
    if (code.toLowerCase() === lastProcessedCode.toLowerCase() && now - lastProcessedAt < 600) {
      return false
    }
    lastProcessedCode = code
    lastProcessedAt = now

    const codeLower = code.toLowerCase()

    // 1. Direct search in current in-memory variants (fast path for active page)
    const directMatch = ctx.allVariants.value.find(
      (v) =>
        v.barcode?.toLowerCase() === codeLower ||
        v.sku?.toLowerCase() === codeLower ||
        (v as any).qr_reference?.toLowerCase() === codeLower,
    )

    if (directMatch && ctx.getLineStock(directMatch.id) !== null && ctx.getVariantStock(directMatch.id) > 0) {
      return handleVariantMatch(directMatch, 'Item Scanned')
    }

    // 2. Unified single-roundtrip backend scan lookup (matches barcode, SKU, QR ref, or Product code + fresh stock)
    try {
      const scanRes = await scanCode(code, ctx.posStore.warehouseId || undefined)
      if (scanRes) {
        if (scanRes.match_type === 'variant' && scanRes.variant) {
          offlineCatalog.saveVariants([scanRes.variant]).catch(() => {})
          return handleVariantMatch(scanRes.variant, 'Item Scanned', scanRes.total_stock)
        }
        if (scanRes.match_type === 'product' && scanRes.product) {
          if (Array.isArray(scanRes.variants)) {
            offlineCatalog.saveVariants(scanRes.variants).catch(() => {})
          }
          playBeep(ctx.soundBeep?.value ?? true)
          if (ctx.onProductMatched) {
            ctx.onProductMatched({
              ...scanRes.product,
              variants: scanRes.variants || scanRes.product.variants || [],
            })
            return true
          }
        }
      }
    } catch {
      // Fallback to offline cache or legacy endpoints below
    }

    // 3. If direct match was found in memory (even if stock wasn't known in inventoryMap yet)
    if (directMatch) {
      return handleVariantMatch(directMatch, 'Item Scanned')
    }

    // 4. Offline Resilient Search (IndexedDB / memory catalog cache)
    try {
      const offlineMatch = await offlineCatalog.findVariantByCode(code)
      if (offlineMatch) {
        return handleVariantMatch(offlineMatch, 'Item Scanned (Offline Cache)')
      }
    } catch {
      // Continue to legacy fallback
    }

    // 5. Legacy fallback parallel lookup
    try {
      const results = await Promise.all([
        searchByBarcode(code).catch(() => null),
        searchBySku(code).catch(() => null),
        searchByQr(code).catch(() => null),
      ])
      const result: any = results.find((r) => r !== null)
      if (result) {
        offlineCatalog.saveVariants([result]).catch(() => {})
        return handleVariantMatch(result, 'Item Found & Added')
      }
      return false
    } catch {
      playError(true)
      ctx.toast?.add({
        title: 'Scan query failed',
        description: 'Network error while querying barcode.',
        color: 'red',
      })
      return false
    }
  }

  return {
    processBarcode,
  }
}
