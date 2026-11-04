/**
 * usePosSettings — Shared singleton for POS terminal settings, receipt templates,
 * and physical workstation device enrollment.
 *
 * Settings are persisted in localStorage under 'pos_terminal_settings' and are
 * reactive across the entire cashier front app (pos.vue, settings.vue, etc.)
 * using Nuxt's useState() so the same ref is shared without a Pinia store.
 */
import { normalizeTerminalId } from '~/composables/useCustomerDisplaySync'

const STORAGE_KEY = 'pos_terminal_settings'
const RECEIPT_TEMPLATE_STORAGE_KEY = 'pos_receipt_template'

export interface ReceiptCustomTemplate {
  store_name?: string
  tagline?: string
  phone?: string
  address?: string
  tax_id?: string
  paper_width?: '80mm' | '58mm'
  show_item_sku?: boolean
  show_variant_attrs?: boolean
  show_khr_conversion?: boolean
  show_tax_breakdown?: boolean
  show_cashier_name?: boolean
  show_customer_info?: boolean
  footer_message?: string
  return_policy?: string
  wifi_info?: string
  qr_content?: string
}

export interface PosTerminalSettings {
  terminalId: string
  terminalDbId?: string
  branchId?: string
  warehouseId?: string
  receiptStoreName: string
  paperWidth: '80mm' | '58mm'
  receiptFooterNote: string
  autoPrint: boolean
  soundBeep: boolean
  soundSuccess: boolean
  // Station Device Enrollment & Registration Lock (Task 1.4)
  deviceLockEnabled: boolean
  enrolledTerminalId?: string
  managerPin: string
  // Synchronized Receipt Template (Task 3.2)
  receiptTemplate?: ReceiptCustomTemplate
}

const DEFAULT_RECEIPT_TEMPLATE: ReceiptCustomTemplate = {
  store_name: 'VANNAK CLOTHING BOUTIQUE',
  tagline: 'Premium Streetwear & Contemporary Fashion',
  phone: '+855 23 888 999',
  address: '#123 Preah Norodom Blvd, Daun Penh, Phnom Penh',
  tax_id: 'K001-902348572',
  paper_width: '80mm',
  show_item_sku: true,
  show_variant_attrs: true,
  show_khr_conversion: true,
  show_tax_breakdown: true,
  show_cashier_name: true,
  show_customer_info: true,
  footer_message: 'THANK YOU FOR SHOPPING WITH US!',
  return_policy: 'Exchanges accepted within 7 days with original tag and receipt.',
  wifi_info: 'Guest Wi-Fi: Vannak_Store | Pass: fashion2026',
  qr_content: 'https://kimvannak.store',
}

const DEFAULTS: PosTerminalSettings = {
  terminalId: 'POS-01',
  terminalDbId: undefined,
  branchId: undefined,
  warehouseId: undefined,
  receiptStoreName: 'គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់',
  paperWidth: '80mm',
  receiptFooterNote: 'សូមអរគុណដែលបានគាំទ្រហាងរបស់យើង! សូមអញ្ជើញមកទិញម្តងទៀត។',
  autoPrint: false,
  soundBeep: true,
  soundSuccess: true,
  deviceLockEnabled: false,
  enrolledTerminalId: undefined,
  managerPin: '1234',
  receiptTemplate: { ...DEFAULT_RECEIPT_TEMPLATE },
}

