import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

/**
 * Pure state machine representing the Hardware Scanner burst input detector
 * as implemented in useHardwareScanner.ts
 */
class HardwareScannerStateMachine {
  buffer = ''
  lastKeyTime = 0
  maxIntervalMs: number
  minBarcodeLength: number
  terminators: string[]
  emittedBarcodes: string[] = []

  constructor(options: { maxIntervalMs?: number; minBarcodeLength?: number; terminators?: string[] } = {}) {
    this.maxIntervalMs = options.maxIntervalMs ?? 50
    this.minBarcodeLength = options.minBarcodeLength ?? 3
    this.terminators = options.terminators ?? ['Enter', 'Tab']
  }

  handleKey(key: string, timestamp: number): boolean {
    const timeDiff = timestamp - this.lastKeyTime
    this.lastKeyTime = timestamp

    if (this.terminators.includes(key)) {
      if (this.buffer.length >= this.minBarcodeLength) {
        const code = this.buffer.trim()
        this.buffer = ''
        this.emittedBarcodes.push(code)
        return true
      }
      this.buffer = ''
      return false
    }

    if (key.length !== 1) {
      // Non-printable key ignored
      return false
    }

    if (this.buffer.length > 0 && timeDiff > this.maxIntervalMs) {
      // Human typing detected — reset buffer
      this.buffer = key
      return false
    }

    this.buffer += key
    return false
  }
}

/**
 * Defensive pagination parsing helper matching usePosProducts.ts
 */
function parseProductResponseDefensively(response: any, fallbackPageSize = 24) {
  const items = Array.isArray(response)
    ? response
    : (response?.items || response?.data || [])

  const meta = response?.pagination || response?.meta || {
    page: 1,
    page_size: fallbackPageSize,
    total: items.length,
    total_pages: Math.max(1, Math.ceil(items.length / fallbackPageSize)),
    has_next: false,
    has_previous: false,
  }

  return {
    items,
    pagination: {
      page: Number(meta.page) || 1,
      pageSize: Number(meta.page_size || meta.pageSize) || fallbackPageSize,
      total: Number(meta.total) || items.length,
      totalPages: Number(meta.total_pages || meta.totalPages) || 1,
      hasNext: Boolean(meta.has_next ?? meta.hasNext),
      hasPrevious: Boolean(meta.has_previous ?? meta.hasPrevious),
    },
  }
}

/**
 * Barcode lookup deduplication helper matching useBarcodeLookup.ts
 */
class BarcodeDeduplicator {
  lastCode = ''
  lastTime = 0
  cooldownMs: number

  constructor(cooldownMs = 600) {
    this.cooldownMs = cooldownMs
  }

  shouldProcess(code: string, timestamp: number): boolean {
    const trimmed = code.trim()
    if (!trimmed) return false
    if (trimmed === this.lastCode && timestamp - this.lastTime < this.cooldownMs) {
      return false
    }
    this.lastCode = trimmed
    this.lastTime = timestamp
    return true
  }
}

