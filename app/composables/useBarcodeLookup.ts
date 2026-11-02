import type { Ref } from 'vue'
import type { ProductVariant } from '~/types/index'
import { usePosAudio } from './usePosAudio'

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
 * image decoding, and manual barcode entry.
 */
export function useBarcodeLookup(ctx: BarcodeLookupContext) {
  const { searchByBarcode, searchBySku, searchByQr } = useProductApi()
  const { playBeep, playError } = usePosAudio()

  let lastProcessedCode = ''
  let lastProcessedAt = 0

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

    // 1. Direct search in current in-memory variants (fast path)
    const directMatch = ctx.allVariants.value.find(
      (v) =>
        v.barcode?.toLowerCase() === code.toLowerCase() ||
        v.sku?.toLowerCase() === code.toLowerCase() ||
        v.qr_reference?.toLowerCase() === code.toLowerCase(),
    )

    if (directMatch) {
      const stock = ctx.getVariantStock(directMatch.id)
      if (stock <= 0) {
        playError(true)
        ctx.toast?.add({
          title: 'Out of Stock',
          description: `Item ${directMatch.sku} has no stock`,
          color: 'red',
        })
        return false
      }
      const res = ctx.posStore.addVariant(directMatch, 1, stock)
      playBeep(ctx.soundBeep?.value ?? true)
      ctx.toast?.add({
        title: 'Item Scanned',
        description: `${directMatch.product?.name || 'Product'} (${directMatch.sku})`,
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

    // 2. Query backend by barcode/sku/qr in parallel
    try {
      const lookups = [
        searchByBarcode(code).catch(() => null),
        searchBySku(code).catch(() => null),
        searchByQr(code).catch(() => null),
      ]

      const results = await Promise.all(lookups)
      const result: any = results.find((r) => r !== null)

      if (result) {
        const stock = ctx.getVariantStock(result.id)
        if (ctx.getLineStock(result.id) !== null && stock <= 0) {
          playError(true)
          ctx.toast?.add({
            title: 'Out of Stock',
            description: `Item ${result.sku} has no stock`,
            color: 'red',
          })
          return false
        }
        const res = ctx.posStore.addVariant(result, 1, stock)
        playBeep(ctx.soundBeep?.value ?? true)
        ctx.toast?.add({
          title: 'Item Found & Added',
          description: `${result.product?.name || 'Product'} (${result.sku})`,
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
