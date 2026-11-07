import { computed } from 'vue'
import { useState } from '#imports'
import { useSystemSettingsApi } from '~/composables/useApi'

export interface BrandProfile {
  store_name: string
  store_name_kh: string
  tagline?: string
  tagline_kh?: string
  logo_url?: string
  logo_dark_url?: string
  favicon_url?: string
  phone?: string
  email?: string
  address?: string
  tax_id?: string
  website_url?: string
  receipt_footer?: string
  return_policy?: string
}

export const DEFAULT_BRAND_PROFILE: BrandProfile = {
  store_name: 'KIM VANNAK CLOTHING',
  store_name_kh: 'គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់',
  tagline: 'Premium Streetwear & Contemporary Fashion',
  tagline_kh: 'សម្លៀកបំពាក់ទាន់សម័យ និងគុណភាពខ្ពស់',
  logo_url: '',
  logo_dark_url: '',
  favicon_url: '',
  phone: '+855 23 888 999',
  email: 'store@kimvannak.store',
  address: '#123 Preah Norodom Blvd, Daun Penh, Phnom Penh',
  tax_id: 'K001-902348572',
  website_url: 'https://kimvannak.store',
  receipt_footer: 'THANK YOU FOR SHOPPING WITH US!\nសូមអរគុណដែលបានគាំទ្រហាងយើងខ្ញុំ!',
  return_policy: 'ទំនិញទិញរួចមិនអាចប្តូរប្រាក់វិញបានទេ (Exchange within 7 days with tag/receipt)',
}

const STORAGE_KEY = 'store_brand_profile'

export function useBrand() {
  const brand = useState<BrandProfile>('global_brand_profile', () => ({
    ...DEFAULT_BRAND_PROFILE,
  }))
  const isLoaded = useState<boolean>('global_brand_loaded', () => false)
  const loading = useState<boolean>('global_brand_loading', () => false)

  async function loadBrand(force = false) {
    if (!import.meta.client) return

    // Read cache first for instant paint
    if (!force && !isLoaded.value) {
      try {
        const cached = localStorage.getItem(STORAGE_KEY)
        if (cached) {
          brand.value = {
            ...DEFAULT_BRAND_PROFILE,
            ...JSON.parse(cached),
          }
        }
      } catch {
        // ignore cache JSON errors
      }
    }

    if (isLoaded.value && !force) return

    loading.value = true
    try {
      const settingsApi = useSystemSettingsApi()
      let data: any = null

      try {
        data = await settingsApi.getPublicBrandSettings()
      } catch {
        const hasToken =
          typeof window !== 'undefined' &&
          !!(localStorage.getItem('cashier_access_token') || localStorage.getItem('access_token'))
        if (hasToken) {
          try {
            data = await settingsApi.getBrandSettings()
          } catch {
            // ignore
          }
        }
      }

      if (data && typeof data === 'object') {
        brand.value = {
          ...DEFAULT_BRAND_PROFILE,
          ...brand.value,
          ...data,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(brand.value))
      }
    } catch (err) {
      console.warn('Could not load remote brand settings, using fallback/cached brand:', err)
    } finally {
      isLoaded.value = true
      loading.value = false
    }
  }

  const displayName = computed(() => {
    return brand.value.store_name?.trim() || DEFAULT_BRAND_PROFILE.store_name
  })

  const displayNameKh = computed(() => {
    return brand.value.store_name_kh?.trim() || DEFAULT_BRAND_PROFILE.store_name_kh
  })

  return {
    brand,
    isLoaded,
    loading,
    loadBrand,
    displayName,
    displayNameKh,
    defaultBrand: DEFAULT_BRAND_PROFILE,
  }
}
