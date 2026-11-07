import { useState } from '#imports'
import { useSystemSettingsApi } from '~/composables/useApi'

export interface StickerTemplateConfig {
  paper_size: string
  label_width_mm: number
  label_height_mm: number
  columns: number
  code_type: 'BARCODE' | 'QR'
  store_header: string
  show_store_header: boolean
  show_product_name: boolean
  show_sku: boolean
  show_variant_attrs: boolean
  show_price_usd: boolean
  show_khr: boolean
  khr_exchange_rate: number
  footer_note: string
  default_copies: number
}

export const DEFAULT_STICKER_TEMPLATE: StickerTemplateConfig = {
  paper_size: 'THERMAL_50x30',
  label_width_mm: 50,
  label_height_mm: 30,
  columns: 1,
  code_type: 'BARCODE',
  store_header: 'គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់',
  show_store_header: true,
  show_product_name: true,
  show_sku: true,
  show_variant_attrs: true,
  show_price_usd: true,
  show_khr: true,
  khr_exchange_rate: 4100,
  footer_note: '',
  default_copies: 1,
}

const STORAGE_KEY = 'store_sticker_template'

export function useStickerTemplate() {
  const stickerTemplate = useState<StickerTemplateConfig>('global_sticker_template', () => ({
    ...DEFAULT_STICKER_TEMPLATE,
  }))
  const isLoaded = useState<boolean>('global_sticker_template_loaded', () => false)
  const loading = useState<boolean>('global_sticker_template_loading', () => false)

  async function loadStickerTemplate(force = false) {
    if (!import.meta.client) return stickerTemplate.value

    if (!force && !isLoaded.value) {
      try {
        const cached = localStorage.getItem(STORAGE_KEY)
        if (cached) {
          stickerTemplate.value = {
            ...DEFAULT_STICKER_TEMPLATE,
            ...JSON.parse(cached),
          }
        }
      } catch {
        // ignore cache error
      }
    }

    if (isLoaded.value && !force) return stickerTemplate.value

    loading.value = true
    try {
      const settingsApi = useSystemSettingsApi()
      let data: any = null
      try {
        data = await settingsApi.getPublicStickerSettings()
      } catch {
        try {
          data = await settingsApi.getStickerSettings()
        } catch {
          // ignore
        }
      }
      if (data && typeof data === 'object') {
        stickerTemplate.value = {
          ...DEFAULT_STICKER_TEMPLATE,
          ...stickerTemplate.value,
          ...data,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stickerTemplate.value))
      }
    } catch {
      // Fallback to cached or default
    } finally {
      isLoaded.value = true
      loading.value = false
    }
    return stickerTemplate.value
  }

  return {
    stickerTemplate,
    isLoaded,
    loading,
    loadStickerTemplate,
    defaultStickerTemplate: DEFAULT_STICKER_TEMPLATE,
  }
}

