/**
 * useCustomerDisplaySync — Authoritative state synchronization protocol & engine
 * for the POS Customer-Facing Display Terminal (/pos/customer-display).
 *
 * Design principles:
 * 1. Read-Only Projection: The Cashier POS (/pos) and backend are the sole sources of truth.
 *    The customer display never recalculates financial rules independently or initiates mutations.
 * 2. Dual-Channel Synchronization:
 *    - BroadcastChannel ('pos_customer_display_channel') for sub-millisecond live events.
 *    - localStorage ('pos_customer_display_snapshot_v1' + 'pos_session_v2') for instant
 *      hydration on initial page load, page refresh during checkout, or cross-tab recovery.
 * 3. Monotonic Sequence + Order Session Isolation:
 *    - Every state transition carries `terminalId`, `orderSessionId`, `seq`, and `timestamp`.
 *    - Duplicate events, out-of-order older updates, and delayed events from cleared,
 *      held, or completed orders are deterministically rejected.
 * 4. Payment Lifecycle & Race-Condition Safety:
 *    - Payment completion events are deduplicated by `paymentId`.
 *    - Post-payment auto-clear (`POST_PAYMENT_CLEAR`) does not prematurely dismiss the
 *      customer's payment confirmation screen, while scanning an item for the next customer
 *      or starting a new sale transitions immediately and cancels any stale reset timer.
 */

import type { CartItem } from '~/types/pos'

export const CUSTOMER_DISPLAY_CHANNEL = 'pos_customer_display_channel'
export const CUSTOMER_DISPLAY_SNAPSHOT_KEY = 'pos_customer_display_snapshot_v1'
export const CUSTOMER_DISPLAY_HEARTBEAT_KEY = 'pos_customer_display_heartbeat_v1'
export const POS_SESSION_STORAGE_KEY = 'pos_session_v2'
export const POS_SETTINGS_STORAGE_KEY = 'pos_terminal_settings'

export const KHR_EXCHANGE_RATE = 4100
export const DEFAULT_TAX_RATE = 0.05
export const PAYMENT_SUCCESS_DURATION_MS = 5000
export const HEARTBEAT_INTERVAL_MS = 3000
export const HEARTBEAT_STALE_THRESHOLD_MS = 8500

export function normalizeTerminalId(value?: string | null): string {
  const cleaned = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
  return cleaned || 'POS-01'
}

export function getSnapshotStorageKey(terminalId?: string | null): string {
  return `${CUSTOMER_DISPLAY_SNAPSHOT_KEY}_${normalizeTerminalId(terminalId)}`
}

export function getHeartbeatStorageKey(terminalId?: string | null): string {
  return `${CUSTOMER_DISPLAY_HEARTBEAT_KEY}_${normalizeTerminalId(terminalId)}`
}

/** Presence beacon written by the Customer Display page so the POS can tell it is open. */
export const CUSTOMER_DISPLAY_PRESENCE_KEY = 'pos_customer_display_presence_v1'

export function getDisplayPresenceStorageKey(terminalId?: string | null): string {
  return `${CUSTOMER_DISPLAY_PRESENCE_KEY}_${normalizeTerminalId(terminalId)}`
}

/** True when a presence beacon (JSON `{ timestamp }` or raw ms) is recent enough. */
export function isDisplayPresenceFresh(
  raw: string | null | undefined,
  now: number = Date.now(),
  thresholdMs: number = HEARTBEAT_STALE_THRESHOLD_MS,
): boolean {
  if (!raw) return false
  let ts = Number.NaN
  try {
    const parsed = JSON.parse(raw)
    ts = typeof parsed === 'number' ? parsed : Number(parsed?.timestamp)
  } catch {
    return false
  }
  return Number.isFinite(ts) && now - ts >= -1000 && now - ts <= thresholdMs
}

/** URL for the Customer Display bound to a terminal. */
export function buildCustomerDisplayUrl(terminalId?: string | null): string {
  return `/pos/customer-display?terminal=${encodeURIComponent(normalizeTerminalId(terminalId))}`
}

export type CustomerDisplayScreenState =
  | 'IDLE'
  | 'CART_ACTIVE'
  | 'PAYMENT_QR'
  | 'PAYMENT_SUCCESS'

export type CustomerDisplayCheckoutPhase =
  | 'SHOPPING'
  | 'PAYMENT_SELECTION'
  | 'CARD_PROCESSING'

export type CustomerDisplayKhqrStatus =
  | 'LOADING'
  | 'PENDING'
  | 'VERIFYING'
  | 'APPROVED'
  | 'EXPIRED'
  | 'DECLINED'
  | 'FAILED'

export type CustomerDisplayConnectionStatus =
  | 'CONNECTED'
  | 'STANDBY'
  | 'RECONNECTING'
  | 'OFFLINE'

export type CustomerDisplayTransitionReason =
  | 'INITIAL_LOAD'
  | 'CART_UPDATED'
  | 'ITEM_ADDED'
  | 'QTY_CHANGED'
  | 'ITEM_REMOVED'
  | 'DISCOUNT_UPDATED'
  | 'MANUAL_CLEAR'
  | 'ORDER_HELD'
  | 'ORDER_RESUMED'
  | 'CHECKOUT_OPENED'
  | 'CHECKOUT_CLOSED'
  | 'KHQR_LOADING'
  | 'KHQR_PENDING'
  | 'KHQR_COUNTDOWN'
  | 'KHQR_VERIFYING'
  | 'KHQR_EXPIRED'
  | 'KHQR_FAILED'
  | 'PAYMENT_CANCELLED'
  | 'PAYMENT_APPROVED'
  | 'POST_PAYMENT_CLEAR'
  | 'START_NEW_SALE'

