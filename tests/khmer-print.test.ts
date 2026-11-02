import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  toKhmerNumerals,
  formatKhmerInvoiceDate,
  formatReceiptCompactDate,
  formatKhmerPaymentStatus,
  formatKhmerPaymentMethod,
  formatKhmerCustomerName,
  formatKhmerBranchName,
  printWithKhmerFonts,
} from '../app/composables/useKhmerPrint.ts'

const testDir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))

describe('Modern Khmer Invoice, Receipt & Product Sticker Suite', () => {
  it('converts ASCII digits into Khmer numerals accurately', () => {
    assert.equal(toKhmerNumerals(1), '១')
    assert.equal(toKhmerNumerals(2026), '២០២៦')
    assert.equal(toKhmerNumerals('29'), '២៩')
  })

  it('formats invoice dates in Khmer format (e.g. ២៩ តុលា ២០២៦)', () => {
    const formatted = formatKhmerInvoiceDate('2026-10-29T10:30:00Z')
    assert.ok(formatted.includes('តុលា'))
    assert.ok(formatted.includes('២០២៦'))
  })

  it('formats thermal receipt dates in compact DD/MM/YYYY HH:mm format', () => {
    const formatted = formatReceiptCompactDate(new Date(2026, 9, 29, 16, 48))
    assert.equal(formatted, '29/10/2026 16:48')
  })

  it('only displays "បានទូទាត់រួច" when authoritative transaction status confirms PAID', () => {
    const paid = formatKhmerPaymentStatus('PAID', 'COMPLETED')
    assert.equal(paid.khmer, 'បានទូទាត់រួច')
    assert.equal(paid.isPaid, true)

    const unpaid = formatKhmerPaymentStatus('UNPAID', 'PENDING')
    assert.equal(unpaid.khmer, 'មិនទាន់ទូទាត់')
    assert.equal(unpaid.isPaid, false)
    assert.notEqual(unpaid.khmer, 'បានទូទាត់រួច')

    const partial = formatKhmerPaymentStatus('PARTIAL', 'PENDING')
    assert.equal(partial.khmer, 'ទូទាត់ខ្លះ')
    assert.equal(partial.isPaid, false)

    const cancelled = formatKhmerPaymentStatus('PAID', 'CANCELLED')
    assert.equal(cancelled.khmer, 'បានបោះបង់')
    assert.equal(cancelled.isPaid, false)
  })

  it('formats payment methods, customer names, and branch names in Khmer', () => {
    assert.equal(formatKhmerPaymentMethod('KHQR'), 'ABA KHQR')
    assert.ok(formatKhmerPaymentMethod('CASH').includes('សាច់ប្រាក់'))
    assert.equal(formatKhmerCustomerName(null), 'អតិថិជនទូទៅ')
    assert.equal(formatKhmerCustomerName('Walk-in Customer'), 'អតិថិជនទូទៅ')
    assert.equal(formatKhmerCustomerName('Sokha'), 'Sokha')
    assert.equal(formatKhmerBranchName('Main Branch'), 'សាខា មេមត់')
    assert.equal(formatKhmerBranchName(null), 'សាខា មេមត់')
  })

  it('waits for document.fonts.ready before invoking window.print()', async () => {
    let fontsResolved = false
    let printCalled = false

    const origDocument = (globalThis as any).document
    const origWindow = (globalThis as any).window

      ; (globalThis as any).document = {
        fonts: {
          ready: new Promise<void>((resolve) => {
            setTimeout(() => {
              fontsResolved = true
              resolve()
            }, 10)
          }),
        },
      }
      ; (globalThis as any).window = {
        print: () => {
          assert.equal(fontsResolved, true)
          printCalled = true
        },
        requestAnimationFrame: (cb: FrameRequestCallback) => {
          cb(0)
          return 1
        },
      }

    await printWithKhmerFonts()
    assert.equal(printCalled, true)

      ; (globalThis as any).document = origDocument
      ; (globalThis as any).window = origWindow
  })

  it('verifies Template A (A4 Invoice), Template B (80mm Receipt), and Template C (Product Sticker) contain required Khmer strings and bundled fonts', () => {
    const receiptModalPath = path.resolve(testDir, '../app/components/pos/ReceiptModal.vue')
    const stickerModalPath = path.resolve(testDir, '../app/components/pos/ProductStickerModal.vue')
    const fontPath = path.resolve(testDir, '../public/fonts/Battambang-Regular.ttf')
    const backendFontPath = path.resolve(testDir, '../../backend/app/assets/fonts/Battambang-Regular.ttf')

    assert.equal(fs.existsSync(fontPath), true, 'Frontend bundled Battambang-Regular.ttf must exist')
    assert.equal(fs.existsSync(backendFontPath), true, 'Backend bundled Battambang-Regular.ttf must exist')

    const receiptContent = fs.readFileSync(receiptModalPath, 'utf-8')
    assert.ok(receiptContent.includes('គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់ '))
    assert.ok(receiptContent.includes('វិក្កយបត្រលក់'))
    assert.ok(receiptContent.includes('បរិយាយទំនិញ'))
    assert.ok(receiptContent.includes('សរុបត្រូវបង់'))
    assert.ok(receiptContent.includes('បោះពុម្ពវិក្កយបត្រ A4'))
    assert.ok(receiptContent.includes('បោះពុម្ពបង្កាន់ដៃ'))

    const stickerContent = fs.readFileSync(stickerModalPath, 'utf-8')
    assert.ok(stickerContent.includes('គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់ '))
    assert.ok(stickerContent.includes('បោះពុម្ពស្លាកទំនិញ'))
    assert.ok(stickerContent.includes('THERMAL_50x30'))
    assert.ok(stickerContent.includes('THERMAL_40x30'))
    assert.ok(stickerContent.includes('THERMAL_60x40'))
  })
})
