/**
 * Client-side vector SVG generator for 1D Code-128 (Subsets B & C) Barcodes
 * and 2D ISO/IEC 18004 QR Codes.
 *
 * Returns inline `data:image/svg+xml;utf8,...` URLs so `<img :src="...">`
 * renders with 0ms latency, never fails with 401/502, and prints crisply.
 */

const CODE128_PATTERNS: readonly string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
  '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
  '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
  '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
  '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
  '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
  '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
  '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
  '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112',
  '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
  '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412',
  '211214', '211232', '2331112',
]

function encodeCode128Indices(raw: string): number[] {
  const clean = (raw || '').trim() || '00000000'
  if (/^\d+$/.test(clean) && clean.length >= 4 && clean.length % 2 === 0) {
    const codes: number[] = [105] // Start C
    for (let i = 0; i < clean.length; i += 2) {
      codes.push(parseInt(clean.slice(i, i + 2), 10))
    }
    let checksum = codes[0]!
    for (let i = 1; i < codes.length; i++) {
      checksum += codes[i]! * i
    }
    codes.push(checksum % 103)
    codes.push(106) // Stop
    return codes
  }

  const codes: number[] = [104] // Start B
  for (let i = 0; i < clean.length; i++) {
    const cc = clean.charCodeAt(i)
    const val = cc >= 32 && cc <= 126 ? cc - 32 : 0
    codes.push(val)
  }
  let checksum = codes[0]!
  for (let i = 1; i < codes.length; i++) {
    checksum += codes[i]! * i
  }
  codes.push(checksum % 103)
  codes.push(106) // Stop
  return codes
}

export function generateBarcodeSvgString(
  code: string,
  options?: { writeText?: boolean; barHeight?: number },
): string {
  const text = (code || '').trim() || '00000000'
  const writeText = options?.writeText ?? false
  const barHeight = options?.barHeight ?? 44
  const quietZone = 8

  const indices = encodeCode128Indices(text)
  const rects: string[] = []
  let x = quietZone

  for (const idx of indices) {
    const pattern = CODE128_PATTERNS[idx] || CODE128_PATTERNS[0]!
    for (let i = 0; i < pattern.length; i++) {
      const w = Number(pattern[i]) || 1
      if (i % 2 === 0) {
        rects.push(`<rect x="${x}" y="2" width="${w}" height="${barHeight}" fill="#000000"/>`)
      }
      x += w
    }
  }

  const totalWidth = x + quietZone
  const totalHeight = writeText ? barHeight + 16 : barHeight + 4
  const textNode = writeText
    ? `<text x="${totalWidth / 2}" y="${barHeight + 13}" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle" fill="#000000">${text.replace(/[<>&"']/g, '')}</text>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#ffffff"/>${rects.join('')}${textNode}</svg>`
}

export function generateBarcodeSvgDataUri(code: string, writeText = false): string {
  const svg = generateBarcodeSvgString(code, { writeText })
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/* ── Compact ISO/IEC 18004 QR Code Matrix Generator (Versions 1..6, ECC L) ── */
const QR_EXP = new Uint8Array(512)
const QR_LOG = new Uint8Array(256)
;(() => {
  let x = 1
  for (let i = 0; i < 255; i++) {
    QR_EXP[i] = x
    QR_LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) {
    QR_EXP[i] = QR_EXP[i - 255]!
  }
})()

function rsRemainder(data: number[], ecLen: number): number[] {
  let gen = [1]
  for (let i = 0; i < ecLen; i++) {
    const next = new Array(gen.length + 1).fill(0)
    const root = QR_EXP[i]!
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j]!
      next[j + 1] ^= gen[j]! === 0 ? 0 : QR_EXP[QR_LOG[gen[j]!]! + QR_LOG[root]!]!
    }
    gen = next
  }
  const res = new Array(ecLen).fill(0)
  for (const b of data) {
    const factor = b ^ res.shift()!
    res.push(0)
    if (factor !== 0) {
      const logF = QR_LOG[factor]!
      for (let j = 0; j < ecLen; j++) {
        const g = gen[j + 1]!
        if (g !== 0) res[j] ^= QR_EXP[QR_LOG[g]! + logF]!
      }
    }
  }
  return res
}

interface QrVerSpec {
  ver: number
  size: number
  dataBytes: number
  ecBytesPerBlock: number
  numBlocks: number
  align: number[]
}

const QR_VERSION_SPECS: readonly QrVerSpec[] = [
  { ver: 1, size: 21, dataBytes: 19, ecBytesPerBlock: 7, numBlocks: 1, align: [] },
  { ver: 2, size: 25, dataBytes: 34, ecBytesPerBlock: 10, numBlocks: 1, align: [6, 18] },
  { ver: 3, size: 29, dataBytes: 55, ecBytesPerBlock: 15, numBlocks: 1, align: [6, 22] },
  { ver: 4, size: 33, dataBytes: 80, ecBytesPerBlock: 20, numBlocks: 1, align: [6, 26] },
  { ver: 5, size: 37, dataBytes: 108, ecBytesPerBlock: 26, numBlocks: 1, align: [6, 30] },
  { ver: 6, size: 41, dataBytes: 136, ecBytesPerBlock: 18, numBlocks: 2, align: [6, 34] },
]