export interface CustomerDisplayLineItem {
  variant_id: string
  sku: string
  name: string
  brandName: string
  categoryName: string
  colorName: string
  colorHex: string
  sizeName: string
  variantInfo: string
  imageUrl: string
  quantity: number
  unitPrice: number
  discountAmount: number
  lineSubtotal: number
  lineTotal: number
}

export interface CustomerDisplayKhqrData {
  saleId: string
  paymentId: string
  tranId: string
  amount: number
  khrAmount: number
  qrImage: string
  qrString: string
  status: CustomerDisplayKhqrStatus
  error: string | null
  verifying: boolean
  apv: string | null
  expiresAt: string | null
  secondsLeft: number
}

export interface CustomerDisplaySuccessData {
  paymentId: string
  orderSessionId: string
  invoiceNumber: string
  amount: number
  khrAmount: number
  paymentMethod: string
  tenderedAmount: number | null
  changeDue: number
  itemCount: number
  completedAt: number
}

export interface CustomerDisplaySnapshot {
  version: 1
  seq: number
  timestamp: number
  terminalId: string
  orderSessionId: string
  reason: CustomerDisplayTransitionReason
  storeName: string
  branchName: string
  receiptFooterNote: string
  exchangeRate: number
  state: CustomerDisplayScreenState
  checkoutPhase: CustomerDisplayCheckoutPhase
  customerName: string | null
  customerTier: string | null
  items: CustomerDisplayLineItem[]
  totalItemsCount: number
  uniqueItemsCount: number
  subtotal: number
  itemDiscountsTotal: number
  orderDiscount: number
  totalDiscount: number
  appliedCouponCode: string | null
  appliedCouponName: string | null
  taxRate: number
  taxAmount: number
  grandTotal: number
  khrGrandTotal: number
  lastUpdatedVariantId: string | null
  khqr: CustomerDisplayKhqrData | null
  success: CustomerDisplaySuccessData | null
  closedOrderSessions: string[]
}

export interface CustomerDisplayMessage {
  type:
    | 'SYNC_SNAPSHOT'
    | 'SYNC_CART'
    | 'SHOW_KHQR'
    | 'UPDATE_COUNTDOWN'
    | 'PAYMENT_SUCCESS'
    | 'CANCEL_PAYMENT'
    | 'CLEAR_CART'
    | 'START_NEW_SALE'
    | 'HEARTBEAT'
    | 'REQUEST_INITIAL_STATE'
    | 'SETTINGS_UPDATED'
    | 'POS_DISCONNECTED'
  terminalId?: string
  seq?: number
  timestamp?: number
  orderSessionId?: string
  snapshot?: CustomerDisplaySnapshot
  payload?: any
}

// ── Currency & Formatting Helpers ────────────────────────────────────────────

export function roundCurrency(value: number): number {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.round((num + Number.EPSILON) * 100) / 100
}

export function formatUsd(amount: number): string {
  const num = Number(amount)
  if (!Number.isFinite(num)) return '0.00'
  return num.toFixed(2)
}

export function toKhrAmount(usd: number, rate: number = KHR_EXCHANGE_RATE): number {
  const num = Number(usd)
  if (!Number.isFinite(num)) return 0
  return Math.round(num * rate)
}

export function formatKhr(usd: number, rate: number = KHR_EXCHANGE_RATE): string {
  return `${toKhrAmount(usd, rate).toLocaleString()} ៛`
}