export function usePosSettings() {
  // useState ensures one shared reactive instance across all components
  const settings = useState<PosTerminalSettings>('pos_terminal_settings', () => ({ ...DEFAULTS }))

  // ── Load from localStorage (client-only) ─────────────────────────
  function loadSettings() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: Partial<PosTerminalSettings> = JSON.parse(raw)
        settings.value = {
          ...DEFAULTS,
          ...parsed,
          autoPrint: false, // Enforce no auto-trigger print dialog
          terminalId: normalizeTerminalId(parsed.terminalId),
          receiptTemplate: {
            ...DEFAULT_RECEIPT_TEMPLATE,
            ...(parsed.receiptTemplate || {}),
          },
        }
      }

      // Check secondary receipt cache if available
      const rawReceipt = localStorage.getItem(RECEIPT_TEMPLATE_STORAGE_KEY)
      if (rawReceipt) {
        try {
          const parsedReceipt = JSON.parse(rawReceipt)
          settings.value.receiptTemplate = {
            ...settings.value.receiptTemplate,
            ...parsedReceipt,
          }
        } catch {}
      }
    } catch {
      // corrupted storage — use defaults
    }
  }

  // ── Persist to localStorage ────────────────────────────────────────
  function saveSettings() {
    if (!import.meta.client) return
    settings.value.terminalId = normalizeTerminalId(settings.value.terminalId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
    if (settings.value.receiptTemplate) {
      localStorage.setItem(RECEIPT_TEMPLATE_STORAGE_KEY, JSON.stringify(settings.value.receiptTemplate))
    }
  }

  // ── Synchronize Remote Store & Receipt Settings ────────────────────
  async function fetchRemoteSettings(settingsApi?: {
    getCategorySettings: (cat: string) => Promise<any>
    getStoreSettings: () => Promise<any>
  }) {
    if (!import.meta.client) return
    try {
      if (settingsApi) {
        const [receiptRes, storeRes] = await Promise.allSettled([
          settingsApi.getCategorySettings('receipt'),
          settingsApi.getStoreSettings(),
        ])

        if (receiptRes.status === 'fulfilled' && receiptRes.value && Object.keys(receiptRes.value).length > 0) {
          settings.value.receiptTemplate = {
            ...DEFAULT_RECEIPT_TEMPLATE,
            ...settings.value.receiptTemplate,
            ...receiptRes.value,
          }
          if (receiptRes.value.paper_width) {
            settings.value.paperWidth = receiptRes.value.paper_width
          }
          if (receiptRes.value.store_name) {
            settings.value.receiptStoreName = receiptRes.value.store_name
          }
          if (receiptRes.value.footer_message) {
            settings.value.receiptFooterNote = receiptRes.value.footer_message
          }
        }

        if (storeRes.status === 'fulfilled' && storeRes.value && Object.keys(storeRes.value).length > 0) {
          const s = storeRes.value
          if (s.name && !settings.value.receiptTemplate?.store_name) {
            settings.value.receiptStoreName = s.name
          }
          if (s.receipt_footer && !settings.value.receiptTemplate?.footer_message) {
            settings.value.receiptFooterNote = s.receipt_footer
          }
        }

        saveSettings()
      }
    } catch {
      // Fallback to local cached settings
    }
  }

  // ── Station Enrollment & Manager Authorization (Task 1.4) ──────────
  function verifyManagerPin(pin: string): boolean {
    const trimmed = (pin || '').trim()
    const activePin = (settings.value.managerPin || '1234').trim()
    return trimmed === activePin
  }

  function enrollDevice(terminalCode: string, managerPin?: string): void {
    const code = normalizeTerminalId(terminalCode)
    settings.value.terminalId = code
    settings.value.enrolledTerminalId = code
    settings.value.deviceLockEnabled = true
    if (managerPin?.trim()) {
      settings.value.managerPin = managerPin.trim()
    }
    saveSettings()
  }

  function unlockDevice(pin: string): boolean {
    if (!verifyManagerPin(pin)) {
      return false
    }
    settings.value.deviceLockEnabled = false
    saveSettings()
    return true
  }

  function setManagerPin(oldPin: string, newPin: string): boolean {
    if (!verifyManagerPin(oldPin)) {
      return false
    }
    if (!newPin || newPin.trim().length < 4) {
      return false
    }
    settings.value.managerPin = newPin.trim()
    saveSettings()
    return true
  }

  // ── Auto-print trigger ─────────────────────────────────────────────
  function triggerAutoPrint(_delayMs = 300) {
    // Intentionally no-op: never auto-trigger browser print dialog
    return
  }

  return {
    settings,
    loadSettings,
    saveSettings,
    fetchRemoteSettings,
    verifyManagerPin,
    enrollDevice,
    unlockDevice,
    setManagerPin,
    triggerAutoPrint,
  }
}
