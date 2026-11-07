/**
 * Normalize any raw scanned string (1D Barcode, 2D QR Code URL, SKU, QR reference, or Product Code)
 * into a clean, canonical lookup token.
 */
const CONTROL_CHARS_RE = /[\x00-\x1f\x7f-\x9f\u200b-\u200f\ufeff]+/g
const PRODUCT_PATH_RE = /(?:^|\/+)p\/([^/?#&\s]+)/i

export function normalizeScannedCode(raw?: string | null): string {
  if (!raw) return ''

  let cleaned = String(raw).replace(CONTROL_CHARS_RE, '').trim()
  if (!cleaned) return ''

  if (cleaned.includes('%')) {
    try {
      cleaned = decodeURIComponent(cleaned).trim()
    } catch {
      // ignore malformed URI encoding
    }
  }

  // Handle keyboard-wedge scanners where ':' in 'https://' is sent as ';'
  const urlCandidate = cleaned.replace(/^(https?);(\/\/)/i, '$1:$2')

  // Extract token from /p/<reference> QR URLs (e.g. https://store.domain/p/VAR-000123)
  const pathMatch = urlCandidate.match(PRODUCT_PATH_RE)
  if (pathMatch && pathMatch[1]) {
    const token = pathMatch[1].trim()
    if (token) return token
  }

  // Extract from query params if URL contains ?code= / ?barcode= / ?sku= / ?qr=
  if (/^https?:\/\//i.test(urlCandidate) || urlCandidate.includes('?')) {
    try {
      const parsed = new URL(
        urlCandidate.includes('://')
          ? urlCandidate
          : `https://placeholder.local/${urlCandidate.replace(/^\/+/, '')}`,
      )
      for (const key of ['code', 'barcode', 'sku', 'qr', 'ref', 'reference']) {
        const val = parsed.searchParams.get(key)?.trim()
        if (val) return val
      }
      if (/^https?:\/\//i.test(urlCandidate)) {
        const segments = parsed.pathname.split('/').map(s => s.trim()).filter(Boolean)
        const lastSeg = segments[segments.length - 1]
        if (lastSeg && !['p', 'products', 'scan', 'pos'].includes(lastSeg.toLowerCase())) {
          return lastSeg
        }
      }
    } catch {
      // ignore URL parse error
    }
  }

  return cleaned
}