export function formatCountdownMmSs(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// ── Cart Item Mapping ────────────────────────────────────────────────────────

export function mapCartItemToDisplayItem(item: CartItem): CustomerDisplayLineItem {
  const variant: any = item.variant || {}
  const product: any = variant.product || {}
  const colorName = variant.color?.name ? String(variant.color.name).trim() : ''
  const colorHex = variant.color?.hex_code ? String(variant.color.hex_code).trim() : ''
  const sizeName = variant.size?.name ? String(variant.size.name).trim() : ''
  const variantParts = [colorName, sizeName].filter(Boolean)
  const variantInfo = variantParts.join(' / ')
  const quantity = Math.max(1, Number(item.quantity) || 1)
  const unitPrice = roundCurrency(Number(item.unit_price ?? variant.selling_price ?? 0))
  const discountAmount = roundCurrency(Math.max(0, Number(item.discount_amount) || 0))
  const lineSubtotal = roundCurrency(unitPrice * quantity)
  const lineTotal = roundCurrency(
    item.subtotal !== undefined && Number.isFinite(Number(item.subtotal))
      ? Math.max(0, Number(item.subtotal))
      : Math.max(0, lineSubtotal - discountAmount),
  )

  return {
    variant_id: String(item.variant_id || variant.id || ''),
    sku: String(variant.sku || ''),
    name: String(product.name || ( item as any ).name || 'Apparel Item'),
    brandName: String(product.brand?.name || ''),
    categoryName: String(product.category?.name || ''),
    colorName,
    colorHex,
    sizeName,
    variantInfo: variantInfo || String((item as any).variantInfo || ''),
    imageUrl: String(variant.image_url || product.image_url || (item as any).imageUrl || ''),
    quantity,
    unitPrice,
    discountAmount,
    lineSubtotal,
    lineTotal,
  }
}

// ── Default / Empty Snapshot Builder ─────────────────────────────────────────

export function createEmptyDisplaySnapshot(overrides?: Partial<CustomerDisplaySnapshot>): CustomerDisplaySnapshot {
  return {
    version: 1,
    seq: 0,
    timestamp: 0,
    terminalId: 'POS-01',
    orderSessionId: 'ord_initial',
    reason: 'INITIAL_LOAD',
    storeName: 'Clothing Store Phnom Penh',
    branchName: 'Main Flagship Store',
    receiptFooterNote: 'Thank you for shopping with us! Items can be exchanged within 7 days.',
    exchangeRate: KHR_EXCHANGE_RATE,
    state: 'IDLE',
    checkoutPhase: 'SHOPPING',
    customerName: null,
    customerTier: null,
    items: [],
    totalItemsCount: 0,
    uniqueItemsCount: 0,
    subtotal: 0,
    itemDiscountsTotal: 0,
    orderDiscount: 0,
    totalDiscount: 0,
    appliedCouponCode: null,
    appliedCouponName: null,
    taxRate: DEFAULT_TAX_RATE,
    taxAmount: 0,
    grandTotal: 0,
    khrGrandTotal: 0,
    lastUpdatedVariantId: null,
    khqr: null,
    success: null,
    closedOrderSessions: [],
    ...overrides,
  }
}

/**
 * Construct an authoritative CustomerDisplaySnapshot from a raw pos_session_v2 object
 * and optional pos_terminal_settings object (used when hydrating from localStorage).
 */
export function buildSnapshotFromRawPosStorage(
  rawSession: any,
  rawSettings?: any,
  terminalId: string = 'POS-01',
): CustomerDisplaySnapshot {
  const storeName =
    rawSettings?.receiptStoreName ||
    rawSettings?.storeName ||
    'Clothing Store Phnom Penh'
  const receiptFooterNote =
    rawSettings?.receiptFooterNote ||
    'Thank you for shopping with us! Items can be exchanged within 7 days.'

  if (!rawSession || typeof rawSession !== 'object') {
    return createEmptyDisplaySnapshot({
      terminalId,
      storeName,
      receiptFooterNote,
      timestamp: Date.now(),
    })
  }

  const rawCart: CartItem[] = Array.isArray(rawSession.cart) ? rawSession.cart : []
  const items = rawCart
    .filter((i) => i && (i.variant_id || i.variant?.id) && Number(i.quantity) > 0)
    .map(mapCartItemToDisplayItem)

  const totalItemsCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const uniqueItemsCount = items.length
  const subtotal = roundCurrency(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0))
  const itemDiscountsTotal = roundCurrency(items.reduce((sum, i) => sum + i.discountAmount, 0))
  const orderDiscount = roundCurrency(Math.max(0, Number(rawSession.discountAmount) || 0))
  const totalDiscount = roundCurrency(itemDiscountsTotal + orderDiscount)
  const taxRate = typeof rawSession.taxRate === 'number' ? rawSession.taxRate : DEFAULT_TAX_RATE
  const taxable = Math.max(0, subtotal - itemDiscountsTotal - orderDiscount)
  const taxAmount = roundCurrency(taxable * taxRate)
  const grandTotal = roundCurrency(taxable + taxAmount)

  const customer = rawSession.selectedCustomer
  const coupon = rawSession.appliedCoupon

  return createEmptyDisplaySnapshot({
    seq: typeof rawSession.stateSeq === 'number' ? rawSession.stateSeq : 1,
    timestamp: Date.now(),
    terminalId,
    orderSessionId:
      typeof rawSession.orderSessionId === 'string' && rawSession.orderSessionId
        ? rawSession.orderSessionId
        : 'ord_hydrated',
    reason: 'INITIAL_LOAD',
    storeName,
    branchName: rawSession.branchName || 'Main Flagship Store',
    receiptFooterNote,
    state: items.length > 0 ? 'CART_ACTIVE' : 'IDLE',
    checkoutPhase: 'SHOPPING',
    customerName: customer?.name || null,
    customerTier: customer?.loyalty_account?.tier || null,
    items,
    totalItemsCount,
    uniqueItemsCount,
    subtotal,
    itemDiscountsTotal,
    orderDiscount,
    totalDiscount,
    appliedCouponCode: coupon?.code || null,
    appliedCouponName: coupon?.name || null,
    taxRate,
    taxAmount,
    grandTotal,
    khrGrandTotal: toKhrAmount(grandTotal),
    lastUpdatedVariantId: rawSession.lastUpdatedVariantId || null,
    closedOrderSessions: Array.isArray(rawSession.closedOrderSessions)
      ? rawSession.closedOrderSessions
      : [],
  })
}

// ── Receiver State Machine & Reconciliation Engine ───────────────────────────

export interface DisplayReceiverContext {
  boundTerminalId: string | null
  snapshot: CustomerDisplaySnapshot
  closedOrderSessions: Set<string>
  processedPaymentIds: Set<string>
  lastSeqByTerminal: Map<string, number>
  lastEventSignature: string
}

export function createDisplayReceiverContext(
  initialSnapshot?: CustomerDisplaySnapshot,
  boundTerminalId?: string | null,
): DisplayReceiverContext {
  const normalizedBound = boundTerminalId ? normalizeTerminalId(boundTerminalId) : null
  const snap = initialSnapshot
    ? { ...initialSnapshot }
    : createEmptyDisplaySnapshot(normalizedBound ? { terminalId: normalizedBound } : undefined)
  const closedSet = new Set<string>(snap.closedOrderSessions || [])
  const seqMap = new Map<string, number>()
  if (snap.terminalId && snap.seq > 0) {
    seqMap.set(normalizeTerminalId(snap.terminalId), snap.seq)
  }
  return {
    boundTerminalId: normalizedBound,
    snapshot: snap,
    closedOrderSessions: closedSet,
    processedPaymentIds: new Set<string>(),
    lastSeqByTerminal: seqMap,
    lastEventSignature: computeSnapshotSignature(snap),
  }
}