describe('POS Barcode Scanner & Product Loading Cross-Device Suite', () => {
  describe('Hardware USB & Bluetooth HID Scanner Bursts', () => {
    it('captures rapid keystrokes (< 50ms) and emits barcode on Enter', () => {
      const scanner = new HardwareScannerStateMachine({ maxIntervalMs: 50, minBarcodeLength: 3 })
      const chars = '8850123456789'.split('')
      let t = 1000

      for (const char of chars) {
        scanner.handleKey(char, t)
        t += 15 // 15ms per character (typical hardware scanner speed)
      }

      const emitted = scanner.handleKey('Enter', t + 10)
      assert.equal(emitted, true)
      assert.equal(scanner.emittedBarcodes.length, 1)
      assert.equal(scanner.emittedBarcodes[0], '8850123456789')
    })

    it('captures barcode terminated by Tab suffix', () => {
      const scanner = new HardwareScannerStateMachine({ maxIntervalMs: 50, minBarcodeLength: 3 })
      const chars = 'SKU-JEANS-001'.split('')
      let t = 2000

      for (const char of chars) {
        scanner.handleKey(char, t)
        t += 20
      }

      const emitted = scanner.handleKey('Tab', t + 15)
      assert.equal(emitted, true)
      assert.equal(scanner.emittedBarcodes[0], 'SKU-JEANS-001')
    })

    it('rejects human manual typing where key intervals exceed maxIntervalMs', () => {
      const scanner = new HardwareScannerStateMachine({ maxIntervalMs: 50, minBarcodeLength: 3 })
      const chars = '8850123'.split('')
      let t = 1000

      for (const char of chars) {
        scanner.handleKey(char, t)
        t += 120 // 120ms per character (human typing)
      }

      scanner.handleKey('Enter', t + 120)
      // Because intervals exceeded 50ms, buffer was reset on each key, so buffer length < minBarcodeLength
      assert.equal(scanner.emittedBarcodes.length, 0)
    })

    it('ignores non-printable keys like Shift, Control, Alt, and Meta', () => {
      const scanner = new HardwareScannerStateMachine({ maxIntervalMs: 50, minBarcodeLength: 3 })
      let t = 1000

      scanner.handleKey('Shift', t)
      t += 10
      scanner.handleKey('A', t)
      t += 10
      scanner.handleKey('B', t)
      t += 10
      scanner.handleKey('C', t)
      t += 10
      scanner.handleKey('Control', t)
      t += 10
      scanner.handleKey('Enter', t)

      assert.equal(scanner.emittedBarcodes.length, 1)
      assert.equal(scanner.emittedBarcodes[0], 'ABC')
    })
  })

  describe('Defensive POS Product Pagination & Desktop Hydration', () => {
    it('defensively handles responses where pagination object is omitted', () => {
      const mockRawResponse = {
        items: [
          { id: 'prod_1', name: 'Linen Shirt' },
          { id: 'prod_2', name: 'Denim Jeans' },
        ],
        // pagination property completely missing
      }

      const result = parseProductResponseDefensively(mockRawResponse, 24)
      assert.equal(result.items.length, 2)
      assert.equal(result.pagination.total, 2)
      assert.equal(result.pagination.totalPages, 1)
      assert.equal(result.pagination.page, 1)
      assert.equal(result.pagination.hasNext, false)
    })

    it('handles flat array response without crashing on meta.total_pages', () => {
      const flatArray = [
        { id: 'prod_1', name: 'Summer Hat' },
        { id: 'prod_2', name: 'Cotton Socks' },
        { id: 'prod_3', name: 'Leather Belt' },
      ]

      const result = parseProductResponseDefensively(flatArray, 2)
      assert.equal(result.items.length, 3)
      assert.equal(result.pagination.total, 3)
      assert.equal(result.pagination.totalPages, 2)
      assert.equal(result.pagination.page, 1)
    })

    it('handles standard paginated backend response structure', () => {
      const standardResponse = {
        items: [{ id: 'prod_1', name: 'Shirt' }],
        pagination: {
          page: 2,
          page_size: 24,
          total: 50,
          total_pages: 3,
          has_next: true,
          has_previous: true,
        },
      }

      const result = parseProductResponseDefensively(standardResponse, 24)
      assert.equal(result.pagination.page, 2)
      assert.equal(result.pagination.pageSize, 24)
      assert.equal(result.pagination.total, 50)
      assert.equal(result.pagination.totalPages, 3)
      assert.equal(result.pagination.hasNext, true)
      assert.equal(result.pagination.hasPrevious, true)
    })
  })

  describe('Barcode Deduplication & Cooldown', () => {
    it('deduplicates identical scans within 600ms cooldown window', () => {
      const dedup = new BarcodeDeduplicator(600)
      const t0 = 1000

      assert.equal(dedup.shouldProcess('BARCODE_123', t0), true)
      assert.equal(dedup.shouldProcess('BARCODE_123', t0 + 200), false)
      assert.equal(dedup.shouldProcess('BARCODE_123', t0 + 599), false)
      assert.equal(dedup.shouldProcess('BARCODE_123', t0 + 650), true)
    })

    it('allows different barcodes immediately without cooldown delay', () => {
      const dedup = new BarcodeDeduplicator(600)
      const t0 = 1000

      assert.equal(dedup.shouldProcess('BARCODE_A', t0), true)
      assert.equal(dedup.shouldProcess('BARCODE_B', t0 + 50), true)
      assert.equal(dedup.shouldProcess('BARCODE_C', t0 + 100), true)
    })

    it('rejects empty and whitespace-only barcode scans', () => {
      const dedup = new BarcodeDeduplicator(600)
      assert.equal(dedup.shouldProcess('', 1000), false)
      assert.equal(dedup.shouldProcess('   ', 1000), false)
    })
  })
})

