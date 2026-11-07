/**
 * Khmer Typography, Date, Numeral, Status, and Font-Safe Print Utilities
 * Used by Template A (Modern Khmer A4 Invoice), Template B (Modern Khmer 80mm Thermal Receipt),
 * and Template C (Modern Khmer Product Sticker 50x30mm / 40x30mm / 60x40mm).
 */

export const KHMER_STORE_NAME = 'គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់ '
export const ENGLISH_STORE_NAME = 'CLOTHING STORE PHNOM PENH'
export const DEFAULT_KHMER_BRANCH = 'សាខា មេមត់'
export const DEFAULT_KHMER_CUSTOMER = 'អតិថិជនទូទៅ'

const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'] as const

const KHMER_MONTHS = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ',
] as const

/**
 * Convert an integer or string of ASCII digits to Khmer numerals (០-៩).
 */
export function toKhmerNumerals(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => KHMER_DIGITS[Number(d)] ?? d)
}

/**
 * Format a date into Khmer formal format for A4 Invoices (e.g. "២៩ តុលា ២០២៦ • 14:30")
 */
export function formatKhmerInvoiceDate(dateInput?: string | number | Date | null): string {
  const d = parseDateSafe(dateInput)
  const day = toKhmerNumerals(d.getDate())
  const month = KHMER_MONTHS[d.getMonth()] || ''
  const year = toKhmerNumerals(d.getFullYear())
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${month} ${year} (${hh}:${mm})`
}

/**
 * Format a compact date for 80mm Thermal Receipts (e.g. "29/10/2026 14:30")
 */
export function formatReceiptCompactDate(dateInput?: string | number | Date | null): string {
  const d = parseDateSafe(dateInput)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

function parseDateSafe(dateInput?: string | number | Date | null): Date {
  if (!dateInput) return new Date()
  if (dateInput instanceof Date && !Number.isNaN(dateInput.getTime())) return dateInput
  const parsed = new Date(dateInput)
  if (!Number.isNaN(parsed.getTime())) return parsed
  return new Date()
}

/**
 * Authoritative Khmer + English payment status label.
 * Only returns "បានទូទាត់រួច" when the transaction status confirms PAID.
 */
export function formatKhmerPaymentStatus(
  paymentStatus?: string | null,
  saleStatus?: string | null,
): { khmer: string; english: string; isPaid: boolean } {
  const pStatus = (paymentStatus || '').toUpperCase().trim()
  const sStatus = (saleStatus || '').toUpperCase().trim()

  if (sStatus === 'CANCELLED') {
    return { khmer: 'បានបោះបង់', english: 'CANCELLED', isPaid: false }
  }
  if (pStatus === 'REFUNDED' || sStatus === 'RETURNED') {
    return { khmer: 'បានបង្វិលប្រាក់', english: 'REFUNDED', isPaid: false }
  }
  if (pStatus === 'PARTIAL') {
    return { khmer: 'ទូទាត់ខ្លះ', english: 'PARTIALLY PAID', isPaid: false }
  }
  if (pStatus === 'UNPAID' || pStatus === 'PENDING' || sStatus === 'DRAFT' || sStatus === 'PENDING') {
    if (pStatus !== 'PAID') {
      return { khmer: 'មិនទាន់ទូទាត់', english: pStatus || 'UNPAID', isPaid: false }
    }
  }
  if (pStatus === 'PAID' || (!pStatus && sStatus === 'COMPLETED')) {
    return { khmer: 'បានទូទាត់រួច', english: 'PAID', isPaid: true }
  }
  return { khmer: 'មិនទាន់ទូទាត់', english: pStatus || sStatus || 'PENDING', isPaid: false }
}

/**
 * Format payment method into clean Khmer / English label.
 */
export function formatKhmerPaymentMethod(method?: string | null): string {
  const raw = (method || '').trim()
  const upper = raw.toUpperCase()
  if (upper === 'KHQR' || upper === 'ABA_KHQR' || upper === 'ABA KHQR') return 'ABA KHQR'
  if (upper === 'CASH') return 'សាច់ប្រាក់ (Cash)'
  if (upper === 'CARD' || upper.startsWith('CREDIT CARD')) return raw.includes('APV') ? raw : 'កាតធនាគារ (Card)'
  if (upper === 'BANK_TRANSFER' || upper === 'BANK TRANSFER') return 'ផ្ទេរប្រាក់តាមធនាគារ (Bank Transfer)'
  return raw || 'សាច់ប្រាក់ (Cash)'
}

/**
 * Format customer name with Khmer walk-in default ("អតិថិជនទូទៅ").
 */
export function formatKhmerCustomerName(customerName?: string | null): string {
  const clean = (customerName || '').trim()
  if (!clean || clean.toLowerCase() === 'walk-in customer' || clean.toLowerCase() === 'walk-in') {
    return DEFAULT_KHMER_CUSTOMER
  }
  return clean
}

/**
 * Format branch name with Khmer flagship default ("សាខា មេមត់").
 */
export function formatKhmerBranchName(branchName?: string | null): string {
  const clean = (branchName || '').trim()
  if (!clean || clean.toLowerCase() === 'main flagship store' || clean.toLowerCase() === 'main branch') {
    return DEFAULT_KHMER_BRANCH
  }
  return clean
}

export interface StickerPrintOptions {
  printContainerId?: string
  pageWidthMm?: number
  pageHeightMm?: number
  isA4Sheet?: boolean
}

/**
 * Wait for Khmer web/local fonts to finish loading before invoking window.print()
 * so Khmer vowels, subscripts, and diacritics never clip or shift during printing.
 * When StickerPrintOptions are provided, isolates the target sticker container directly
 * under document.body and injects exact @page dimensions so layout chrome and extra
 * blank pages never appear.
 */
export async function printWithKhmerFonts(options?: StickerPrintOptions): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  let isolatedRoot: HTMLElement | null = null
  let styleEl: HTMLStyleElement | null = null

  const cleanup = () => {
    if (isolatedRoot && isolatedRoot.parentNode) {
      isolatedRoot.parentNode.removeChild(isolatedRoot)
    }
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl)
    }
    isolatedRoot = null
    styleEl = null
  }

  try {
    if (options?.printContainerId) {
      const sourceEl = document.getElementById(options.printContainerId)
      if (sourceEl) {
        document.getElementById('khmer-isolated-print-root')?.remove()
        document.getElementById('khmer-dynamic-page-print')?.remove()

        isolatedRoot = document.createElement('div')
        isolatedRoot.id = 'khmer-isolated-print-root'
        isolatedRoot.className = sourceEl.className
          .replace(/\bprint-only-stickers\b/g, '')
          .replace(/\binstant-print-only\b/g, '')
          .replace(/\bprint-only\b/g, '')
          .trim()
        isolatedRoot.style.cssText = sourceEl.style.cssText
        isolatedRoot.innerHTML = sourceEl.innerHTML
        document.body.appendChild(isolatedRoot)

        const wMm = Math.max(20, Number(options.pageWidthMm) || 50)
        const hMm = Math.max(15, Number(options.pageHeightMm) || 30)
        const pageRule = options.isA4Sheet
          ? `@page { size: A4 portrait; margin: 5mm; }`
          : `@page { size: ${wMm}mm ${hMm}mm; margin: 0mm; }`

        styleEl = document.createElement('style')
        styleEl.id = 'khmer-dynamic-page-print'
        styleEl.textContent = `
          @media screen {
            #khmer-isolated-print-root {
              display: none !important;
            }
          }
          @media print {
            ${pageRule}
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              min-height: 0 !important;
              height: auto !important;
              width: auto !important;
              background: #ffffff !important;
              overflow: visible !important;
            }
            body > *:not(#khmer-isolated-print-root) {
              display: none !important;
            }
            #khmer-isolated-print-root {
              display: block !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
            #khmer-isolated-print-root.is-sheet-print,
            #khmer-isolated-print-root.is-sheet-grid {
              display: grid !important;
              grid-template-columns: repeat(var(--sheet-cols, 4), var(--sticker-w, 48mm)) !important;
              gap: 2mm !important;
              padding: 4mm !important;
              justify-content: start !important;
            }
            #khmer-isolated-print-root.is-thermal-print .kh-product-sticker,
            #khmer-isolated-print-root.is-thermal-roll .kh-product-sticker {
              border: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              page-break-after: always !important;
              break-after: page !important;
            }
            #khmer-isolated-print-root.is-thermal-print .kh-product-sticker:last-child,
            #khmer-isolated-print-root.is-thermal-roll .kh-product-sticker:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
          }
        `
        document.head.appendChild(styleEl)
      }
    }

    if ('fonts' in document && document.fonts?.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 400)),
      ])
    }
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
  } catch {
    // Ignore font readiness check errors and proceed to print
  }

  window.addEventListener('afterprint', cleanup, { once: true })
  window.print()
  setTimeout(cleanup, 1000)
}