export function computeSnapshotSignature(snap: CustomerDisplaySnapshot): string {
  const itemsSig = snap.items
    .map((i) => `${i.variant_id}:${i.quantity}:${i.unitPrice}:${i.discountAmount}:${i.lineTotal}`)
    .join('|')
  const khqrSig = snap.khqr
    ? `${snap.khqr.tranId}:${snap.khqr.status}:${snap.khqr.verifying}:${snap.khqr.error || ''}:${snap.khqr.qrImage ? 'qr' : 'noqr'}`
    : ''
  const successSig = snap.success
    ? `${snap.success.paymentId}:${snap.success.amount}:${snap.success.changeDue}`
    : ''
  return [
    snap.terminalId,
    snap.orderSessionId,
    snap.state,
    snap.checkoutPhase,
    snap.subtotal.toFixed(2),
    snap.totalDiscount.toFixed(2),
    snap.taxAmount.toFixed(2),
    snap.grandTotal.toFixed(2),
    snap.appliedCouponCode || '',
    snap.customerName || '',
    itemsSig,
    khqrSig,
    successSig,
  ].join('~')
}

export interface ApplyDisplayEventResult {
  accepted: boolean
  ignoredReason?:
    | 'TERMINAL_MISMATCH'
    | 'DUPLICATE_EVENT'
    | 'OUT_OF_ORDER_SEQ'
    | 'OUTDATED_TIMESTAMP'
    | 'STALE_ORDER_SESSION'
    | 'DUPLICATE_PAYMENT_SUCCESS'
    | 'EXPIRED_PAYMENT_SUCCESS'
    | 'POST_PAYMENT_CLEAR_PRESERVED'
  playSuccessChime: boolean
  highlightedVariantId: string | null
  snapshot: CustomerDisplaySnapshot
}

/**
 * Pure, deterministic state transition function for the Customer Display.
 * Handles deduplication, out-of-order rejection, stale-order rejection,
 * KHQR countdown normalization, and payment-success race conditions.
 */