function buildQrMatrix(text: string): boolean[][] {
  const utf8 = Array.from(new TextEncoder().encode((text || '').trim() || '0'))
  const spec =
    QR_VERSION_SPECS.find((s) => utf8.length + 3 <= s.dataBytes) ||
    QR_VERSION_SPECS[QR_VERSION_SPECS.length - 1]!
  const payload = utf8.slice(0, spec.dataBytes - 3)

  const bits: number[] = []
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1)
  }

  pushBits(0b0100, 4)
  pushBits(payload.length, 8)
  for (const b of payload) pushBits(b, 8)
  pushBits(0, Math.min(4, spec.dataBytes * 8 - bits.length))
  while (bits.length % 8 !== 0) bits.push(0)

  const codewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j]!
    codewords.push(byte)
  }
  const pads = [0xec, 0x11]
  let padIdx = 0
  while (codewords.length < spec.dataBytes) {
    codewords.push(pads[padIdx % 2]!)
    padIdx++
  }

  const blockSize = Math.floor(spec.dataBytes / spec.numBlocks)
  const dataBlocks: number[][] = []
  const ecBlocks: number[][] = []
  for (let b = 0; b < spec.numBlocks; b++) {
    const slice = codewords.slice(b * blockSize, (b + 1) * blockSize)
    dataBlocks.push(slice)
    ecBlocks.push(rsRemainder(slice, spec.ecBytesPerBlock))
  }

  const finalBytes: number[] = []
  for (let i = 0; i < blockSize; i++) {
    for (let b = 0; b < spec.numBlocks; b++) finalBytes.push(dataBlocks[b]![i]!)
  }
  for (let i = 0; i < spec.ecBytesPerBlock; i++) {
    for (let b = 0; b < spec.numBlocks; b++) finalBytes.push(ecBlocks[b]![i]!)
  }

  const n = spec.size
  const modules: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false))
  const isFunc: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false))

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < n && c >= 0 && c < n) {
      modules[r]![c] = dark
      isFunc[r]![c] = true
    }
  }

  const drawFinder = (r: number, c: number) => {
    for (let dy = -1; dy <= 7; dy++) {
      for (let dx = -1; dx <= 7; dx++) {
        const inOuter = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6
        const inRing = dx === 0 || dx === 6 || dy === 0 || dy === 6
        const inCore = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
        setFunctionModule(r + dy, c + dx, inOuter && (inRing || inCore))
      }
    }
  }

  drawFinder(0, 0)
  drawFinder(0, n - 7)
  drawFinder(n - 7, 0)

  for (let i = 8; i < n - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0)
    setFunctionModule(i, 6, i % 2 === 0)
  }

  if (spec.align.length > 0) {
    for (const r of spec.align) {
      for (const c of spec.align) {
        if ((r === 6 && c === 6) || (r === 6 && c === n - 7) || (r === n - 7 && c === 6)) continue
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const dark = Math.max(Math.abs(dx), Math.abs(dy)) !== 1
            setFunctionModule(r + dy, c + dx, dark)
          }
        }
      }
    }
  }

  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      setFunctionModule(8, i, false)
      setFunctionModule(i, 8, false)
    }
  }
  for (let i = 0; i < 8; i++) {
    setFunctionModule(8, n - 1 - i, false)
    setFunctionModule(n - 1 - i, 8, false)
  }
  setFunctionModule(n - 8, 8, true)

  let bitIdx = 0
  const totalBits = finalBytes.length * 8
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < n; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j
        const upward = ((right + 1) & 2) === 0
        const r = upward ? n - 1 - vert : vert
        if (!isFunc[r]![c]!) {
          let dark = false
          if (bitIdx < totalBits) {
            dark = ((finalBytes[bitIdx >>> 3]! >>> (7 - (bitIdx & 7))) & 1) !== 0
            bitIdx++
          }
          if ((r + c) % 2 === 0) dark = !dark
          modules[r]![c] = dark
        }
      }
    }
  }

  const formatBits = 0x77c4
  const getFmtBit = (i: number) => ((formatBits >>> i) & 1) !== 0
  for (let i = 0; i <= 5; i++) setFunctionModule(8, i, getFmtBit(i))
  setFunctionModule(8, 7, getFmtBit(6))
  setFunctionModule(8, 8, getFmtBit(7))
  setFunctionModule(7, 8, getFmtBit(8))
  for (let i = 9; i < 15; i++) setFunctionModule(14 - i, 8, getFmtBit(i))
  for (let i = 0; i < 8; i++) setFunctionModule(n - 1 - i, 8, getFmtBit(i))
  for (let i = 8; i < 15; i++) setFunctionModule(8, n - 15 + i, getFmtBit(i))

  return modules
}

export function generateQrSvgString(text: string): string {
  const matrix = buildQrMatrix(text)
  const n = matrix.length
  const margin = 2
  const size = n + margin * 2
  const paths: string[] = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r]![c]) {
        paths.push(`M${c + margin},${r + margin}h1v1h-1z`)
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#ffffff"/><path d="${paths.join('')}" fill="#000000"/></svg>`
}

export function generateQrSvgDataUri(text: string): string {
  const svg = generateQrSvgString(text)
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

