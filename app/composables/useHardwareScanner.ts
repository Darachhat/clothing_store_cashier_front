import { onMounted, onUnmounted, ref } from 'vue'

export interface HardwareScannerOptions {
  /** Maximum interval in ms between keystrokes to be considered scanner burst input (default: 50ms) */
  maxIntervalMs?: number
  /** Minimum length of scanned barcode (default: 3) */
  minBarcodeLength?: number
  /** Allowed suffixes/terminators that trigger barcode emission (default: ['Enter', 'Tab']) */
  terminators?: string[]
  /** Whether to listen when user is typing in regular text inputs (default: false) */
  allowInInputs?: boolean
  /** Callback invoked on successful barcode scan */
  onScan: (barcode: string) => void
}

/**
 * useHardwareScanner
 *
 * Captures fast burst keyboard inputs from USB & Bluetooth HID barcode scanners.
 * Differentiates between human typing and hardware scanner bursts.
 */
export function useHardwareScanner(options: HardwareScannerOptions) {
  const {
    maxIntervalMs = 50,
    minBarcodeLength = 3,
    terminators = ['Enter', 'Tab'],
    allowInInputs = false,
    onScan,
  } = options

  const isScanning = ref(false)
  let buffer = ''
  let lastKeyTime = 0

  function isInputElement(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false
    const tagName = target.tagName.toLowerCase()
    if (tagName === 'textarea' || target.isContentEditable) return true
    if (tagName === 'input') {
      const input = target as HTMLInputElement
      const type = input.type.toLowerCase()
      // File, checkbox, radio, button are not text typing
      return !['button', 'checkbox', 'radio', 'file', 'submit', 'reset'].includes(type)
    }
    return false
  }

  function handleKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null
    const inInput = isInputElement(target)

    // If typing in an input and allowInInputs is false, ignore unless marked as a barcode target
    if (inInput && !allowInInputs) {
      // Check if the input explicitly allows scanner capture
      const isScannerInput = target?.getAttribute('data-barcode-scanner-target') === 'true'
      if (!isScannerInput) {
        buffer = ''
        return
      }
    }

    const now = performance.now()
    const timeDiff = now - lastKeyTime
    lastKeyTime = now

    // Check if this is a terminating key (Enter or Tab)
    if (terminators.includes(event.key)) {
      if (buffer.length >= minBarcodeLength) {
        // Successful barcode scanned
        event.preventDefault()
        event.stopPropagation()
        const scannedCode = buffer.trim()
        buffer = ''
        isScanning.value = false
        onScan(scannedCode)
        return
      }
      buffer = ''
      isScanning.value = false
      return
    }

    // Ignore non-printable keys (Shift, Ctrl, Alt, Meta, CapsLock, Arrow keys, etc.)
    if (event.key.length !== 1) {
      return
    }

    // If interval between keys is too long, it's human typing — reset buffer to current key
    if (buffer.length > 0 && timeDiff > maxIntervalMs) {
      buffer = event.key
      isScanning.value = false
      return
    }

    // Append key to buffer
    buffer += event.key
    isScanning.value = true
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown, { capture: true })
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  })

  return {
    isScanning,
  }
}