export function applyIncomingSnapshot(
  ctx: DisplayReceiverContext,
  incomingRaw: CustomerDisplaySnapshot,
  nowMs: number = Date.now(),
): ApplyDisplayEventResult {
  const current = ctx.snapshot
  const incoming: CustomerDisplaySnapshot = {
    ...incomingRaw,
    terminalId: normalizeTerminalId(incomingRaw.terminalId || current.terminalId || 'POS-01'),
    items: Array.isArray(incomingRaw.items) ? incomingRaw.items.map((i) => ({ ...i })) : [],
    khqr: incomingRaw.khqr ? { ...incomingRaw.khqr } : null,
    success: incomingRaw.success ? { ...incomingRaw.success } : null,
    closedOrderSessions: Array.isArray(incomingRaw.closedOrderSessions)
      ? [...incomingRaw.closedOrderSessions]
      : [],
  }

  // 0. Terminal isolation check when receiver is bound to a specific register ID
  const terminalId = incoming.terminalId
  if (ctx.boundTerminalId && terminalId !== ctx.boundTerminalId) {
    return {
      accepted: false,
      ignoredReason: 'TERMINAL_MISMATCH',
      playSuccessChime: false,
      highlightedVariantId: null,
      snapshot: current,
    }
  }

  // Merge closed sessions reported by the authoritative POS terminal
  for (const closedId of incoming.closedOrderSessions) {
    if (closedId) ctx.closedOrderSessions.add(closedId)
  }

  // If the cashier explicitly resumed a held order, reopen its orderSessionId
  if (incoming.reason === 'ORDER_RESUMED' && incoming.orderSessionId && incoming.items.length > 0) {
    ctx.closedOrderSessions.delete(incoming.orderSessionId)
  }

  const lastSeq = ctx.lastSeqByTerminal.get(terminalId) ?? 0

  // 1. Out-of-order sequence check for the same terminal
  if (incoming.seq > 0 && lastSeq > 0 && incoming.seq < lastSeq) {
    return {
      accepted: false,
      ignoredReason: 'OUT_OF_ORDER_SEQ',
      playSuccessChime: false,
      highlightedVariantId: null,
      snapshot: current,
    }
  }

  // 2. Outdated timestamp check when sequence is not strictly newer
  if (
    incoming.seq <= lastSeq &&
    current.timestamp > 0 &&
    incoming.timestamp > 0 &&
    incoming.timestamp < current.timestamp
  ) {
    return {
      accepted: false,
      ignoredReason: 'OUTDATED_TIMESTAMP',
      playSuccessChime: false,
      highlightedVariantId: null,
      snapshot: current,
    }
  }

  // 3. Stale / closed order session guard:
  // A delayed event from a cleared, held, or completed order must never restore old products or QR codes.
  if (
    (incoming.state === 'CART_ACTIVE' || incoming.state === 'PAYMENT_QR') &&
    incoming.orderSessionId &&
    ctx.closedOrderSessions.has(incoming.orderSessionId)
  ) {
    return {
      accepted: false,
      ignoredReason: 'STALE_ORDER_SESSION',
      playSuccessChime: false,
      highlightedVariantId: null,
      snapshot: current,
    }
  }

  // 4. Payment Success handling & deduplication
  if (incoming.state === 'PAYMENT_SUCCESS' && incoming.success) {
    const payId = incoming.success.paymentId || incoming.success.invoiceNumber || incoming.orderSessionId

    // If a newer order is already active in CART_ACTIVE with items, a delayed payment event
    // from an earlier order must never overwrite the new customer's order.
    if (
      current.state === 'CART_ACTIVE' &&
      current.items.length > 0 &&
      current.orderSessionId !== incoming.success.orderSessionId &&
      current.timestamp > incoming.success.completedAt
    ) {
      ctx.closedOrderSessions.add(incoming.success.orderSessionId)
      return {
        accepted: false,
        ignoredReason: 'STALE_ORDER_SESSION',
        playSuccessChime: false,
        highlightedVariantId: null,
        snapshot: current,
      }
    }

    // Duplicate payment completion guard
    if (ctx.processedPaymentIds.has(payId)) {
      return {
        accepted: false,
        ignoredReason: 'DUPLICATE_PAYMENT_SUCCESS',
        playSuccessChime: false,
        highlightedVariantId: null,
        snapshot: current,
      }
    }

    // If hydrating from storage after the 5-second celebration window has already passed,
    // transition cleanly to IDLE instead of flashing an old payment confirmation.
    const elapsed = nowMs - (incoming.success.completedAt || nowMs)
    if (elapsed >= PAYMENT_SUCCESS_DURATION_MS) {
      ctx.processedPaymentIds.add(payId)
      ctx.closedOrderSessions.add(incoming.success.orderSessionId)
      if (incoming.orderSessionId) ctx.closedOrderSessions.add(incoming.orderSessionId)
      const idleSnap = createEmptyDisplaySnapshot({
        seq: incoming.seq,
        timestamp: incoming.timestamp || nowMs,
        terminalId,
        orderSessionId: incoming.orderSessionId,
        storeName: incoming.storeName,
        branchName: incoming.branchName,
        receiptFooterNote: incoming.receiptFooterNote,
        exchangeRate: incoming.exchangeRate,
        state: 'IDLE',
        closedOrderSessions: Array.from(ctx.closedOrderSessions),
      })
      ctx.snapshot = idleSnap
      if (incoming.seq > 0) ctx.lastSeqByTerminal.set(terminalId, incoming.seq)
      ctx.lastEventSignature = computeSnapshotSignature(idleSnap)
      return {
        accepted: true,
        ignoredReason: 'EXPIRED_PAYMENT_SUCCESS',
        playSuccessChime: false,
        highlightedVariantId: null,
        snapshot: idleSnap,
      }
    }

    // Valid new PAYMENT_SUCCESS transition
    ctx.processedPaymentIds.add(payId)
    if (incoming.success.orderSessionId) {
      ctx.closedOrderSessions.add(incoming.success.orderSessionId)
    }
    incoming.items = []
    incoming.totalItemsCount = 0
    incoming.uniqueItemsCount = 0
    incoming.khqr = null
    incoming.closedOrderSessions = Array.from(ctx.closedOrderSessions)
    ctx.snapshot = incoming
    if (incoming.seq > 0) ctx.lastSeqByTerminal.set(terminalId, incoming.seq)
    ctx.lastEventSignature = computeSnapshotSignature(incoming)
    return {
      accepted: true,
      playSuccessChime: true,
      highlightedVariantId: null,
      snapshot: incoming,
    }
  }

  // 5. Preserve active PAYMENT_SUCCESS screen when automatic post-payment cart clear arrives
  // (e.g., posStore.clearCart() firing 1.2s after ABA approval while the 5s success screen is showing),
  // UNLESS the cashier explicitly started a new sale ('START_NEW_SALE' / 'MANUAL_CLEAR') or scanned a new item.
  if (
    current.state === 'PAYMENT_SUCCESS' &&
    incoming.state === 'IDLE' &&
    incoming.items.length === 0 &&
    incoming.reason !== 'START_NEW_SALE' &&
    incoming.reason !== 'MANUAL_CLEAR'
  ) {
    if (incoming.seq > 0) ctx.lastSeqByTerminal.set(terminalId, incoming.seq)
    // Update the underlying orderSessionId so the next customer's session is tracked,
    // but keep the PAYMENT_SUCCESS display visible until its timer completes or next item is added.
    const preserved: CustomerDisplaySnapshot = {
      ...current,
      seq: Math.max(current.seq, incoming.seq),
      timestamp: Math.max(current.timestamp, incoming.timestamp),
      orderSessionId: incoming.orderSessionId || current.orderSessionId,
      closedOrderSessions: Array.from(ctx.closedOrderSessions),
    }
    ctx.snapshot = preserved
    return {
      accepted: false,
      ignoredReason: 'POST_PAYMENT_CLEAR_PRESERVED',
      playSuccessChime: false,
      highlightedVariantId: null,
      snapshot: preserved,
    }
  }

  // 6. When transitioning to IDLE via manual clear or hold, mark previous active order session closed
  if (
    incoming.state === 'IDLE' &&
    current.orderSessionId &&
    (incoming.reason === 'MANUAL_CLEAR' ||
      incoming.reason === 'ORDER_HELD' ||
      incoming.orderSessionId !== current.orderSessionId)
  ) {
    if (current.items.length > 0) {
      ctx.closedOrderSessions.add(current.orderSessionId)
    }
  }

  // 7. When switching active orders (e.g. resuming a held cart over an existing cart),
  // close the replaced order session so delayed events from it cannot leak.
  if (
    current.orderSessionId &&
    incoming.orderSessionId &&
    current.orderSessionId !== incoming.orderSessionId &&
    current.items.length > 0
  ) {
    ctx.closedOrderSessions.add(current.orderSessionId)
  }

  // 8. Normalize KHQR expiration on arrival
  if (incoming.state === 'PAYMENT_QR' && incoming.khqr) {
    if (incoming.khqr.expiresAt && incoming.khqr.status === 'PENDING') {
      const expMs = new Date(incoming.khqr.expiresAt).getTime()
      if (Number.isFinite(expMs)) {
        const computedSec = Math.max(0, Math.round((expMs - nowMs) / 1000))
        incoming.khqr.secondsLeft = computedSec
        if (computedSec <= 0) {
          incoming.khqr.status = 'EXPIRED'
        }
      }
    } else if (incoming.khqr.status === 'PENDING' && incoming.khqr.secondsLeft <= 0 && incoming.reason === 'KHQR_COUNTDOWN') {
      incoming.khqr.status = 'EXPIRED'
    }
    if (incoming.khqr.status === 'EXPIRED') {
      incoming.khqr.qrImage = ''
    }
  }

  // 9. Duplicate payload check (avoid re-triggering animations on identical state)
  const incomingSig = computeSnapshotSignature(incoming)
  if (
    incoming.seq === lastSeq &&
    incomingSig === ctx.lastEventSignature &&
    incoming.reason !== 'KHQR_COUNTDOWN'
  ) {
    // Still allow countdown updates to pass through if secondsLeft changed
    const sameCountdown =
      incoming.state !== 'PAYMENT_QR' ||
      current.khqr?.secondsLeft === incoming.khqr?.secondsLeft
    if (sameCountdown) {
      return {
        accepted: false,
        ignoredReason: 'DUPLICATE_EVENT',
        playSuccessChime: false,
        highlightedVariantId: null,
        snapshot: current,
      }
    }
  }

  // 10. Detect which item was added or updated for subtle visual highlight
  let highlightedVariantId: string | null = null
  if (incoming.state === 'CART_ACTIVE' && incoming.items.length > 0) {
    const prevMap = new Map<string, CustomerDisplayLineItem>()
    for (const prevItem of current.items) {
      prevMap.set(prevItem.variant_id, prevItem)
    }
    for (const nextItem of incoming.items) {
      const prev = prevMap.get(nextItem.variant_id)
      if (
        !prev ||
        prev.quantity !== nextItem.quantity ||
        prev.lineTotal !== nextItem.lineTotal ||
        prev.discountAmount !== nextItem.discountAmount
      ) {
        highlightedVariantId = nextItem.variant_id
      }
    }
    if (!highlightedVariantId && incoming.lastUpdatedVariantId) {
      const exists = incoming.items.some((i) => i.variant_id === incoming.lastUpdatedVariantId)
      if (exists && current.items.length === 0) {
        highlightedVariantId = incoming.lastUpdatedVariantId
      }
    }
  }

  // Ensure IDLE state never retains stale items, discounts, or payment data
  if (incoming.state === 'IDLE' || (incoming.state === 'CART_ACTIVE' && incoming.items.length === 0)) {
    incoming.state = 'IDLE'
    incoming.checkoutPhase = 'SHOPPING'
    incoming.items = []
    incoming.totalItemsCount = 0
    incoming.uniqueItemsCount = 0
    incoming.subtotal = 0
    incoming.itemDiscountsTotal = 0
    incoming.orderDiscount = 0
    incoming.totalDiscount = 0
    incoming.appliedCouponCode = null
    incoming.appliedCouponName = null
    incoming.taxAmount = 0
    incoming.grandTotal = 0
    incoming.khrGrandTotal = 0
    incoming.lastUpdatedVariantId = null
    incoming.khqr = null
    incoming.success = null
  }

  incoming.closedOrderSessions = Array.from(ctx.closedOrderSessions)
  ctx.snapshot = incoming
  if (incoming.seq > 0) {
    ctx.lastSeqByTerminal.set(terminalId, incoming.seq)
  }
  ctx.lastEventSignature = incomingSig

  return {
    accepted: true,
    playSuccessChime: false,
    highlightedVariantId,
    snapshot: incoming,
  }
}

