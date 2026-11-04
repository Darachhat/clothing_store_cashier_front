import type { Ref } from 'vue'
import type { ProductVariant } from '~/types/index'
import { usePosAudio } from './usePosAudio'
import { usePosOfflineCatalog } from './usePosOfflineCatalog'

export interface BarcodeLookupContext {
  allVariants: Ref<ProductVariant[]>
  getVariantStock: (variantId: string) => number
  getLineStock: (variantId: string) => number | null
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
  const { searchByBarcode, searchBySku, searchByQr } = useProductApi()
  const { playBeep, playError } = usePosAudio()
  const offlineCatalog = usePosOfflineCatalog()

  let lastProcessedCode = ''
  let lastProcessedAt = 0

  /**
   * Helper to handle successful variant addition to cart with audio & toast.
   */
  function handleVariantMatch(variant: ProductVariant, sourceLabel = 'Item Scanned'): boolean {
    const stock = ctx.getVariantStock(variant.id)
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
   * Debounces duplicate scans within 600ms.
   *
   * @param rawCode - The raw barcode or SKU string.
   * @returns true if product was found and added to cart, false otherwise.
   */
  async function processBarcode(rawCode: string): Promise<boolean> {
    const code = rawCode.trim()
    if (!code) return false

    // Debounce duplicate scans within 600ms
    const now = Date.now()
    if (code === lastProcessedCode && now - lastProcessedAt < 600) {
      return false
    }
    lastProcessedCode = code
    lastProcessedAt = now

    // 1. Direct search in current in-memory variants (fast path for active page)
    const directMatch = ctx.allVariants.value.find(
      (v) =>
        v.barcode?.toLowerCase() === code.toLowerCase() ||
        v.sku?.toLowerCase() === code.toLowerCase() ||
        (v as any).qr_reference?.toLowerCase() === code.toLowerCase(),
    )

    if (directMatch) {
      return handleVariantMatch(directMatch, 'Item Scanned')
    }

    // 2. Offline Resilient Search (IndexedDB / memory catalog cache)
    try {
      const offlineMatch = await offlineCatalog.findVariantByCode(code)
      if (offlineMatch) {
        return handleVariantMatch(offlineMatch, 'Item Scanned (Offline Cache)')
      }
    } catch {
      // Continue to API search if offline check threw
    }

    // 3. Query backend by barcode/sku/qr in parallel (when connected)
    try {
      const lookups = [
        searchByBarcode(code).catch(() => null),
        searchBySku(code).catch(() => null),
        searchByQr(code).catch(() => null),
      ]

      const results = await Promise.all(lookups)
      const result: any = results.find((r) => r !== null)

      if (result) {
        // Save into offline cache for future instant offline lookups
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
