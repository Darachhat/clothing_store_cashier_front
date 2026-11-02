/**
 * usePosSettings — Shared singleton for POS terminal settings.
 *
 * Settings are persisted in localStorage under 'pos_terminal_settings' and are
 * reactive across the entire cashier front app (pos.vue, settings.vue, etc.)
 * using Nuxt's useState() so the same ref is shared without a Pinia store.
 */
import { normalizeTerminalId } from '~/composables/useCustomerDisplaySync'
import { printWithKhmerFonts } from '~/composables/useKhmerPrint'

const STORAGE_KEY = 'pos_terminal_settings'

export interface PosTerminalSettings {
  terminalId: string
  receiptStoreName: string
  paperWidth: '80mm' | '58mm'
  receiptFooterNote: string
  autoPrint: boolean
  soundBeep: boolean
  soundSuccess: boolean
}

const DEFAULTS: PosTerminalSettings = {
  terminalId: 'REG-01',
  receiptStoreName: 'ហាងលក់សម្លៀកបំពាក់ ភ្នំពេញ',
  paperWidth: '80mm',
  receiptFooterNote: 'សូមអរគុណដែលបានគាំទ្រហាងរបស់យើង! សូមអញ្ជើញមកទិញម្តងទៀត។',
  autoPrint: false,
  soundBeep: true,
  soundSuccess: true,
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
        }
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
  }

  // ── Auto-print trigger ─────────────────────────────────────────────
  /**
   * Auto-print is disabled to prevent blocking browser print dialogs.
   * Cashiers review the receipt on screen and print manually when desired.
   */
  function triggerAutoPrint(_delayMs = 300) {
    // Intentionally no-op: never auto-trigger browser print dialog
    return
  }

  return {
    settings,
    loadSettings,
    saveSettings,
    triggerAutoPrint,
  }
}