/**
 * Convert legacy BroadcastChannel messages (SYNC_CART, SHOW_KHQR, UPDATE_COUNTDOWN,
 * PAYMENT_SUCCESS, CANCEL_PAYMENT, CLEAR_CART) into a full CustomerDisplaySnapshot
 * so both new and legacy messages pass through the same validated state machine.
 */
export function normalizeMessageToSnapshot(
  msg: CustomerDisplayMessage,
  current: CustomerDisplaySnapshot,
  nowMs: number = Date.now(),
): CustomerDisplaySnapshot | null {
  if (!msg || typeof msg !== 'object') return null

  if (msg.type === 'SYNC_SNAPSHOT' && msg.snapshot) {
    return msg.snapshot
  }

  const payload = msg.payload || {}
  const seq = typeof msg.seq === 'number' ? msg.seq : (typeof payload.seq === 'number' ? payload.seq : current.seq + 1)
  const timestamp = typeof msg.timestamp === 'number' ? msg.timestamp : (typeof payload.timestamp === 'number' ? payload.timestamp : nowMs)
  const orderSessionId =
    msg.orderSessionId || payload.orderSessionId || current.orderSessionId || 'ord_legacy'
  const terminalId = msg.terminalId || payload.terminalId || current.terminalId || 'POS-01'

  if (msg.type === 'SYNC_CART') {
    const rawItems: any[] = Array.isArray(payload.items) ? payload.items : []
    const items: CustomerDisplayLineItem[] = rawItems.map((raw) => {
      if (raw.variant) return mapCartItemToDisplayItem(raw)
      const qty = Math.max(1, Number(raw.quantity) || 1)
      const unitPrice = roundCurrency(Number(raw.unitPrice ?? raw.price ?? 0))
      const discountAmount = roundCurrency(Math.max(0, Number(raw.discountAmount ?? 0)))
      const lineSubtotal = roundCurrency(unitPrice * qty)
      const lineTotal = roundCurrency(
        raw.lineTotal !== undefined
          ? Number(raw.lineTotal)
          : raw.total !== undefined
            ? Number(raw.total)
            : Math.max(0, lineSubtotal - discountAmount),
      )
      return {
        variant_id: String(raw.variant_id || ''),
        sku: String(raw.sku || ''),
        name: String(raw.name || 'Apparel Item'),
        brandName: String(raw.brandName || ''),
        categoryName: String(raw.categoryName || ''),
        colorName: String(raw.colorName || ''),
        colorHex: String(raw.colorHex || ''),
        sizeName: String(raw.sizeName || ''),
        variantInfo: String(raw.variantInfo || ''),
        imageUrl: String(raw.imageUrl || ''),
        quantity: qty,
        unitPrice,
        discountAmount,
        lineSubtotal,
        lineTotal,
      }
    })

    const subtotal = roundCurrency(Number(payload.subtotal ?? items.reduce((s, i) => s + i.lineSubtotal, 0)))
    const itemDiscountsTotal = roundCurrency(
      Number(payload.itemDiscountsTotal ?? items.reduce((s, i) => s + i.discountAmount, 0)),
    )
    const totalDiscount = roundCurrency(Number(payload.totalDiscount ?? payload.discount ?? itemDiscountsTotal))
    const orderDiscount = roundCurrency(
      Number(payload.orderDiscount ?? Math.max(0, totalDiscount - itemDiscountsTotal)),
    )
    const taxRate = typeof payload.taxRate === 'number' ? payload.taxRate : current.taxRate
    const taxAmount = roundCurrency(Number(payload.taxAmount ?? payload.tax ?? 0))
    const grandTotal = roundCurrency(Number(payload.grandTotal ?? Math.max(0, subtotal - totalDiscount + taxAmount)))

    return {
      ...current,
      seq,
      timestamp,
      terminalId,
      orderSessionId,
      reason: payload.reason || (items.length > 0 ? 'CART_UPDATED' : 'MANUAL_CLEAR'),
      storeName: payload.storeName || current.storeName,
      branchName: payload.branchName || current.branchName,
      state: items.length > 0 ? 'CART_ACTIVE' : 'IDLE',
      checkoutPhase: payload.checkoutPhase || 'SHOPPING',
      customerName: payload.customerName !== undefined ? payload.customerName : current.customerName,
      customerTier: payload.customerTier !== undefined ? payload.customerTier : current.customerTier,
      items,
      totalItemsCount: items.reduce((sum, i) => sum + i.quantity, 0),
      uniqueItemsCount: items.length,
      subtotal,
      itemDiscountsTotal,
      orderDiscount,
      totalDiscount,
      appliedCouponCode: payload.appliedCouponCode !== undefined ? payload.appliedCouponCode : null,
      appliedCouponName: payload.appliedCouponName !== undefined ? payload.appliedCouponName : null,
      taxRate,
      taxAmount,
      grandTotal,
      khrGrandTotal: toKhrAmount(grandTotal, current.exchangeRate),
      lastUpdatedVariantId: payload.lastUpdatedVariantId || null,
      khqr: null,
      success: null,
      closedOrderSessions: Array.isArray(payload.closedOrderSessions)
        ? payload.closedOrderSessions
        : current.closedOrderSessions,
    }
  }

  if (msg.type === 'SHOW_KHQR') {
    const amount = roundCurrency(Number(payload.amount ?? current.grandTotal))
    const status: CustomerDisplayKhqrStatus = payload.status || (payload.qrImage ? 'PENDING' : 'LOADING')
    return {
      ...current,
      seq,
      timestamp,
      terminalId,
      orderSessionId,
      reason: status === 'LOADING' ? 'KHQR_LOADING' : 'KHQR_PENDING',
      state: 'PAYMENT_QR',
      khqr: {
        saleId: String(payload.saleId || ''),
        paymentId: String(payload.paymentId || ''),
        tranId: String(payload.tran_id || payload.tranId || ''),
        amount,
        khrAmount: toKhrAmount(amount, current.exchangeRate),
        qrImage: String(payload.qrImage || ''),
        qrString: String(payload.qrString || ''),
        status,
        error: payload.error || null,
        verifying: Boolean(payload.verifying),
        apv: payload.apv || null,
        expiresAt: payload.expiresAt || null,
        secondsLeft: typeof payload.secondsLeft === 'number' ? payload.secondsLeft : 180,
      },
      success: null,
    }
  }

  if (msg.type === 'UPDATE_COUNTDOWN') {
    if (current.state !== 'PAYMENT_QR' || !current.khqr) return null
    const secondsLeft = Math.max(0, Number(payload.secondsLeft) || 0)
    const nextStatus: CustomerDisplayKhqrStatus =
      payload.status || (secondsLeft <= 0 && current.khqr.status === 'PENDING' ? 'EXPIRED' : current.khqr.status)
    return {
      ...current,
      seq,
      timestamp,
      terminalId,
      orderSessionId: current.orderSessionId,
      reason: secondsLeft <= 0 ? 'KHQR_EXPIRED' : 'KHQR_COUNTDOWN',
      state: 'PAYMENT_QR',
      khqr: {
        ...current.khqr,
        secondsLeft,
        status: nextStatus,
        verifying: payload.verifying !== undefined ? Boolean(payload.verifying) : current.khqr.verifying,
        error: payload.error !== undefined ? payload.error : current.khqr.error,
      },
    }
  }

  if (msg.type === 'PAYMENT_SUCCESS') {
    const amount = roundCurrency(Number(payload.amount ?? current.grandTotal))
    const completedAt = Number(payload.completedAt) || nowMs
    const targetSessionId = payload.orderSessionId || msg.orderSessionId || current.orderSessionId
    const paymentId = String(
      payload.paymentId || payload.invoiceNumber || payload.tran_id || `${targetSessionId}_${completedAt}`,
    )
    return {
      ...current,
      seq,
      timestamp,
      terminalId,
      orderSessionId: targetSessionId,
      reason: 'PAYMENT_APPROVED',
      state: 'PAYMENT_SUCCESS',
      checkoutPhase: 'SHOPPING',
      khqr: null,
      success: {
        paymentId,
        orderSessionId: targetSessionId,
        invoiceNumber: String(payload.invoiceNumber || ''),
        amount,
        khrAmount: toKhrAmount(amount, current.exchangeRate),
        paymentMethod: String(payload.paymentMethod || 'ABA KHQR'),
        tenderedAmount:
          payload.tenderedAmount !== undefined && payload.tenderedAmount !== null
            ? roundCurrency(Number(payload.tenderedAmount))
            : null,
        changeDue: roundCurrency(Math.max(0, Number(payload.changeDue) || 0)),
        itemCount: Number(payload.itemCount ?? current.totalItemsCount ?? 0),
        completedAt,
      },
    }
  }

  if (msg.type === 'CANCEL_PAYMENT') {
    return {
      ...current,
      seq,
      timestamp,
      terminalId,
      orderSessionId,
      reason: 'PAYMENT_CANCELLED',
      state: current.items.length > 0 ? 'CART_ACTIVE' : 'IDLE',
      checkoutPhase: payload.checkoutPhase || 'SHOPPING',
      khqr: null,
    }
  }

  if (msg.type === 'CLEAR_CART' || msg.type === 'START_NEW_SALE') {
    const reason: CustomerDisplayTransitionReason =
      msg.type === 'START_NEW_SALE'
        ? 'START_NEW_SALE'
        : payload.reason || 'MANUAL_CLEAR'
    return createEmptyDisplaySnapshot({
      seq,
      timestamp,
      terminalId,
      orderSessionId,
      reason,
      storeName: current.storeName,
      branchName: current.branchName,
      receiptFooterNote: current.receiptFooterNote,
      exchangeRate: current.exchangeRate,
      state: 'IDLE',
      closedOrderSessions: current.orderSessionId
        ? [...current.closedOrderSessions, current.orderSessionId]
        : current.closedOrderSessions,
    })
  }

  return null
}

// ── Storage Persistence Helpers ──────────────────────────────────────────────

export function saveDisplaySnapshotToStorage(snapshot: CustomerDisplaySnapshot): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try {
    const serialized = JSON.stringify(snapshot)
    localStorage.setItem(getSnapshotStorageKey(snapshot.terminalId), serialized)
    localStorage.setItem(CUSTOMER_DISPLAY_SNAPSHOT_KEY, serialized)
  } catch {
    // Ignore quota or storage errors
  }
}

export function loadInitialDisplaySnapshotFromStorage(
  terminalId?: string | null,
): CustomerDisplaySnapshot {
  const normTerminalId = normalizeTerminalId(terminalId)
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return createEmptyDisplaySnapshot({ terminalId: normTerminalId })
  }

  let rawSettings: any = null
  try {
    const sRaw = localStorage.getItem(POS_SETTINGS_STORAGE_KEY)
    if (sRaw) rawSettings = JSON.parse(sRaw)
  } catch { /* ignore */ }

  const resolvedTerminalId = normalizeTerminalId(terminalId || rawSettings?.terminalId || 'POS-01')

  let rawSession: any = null
  try {
    const pRaw = localStorage.getItem(POS_SESSION_STORAGE_KEY)
    if (pRaw) rawSession = JSON.parse(pRaw)
  } catch { /* ignore */ }

  let storedSnapshot: CustomerDisplaySnapshot | null = null
  try {
    const scopedRaw = localStorage.getItem(getSnapshotStorageKey(resolvedTerminalId))
    const fallbackRaw = localStorage.getItem(CUSTOMER_DISPLAY_SNAPSHOT_KEY)
    const dRaw = scopedRaw || fallbackRaw
    if (dRaw) {
      const parsed = JSON.parse(dRaw)
      if (
        parsed &&
        parsed.version === 1 &&
        normalizeTerminalId(parsed.terminalId) === resolvedTerminalId
      ) {
        storedSnapshot = parsed as CustomerDisplaySnapshot
      }
    }
  } catch { /* ignore */ }

  const settingsTerminalId = normalizeTerminalId(rawSettings?.terminalId || 'POS-01')
  const sessionMatchesTerminal = settingsTerminalId === resolvedTerminalId

  // Build snapshot from pos_session_v2 if it belongs to this terminal
  const sessionSnapshot = buildSnapshotFromRawPosStorage(
    sessionMatchesTerminal ? rawSession : null,
    rawSettings,
    resolvedTerminalId,
  )

  if (storedSnapshot) {
    // Update settings branding if settings changed in localStorage
    if (rawSettings?.receiptStoreName) {
      storedSnapshot.storeName = rawSettings.receiptStoreName
    }
    if (rawSettings?.receiptFooterNote) {
      storedSnapshot.receiptFooterNote = rawSettings.receiptFooterNote
    }

    // Check if pos_session_v2 has a different orderSessionId or newer sequence than storedSnapshot
    const sessionHasItems = sessionSnapshot.items.length > 0
    const storedOrderMatchesSession =
      !rawSession?.orderSessionId || storedSnapshot.orderSessionId === rawSession.orderSessionId

    // If storedSnapshot is in PAYMENT_QR or PAYMENT_SUCCESS for the current session, preserve it!
    if (
      storedOrderMatchesSession &&
      (storedSnapshot.state === 'PAYMENT_QR' || storedSnapshot.state === 'PAYMENT_SUCCESS')
    ) {
      return storedSnapshot
    }

    // If pos_session_v2 has newer sequence or mismatched session state, prefer the authoritative pos_session_v2
    if (!storedOrderMatchesSession || (rawSession && sessionSnapshot.seq > storedSnapshot.seq)) {
      return {
        ...sessionSnapshot,
        branchName: storedSnapshot.branchName || sessionSnapshot.branchName,
      }
    }

    // If pos_session_v2 was cleared (0 items) while storedSnapshot still had CART_ACTIVE, sync to empty
    if (rawSession && !sessionHasItems && storedSnapshot.state === 'CART_ACTIVE') {
      return {
        ...sessionSnapshot,
        branchName: storedSnapshot.branchName || sessionSnapshot.branchName,
      }
    }

    return storedSnapshot
  }

  return sessionSnapshot
}
