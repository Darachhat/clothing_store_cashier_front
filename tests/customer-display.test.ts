import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  KHR_EXCHANGE_RATE,
  roundCurrency,
  formatUsd,
  toKhrAmount,
  formatCountdownMmSs,
  normalizeTerminalId,
  getSnapshotStorageKey,
  getHeartbeatStorageKey,
  mapCartItemToDisplayItem,
  createEmptyDisplaySnapshot,
  buildSnapshotFromRawPosStorage,
  createDisplayReceiverContext,
  applyIncomingSnapshot,
  normalizeMessageToSnapshot,
  type CustomerDisplaySnapshot,
} from '../app/composables/useCustomerDisplaySync.ts'

describe('POS Customer Display — Architecture, Lifecycle & Reliability Suite', () => {
  // ── Flow 1: Initial Page Load & Storage Hydration (Risk 1 & Risk 5) ──
  describe('Flow 1: Initial Page Load & Storage Hydration', () => {
    it('renders IDLE empty state when no active order exists in storage', () => {
      const snap = buildSnapshotFromRawPosStorage(null, {
        receiptStoreName: 'Clothing Store Phnom Penh',
        receiptFooterNote: 'Exchange within 7 days',
      })
      assert.equal(snap.state, 'IDLE')
      assert.equal(snap.items.length, 0)
      assert.equal(snap.grandTotal, 0)
      assert.equal(snap.storeName, 'Clothing Store Phnom Penh')
    })

    it('hydrates active order when customer display is opened mid-order (Risk 1)', () => {
      const rawSession = {
        orderSessionId: 'ord_mid_1',
        stateSeq: 7,
        branchName: 'BKK1 Flagship',
        cart: [
          {
            variant_id: 'var_shirt_m',
            quantity: 2,
            unit_price: 24.5,
            discount_amount: 0,
            subtotal: 49.0,
            variant: {
              id: 'var_shirt_m',
              sku: 'SHIRT-BLK-M',
              image_url: null,
              product: { name: 'Linen Relaxed Shirt', image_url: '/images/products/linen-shirt.jpg' },
              color: { name: 'Black', hex_code: '#111827' },
              size: { name: 'M' },
            },
          },
        ],
        discountAmount: 0,
        taxRate: 0,
        selectedCustomer: { name: 'Sokha Chan' },
        appliedCoupon: null,
      }

      const hydrated = buildSnapshotFromRawPosStorage(rawSession, {
        receiptStoreName: 'Clothing Store Phnom Penh',
      })
      assert.equal(hydrated.state, 'CART_ACTIVE')
      assert.equal(hydrated.orderSessionId, 'ord_mid_1')
      assert.equal(hydrated.branchName, 'BKK1 Flagship')
      assert.equal(hydrated.customerName, 'Sokha Chan')
      assert.equal(hydrated.items.length, 1)
      assert.equal(hydrated.items[0]!.name, 'Linen Relaxed Shirt')
      assert.equal(hydrated.items[0]!.imageUrl, '/images/products/linen-shirt.jpg')
      assert.equal(hydrated.items[0]!.colorName, 'Black')
      assert.equal(hydrated.items[0]!.sizeName, 'M')
      assert.equal(hydrated.grandTotal, 49.0)
      assert.equal(hydrated.khrGrandTotal, toKhrAmount(49.0))
    })

    it('preserves active ABA KHQR checkout state when page is refreshed during checkout (Risk 5)', () => {
      const ctx = createDisplayReceiverContext()
      const now = Date.now()
      const expiresIso = new Date(now + 120_000).toISOString()

      const qrSnapshot: CustomerDisplaySnapshot = {
        ...createEmptyDisplaySnapshot({
          seq: 12,
          timestamp: now,
          orderSessionId: 'ord_qr_refresh',
          reason: 'KHQR_PENDING',
          state: 'PAYMENT_QR',
          checkoutPhase: 'PAYMENT_SELECTION',
          items: [
            mapCartItemToDisplayItem({
              variant_id: 'var_1',
              quantity: 1,
              unit_price: 55.0,
              discount_amount: 0,
              subtotal: 55.0,
              variant: { id: 'var_1', product: { name: 'Wool Blazer' } } as any,
            }),
          ],
          totalItemsCount: 1,
          uniqueItemsCount: 1,
          subtotal: 55.0,
          grandTotal: 55.0,
          khrGrandTotal: toKhrAmount(55.0),
          khqr: {
            saleId: 'sale_991',
            paymentId: 'pay_991',
            tranId: 'TXN-991',
            amount: 55.0,
            khrAmount: toKhrAmount(55.0),
            qrImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
            qrString: '000201010212...',
            status: 'PENDING',
            error: null,
            verifying: false,
            apv: null,
            expiresAt: expiresIso,
            secondsLeft: 120,
          },
        }),
      }

      const res = applyIncomingSnapshot(ctx, qrSnapshot, now)
      assert.equal(res.accepted, true)
      assert.equal(res.snapshot.state, 'PAYMENT_QR')
      assert.equal(res.snapshot.khqr?.status, 'PENDING')
      assert.equal(res.snapshot.khqr?.tranId, 'TXN-991')
      assert.ok((res.snapshot.khqr?.secondsLeft ?? 0) > 0)
      assert.equal(res.snapshot.grandTotal, 55.0)
    })
  })

  // ── Flow 2 & Flow 3: Product Added & Quantity Changed ───────────────
  describe('Flow 2 & Flow 3: Product Added, Quantity Changed & Duplicate Event Protection', () => {
    it('adds products, updates quantities across variants without duplication, highlights updated row, and rejects duplicate/out-of-order events', () => {
      const ctx = createDisplayReceiverContext()
      const now = Date.now()

      const itemTeeM = mapCartItemToDisplayItem({
        variant_id: 'var_tee_m',
        quantity: 1,
        unit_price: 15.0,
        discount_amount: 0,
        subtotal: 15.0,
        variant: {
          id: 'var_tee_m',
          product: { name: 'Essential Cotton Tee', image_url: '/img/tee.png' },
          color: { name: 'White', hex_code: '#ffffff' },
          size: { name: 'M' },
        } as any,
      })

      // Scan 1st product (Size M)
      const snap1 = createEmptyDisplaySnapshot({
        seq: 1,
        timestamp: now,
        orderSessionId: 'ord_live_100',
        reason: 'ITEM_ADDED',
        state: 'CART_ACTIVE',
        lastUpdatedVariantId: 'var_tee_m',
        items: [itemTeeM],
        totalItemsCount: 1,
        uniqueItemsCount: 1,
        subtotal: 15.0,
        grandTotal: 15.0,
        khrGrandTotal: toKhrAmount(15.0),
      })

      const res1 = applyIncomingSnapshot(ctx, snap1, now)
      assert.equal(res1.accepted, true)
      assert.equal(res1.highlightedVariantId, 'var_tee_m')
      assert.equal(res1.snapshot.state, 'CART_ACTIVE')
      assert.equal(res1.snapshot.items.length, 1)

      // Duplicate emission of seq 1 must be rejected
      const dupRes = applyIncomingSnapshot(ctx, snap1, now + 10)
      assert.equal(dupRes.accepted, false)
      assert.equal(dupRes.ignoredReason, 'DUPLICATE_EVENT')

      // Scan different variant of same product (Size L) + increase Size M quantity to 3
      const itemTeeMQty3 = mapCartItemToDisplayItem({
        variant_id: 'var_tee_m',
        quantity: 3,
        unit_price: 15.0,
        discount_amount: 0,
        subtotal: 45.0,
        variant: {
          id: 'var_tee_m',
          product: { name: 'Essential Cotton Tee', image_url: '/img/tee.png' },
          color: { name: 'White', hex_code: '#ffffff' },
          size: { name: 'M' },
        } as any,
      })
      const itemTeeLQty1 = mapCartItemToDisplayItem({
        variant_id: 'var_tee_l',
        quantity: 1,
        unit_price: 15.0,
        discount_amount: 0,
        subtotal: 15.0,
        variant: {
          id: 'var_tee_l',
          product: { name: 'Essential Cotton Tee', image_url: '/img/tee.png' },
          color: { name: 'Black', hex_code: '#000000' },
          size: { name: 'L' },
        } as any,
      })

      const snap2 = createEmptyDisplaySnapshot({
        seq: 2,
        timestamp: now + 100,
        orderSessionId: 'ord_live_100',
        reason: 'QTY_CHANGED',
        state: 'CART_ACTIVE',
        lastUpdatedVariantId: 'var_tee_m',
        items: [itemTeeMQty3, itemTeeLQty1],
        totalItemsCount: 4,
        uniqueItemsCount: 2,
        subtotal: 60.0,
        grandTotal: 60.0,
        khrGrandTotal: toKhrAmount(60.0),
      })

      const res2 = applyIncomingSnapshot(ctx, snap2, now + 100)
      assert.equal(res2.accepted, true)
      assert.equal(res2.snapshot.items.length, 2)
      assert.equal(res2.snapshot.items[0]!.variant_id, 'var_tee_m')
      assert.equal(res2.snapshot.items[0]!.quantity, 3)
      assert.equal(res2.snapshot.items[0]!.lineTotal, 45.0)
      assert.equal(res2.snapshot.items[1]!.variant_id, 'var_tee_l')
      assert.equal(res2.snapshot.items[1]!.sizeName, 'L')
      assert.equal(res2.snapshot.grandTotal, 60.0)

      // Out-of-order older seq 1 arriving after seq 2 must be rejected
      const outOfOrderRes = applyIncomingSnapshot(ctx, snap1, now + 200)
      assert.equal(outOfOrderRes.accepted, false)
      assert.equal(outOfOrderRes.ignoredReason, 'OUT_OF_ORDER_SEQ')
    })
  })

  // ── Flow 4: Product Removed or Cart Cleared (Risk 2) ────────────────
  describe('Flow 4: Product Removed or Cart Cleared & Stale Event Protection (Risk 2)', () => {
    it('removes a single line item, then clears cart and blocks delayed events from the cleared order', () => {
      const ctx = createDisplayReceiverContext()
      const now = Date.now()

      const itemA = mapCartItemToDisplayItem({
        variant_id: 'v_a',
        quantity: 1,
        unit_price: 30,
        discount_amount: 0,
        subtotal: 30,
        variant: { id: 'v_a', product: { name: 'Item A' } } as any,
      })
      const itemB = mapCartItemToDisplayItem({
        variant_id: 'v_b',
        quantity: 1,
        unit_price: 20,
        discount_amount: 0,
        subtotal: 20,
        variant: { id: 'v_b', product: { name: 'Item B' } } as any,
      })

      // Active order ord_clear_test with 2 items and discount
      const activeSnap = createEmptyDisplaySnapshot({
        seq: 5,
        timestamp: now,
        orderSessionId: 'ord_clear_test',
        state: 'CART_ACTIVE',
        items: [itemA, itemB],
        totalItemsCount: 2,
        uniqueItemsCount: 2,
        subtotal: 50,
        orderDiscount: 5,
        totalDiscount: 5,
        appliedCouponCode: 'SAVE5',
        taxAmount: 4.5,
        taxRate: 0.1,
        grandTotal: 49.5,
      })
      applyIncomingSnapshot(ctx, activeSnap, now)
      assert.equal(ctx.snapshot.items.length, 2)
      assert.equal(ctx.snapshot.grandTotal, 49.5)

      // Remove Item A
      const afterRemoveSnap = createEmptyDisplaySnapshot({
        seq: 6,
        timestamp: now + 100,
        orderSessionId: 'ord_clear_test',
        state: 'CART_ACTIVE',
        items: [itemB],
        totalItemsCount: 1,
        uniqueItemsCount: 1,
        subtotal: 20,
        taxAmount: 2.0,
        taxRate: 0.1,
        grandTotal: 22.0,
      })
      applyIncomingSnapshot(ctx, afterRemoveSnap, now + 100)
      assert.equal(ctx.snapshot.items.length, 1)
      assert.equal(ctx.snapshot.items[0]!.variant_id, 'v_b')
      assert.equal(ctx.snapshot.grandTotal, 22.0)

      // Cashier clears the entire cart -> new orderSessionId generated, old session closed
      const clearedSnap = createEmptyDisplaySnapshot({
        seq: 7,
        timestamp: now + 200,
        orderSessionId: 'ord_fresh_session',
        reason: 'MANUAL_CLEAR',
        state: 'IDLE',
        closedOrderSessions: ['ord_clear_test'],
      })
      const clearRes = applyIncomingSnapshot(ctx, clearedSnap, now + 200)
      assert.equal(clearRes.accepted, true)
      assert.equal(ctx.snapshot.state, 'IDLE')
      assert.equal(ctx.snapshot.items.length, 0)
      assert.equal(ctx.snapshot.subtotal, 0)
      assert.equal(ctx.snapshot.totalDiscount, 0)
      assert.equal(ctx.snapshot.taxAmount, 0)
      assert.equal(ctx.snapshot.grandTotal, 0)
      assert.equal(ctx.snapshot.appliedCouponCode, null)

      // Delayed event from 'ord_clear_test' arrives late even with higher seq -> MUST BE REJECTED
      const delayedStaleSnap = createEmptyDisplaySnapshot({
        seq: 8,
        timestamp: now + 300,
        orderSessionId: 'ord_clear_test',
        state: 'CART_ACTIVE',
        items: [itemB],
        subtotal: 20,
        grandTotal: 20,
      })
      const staleRes = applyIncomingSnapshot(ctx, delayedStaleSnap, now + 300)
      assert.equal(staleRes.accepted, false)
      assert.equal(staleRes.ignoredReason, 'STALE_ORDER_SESSION')
      assert.equal(ctx.snapshot.state, 'IDLE')
      assert.equal(ctx.snapshot.items.length, 0)
    })
  })

  // ── Flow 5: Order Held or Switched ──────────────────────────────────
  describe('Flow 5: Order Held or Switched', () => {
    it('parks an active order (clearing display to IDLE) and cleanly resumes a held order later', () => {
      const ctx = createDisplayReceiverContext()
      const now = Date.now()

      const dressItem = mapCartItemToDisplayItem({
        variant_id: 'v_dress',
        quantity: 1,
        unit_price: 88,
        discount_amount: 0,
        subtotal: 88,
        variant: { id: 'v_dress', product: { name: 'Silk Midi Dress' } } as any,
      })

      // Order 1 active
      const order1Snap = createEmptyDisplaySnapshot({
        seq: 10,
        timestamp: now,
        orderSessionId: 'ord_hold_1',
        state: 'CART_ACTIVE',
        items: [dressItem],
        totalItemsCount: 1,
        uniqueItemsCount: 1,
        subtotal: 88,
        grandTotal: 88,
      })
      applyIncomingSnapshot(ctx, order1Snap, now)
      assert.equal(ctx.snapshot.state, 'CART_ACTIVE')
      assert.equal(ctx.snapshot.grandTotal, 88)

      // Cashier holds Order 1 -> active cart becomes empty under ord_new_2, ord_hold_1 is closed
      const heldSnap = createEmptyDisplaySnapshot({
        seq: 11,
        timestamp: now + 100,
        orderSessionId: 'ord_new_2',
        reason: 'ORDER_HELD',
        state: 'IDLE',
        closedOrderSessions: ['ord_hold_1'],
      })
      applyIncomingSnapshot(ctx, heldSnap, now + 100)
      assert.equal(ctx.snapshot.state, 'IDLE')
      assert.equal(ctx.snapshot.items.length, 0)

      // Cashier later resumes Order 1 with reason: 'ORDER_RESUMED'
      const resumedSnap = createEmptyDisplaySnapshot({
        seq: 12,
        timestamp: now + 200,
        orderSessionId: 'ord_resumed_3',
        reason: 'ORDER_RESUMED',
        state: 'CART_ACTIVE',
        closedOrderSessions: ['ord_hold_1', 'ord_new_2'],
        items: [dressItem],
        totalItemsCount: 1,
        uniqueItemsCount: 1,
        subtotal: 88,
        grandTotal: 88,
      })
      const resumeRes = applyIncomingSnapshot(ctx, resumedSnap, now + 200)
      assert.equal(resumeRes.accepted, true)
      assert.equal(ctx.snapshot.state, 'CART_ACTIVE')
      assert.equal(ctx.snapshot.items.length, 1)
      assert.equal(ctx.snapshot.items[0]!.name, 'Silk Midi Dress')
      assert.equal(ctx.snapshot.grandTotal, 88)
    })
  })

  // ── Flow 6: Discount, Promo Code, Tax & KHR Conversion ──────────────
  describe('Flow 6: Discount, Promo Code, Tax & KHR Exchange Rate', () => {
    it('synchronizes item discounts, promo codes, VAT tax, and KHR conversion accurately', () => {
      const rawSession = {
        orderSessionId: 'ord_promo',
        stateSeq: 20,
        cart: [
          {
            variant_id: 'v_jacket',
            quantity: 1,
            unit_price: 100.0,
            discount_amount: 10.0,
            subtotal: 90.0,
            variant: { id: 'v_jacket', product: { name: 'Bomber Jacket' } },
          },
        ],
        discountAmount: 15.0,
        taxRate: 0.1,
        appliedCoupon: { code: 'VIP15', name: 'VIP 15 USD Off', discount_amount: 15.0 },
      }

      const snapWithPromo = buildSnapshotFromRawPosStorage(rawSession)
      assert.equal(snapWithPromo.subtotal, 100.0)
      assert.equal(snapWithPromo.itemDiscountsTotal, 10.0)
      assert.equal(snapWithPromo.orderDiscount, 15.0)
      assert.equal(snapWithPromo.totalDiscount, 25.0)
      assert.equal(snapWithPromo.appliedCouponCode, 'VIP15')
      assert.equal(snapWithPromo.taxAmount, 7.5)
      assert.equal(snapWithPromo.grandTotal, 82.5)
      assert.equal(snapWithPromo.khrGrandTotal, Math.round(82.5 * KHR_EXCHANGE_RATE))
      assert.equal(roundCurrency(82.505), 82.51)
      assert.equal(formatUsd(82.5), '82.50')
      assert.equal(formatCountdownMmSs(125), '02:05')
    })
  })

  // ── Flow 7, 8, 9, 10, 11 & Risk 4: Checkout, KHQR, Cash & Race Conditions ──
  describe('Flows 7–11 & Risk 4: Payment Initiated, KHQR Lifecycle, Cash Change Due, and Next-Order Race Protection', () => {
    it('handles Checkout Modal -> KHQR Loading -> Pending -> Expired (QR hidden) -> Cancelled -> Restores Cart', () => {
      const ctx = createDisplayReceiverContext()
      const now = Date.now()

      const baseItem = mapCartItemToDisplayItem({
        variant_id: 'v_shoes',
        quantity: 1,
        unit_price: 65,
        discount_amount: 0,
        subtotal: 65,
        variant: { id: 'v_shoes', product: { name: 'Leather Loafers' } } as any,
      })

      // 1. Cashier opens payment modal (still selecting payment method -> must NOT show completed or QR yet)
      const modalOpenSnap = createEmptyDisplaySnapshot({
        seq: 30,
        timestamp: now,
        orderSessionId: 'ord_pay_flow',
        reason: 'CHECKOUT_OPENED',
        state: 'CART_ACTIVE',
        checkoutPhase: 'PAYMENT_SELECTION',
        items: [baseItem],
        totalItemsCount: 1,
        uniqueItemsCount: 1,
        subtotal: 65,
        grandTotal: 65,
      })
      applyIncomingSnapshot(ctx, modalOpenSnap, now)
      assert.equal(ctx.snapshot.state, 'CART_ACTIVE')
      assert.equal(ctx.snapshot.checkoutPhase, 'PAYMENT_SELECTION')

      // 2. Cashier initiates ABA KHQR -> LOADING
      const khqrLoadingSnap = createEmptyDisplaySnapshot({
        seq: 31,
        timestamp: now + 100,
        orderSessionId: 'ord_pay_flow',
        reason: 'KHQR_LOADING',
        state: 'PAYMENT_QR',
        checkoutPhase: 'PAYMENT_SELECTION',
        items: [baseItem],
        subtotal: 65,
        grandTotal: 65,
        khqr: {
          saleId: 'sale_1',
          paymentId: '',
          tranId: '',
          amount: 65,
          khrAmount: toKhrAmount(65),
          qrImage: '',
          qrString: '',
          status: 'LOADING',
          error: null,
          verifying: false,
          apv: null,
          expiresAt: null,
          secondsLeft: 0,
        },
      })
      applyIncomingSnapshot(ctx, khqrLoadingSnap, now + 100)
      assert.equal(ctx.snapshot.state, 'PAYMENT_QR')
      assert.equal(ctx.snapshot.khqr?.status, 'LOADING')

      // 3. KHQR generated -> PENDING
      const khqrPendingSnap = createEmptyDisplaySnapshot({
        seq: 32,
        timestamp: now + 200,
        orderSessionId: 'ord_pay_flow',
        reason: 'KHQR_PENDING',
        state: 'PAYMENT_QR',
        items: [baseItem],
        subtotal: 65,
        grandTotal: 65,
        khqr: {
          saleId: 'sale_1',
          paymentId: 'pay_khqr_1',
          tranId: 'ABA-001',
          amount: 65,
          khrAmount: toKhrAmount(65),
          qrImage: 'data:image/png;base64,QRDATA',
          qrString: '000201...',
          status: 'PENDING',
          error: null,
          verifying: false,
          apv: null,
          expiresAt: new Date(now + 180_000).toISOString(),
          secondsLeft: 180,
        },
      })
      applyIncomingSnapshot(ctx, khqrPendingSnap, now + 200)
      assert.equal(ctx.snapshot.state, 'PAYMENT_QR')
      assert.equal(ctx.snapshot.khqr?.status, 'PENDING')
      assert.equal(ctx.snapshot.khqr?.qrImage, 'data:image/png;base64,QRDATA')

      // 4. KHQR expires -> EXPIRED (QR image cleared so customer cannot scan expired QR)
      const khqrExpiredSnap = createEmptyDisplaySnapshot({
        seq: 33,
        timestamp: now + 300,
        orderSessionId: 'ord_pay_flow',
        reason: 'KHQR_EXPIRED',
        state: 'PAYMENT_QR',
        items: [baseItem],
        subtotal: 65,
        grandTotal: 65,
        khqr: {
          ...khqrPendingSnap.khqr!,
          status: 'EXPIRED',
          secondsLeft: 0,
        },
      })
      applyIncomingSnapshot(ctx, khqrExpiredSnap, now + 300)
      assert.equal(ctx.snapshot.state, 'PAYMENT_QR')
      assert.equal(ctx.snapshot.khqr?.status, 'EXPIRED')
      assert.equal(ctx.snapshot.khqr?.qrImage, '')

      // 5. Cashier cancels QR or switches payment method -> returns to CART_ACTIVE with items intact
      const cancelQrSnap = createEmptyDisplaySnapshot({
        seq: 34,
        timestamp: now + 400,
        orderSessionId: 'ord_pay_flow',
        reason: 'PAYMENT_CANCELLED',
        state: 'CART_ACTIVE',
        checkoutPhase: 'PAYMENT_SELECTION',
        items: [baseItem],
        subtotal: 65,
        grandTotal: 65,
      })
      applyIncomingSnapshot(ctx, cancelQrSnap, now + 400)
      assert.equal(ctx.snapshot.state, 'CART_ACTIVE')
      assert.equal(ctx.snapshot.items.length, 1)
      assert.equal(ctx.snapshot.grandTotal, 65)
    })

    it('Flow 9: displays Cash Payment confirmation with Amount Paid, Tendered Amount, and Change Due', () => {
      const ctx = createDisplayReceiverContext()
      const now = Date.now()

      const cashSuccessSnap = createEmptyDisplaySnapshot({
        seq: 40,
        timestamp: now,
        orderSessionId: 'ord_cash_1',
        reason: 'PAYMENT_APPROVED',
        state: 'PAYMENT_SUCCESS',
        success: {
          paymentId: 'sale_cash_40',
          orderSessionId: 'ord_cash_1',
          invoiceNumber: 'INV-2026-0040',
          amount: 42.5,
          khrAmount: toKhrAmount(42.5),
          paymentMethod: 'Cash',
          tenderedAmount: 50.0,
          changeDue: 7.5,
          itemCount: 2,
          completedAt: now,
        },
      })

      const res = applyIncomingSnapshot(ctx, cashSuccessSnap, now)
      assert.equal(res.accepted, true)
      assert.equal(res.playSuccessChime, true)
      assert.equal(ctx.snapshot.state, 'PAYMENT_SUCCESS')
      assert.equal(ctx.snapshot.success?.paymentMethod, 'Cash')
      assert.equal(ctx.snapshot.success?.invoiceNumber, 'INV-2026-0040')
      assert.equal(ctx.snapshot.success?.amount, 42.5)
      assert.equal(ctx.snapshot.success?.tenderedAmount, 50.0)
      assert.equal(ctx.snapshot.success?.changeDue, 7.5)
    })

    it('Risk 4: protects against Payment Success race condition when cashier scans items for the next customer within 5s', () => {
      const ctx = createDisplayReceiverContext()
      const now = Date.now()

      // Order 1 completes payment
      const successSnap = createEmptyDisplaySnapshot({
        seq: 50,
        timestamp: now,
        orderSessionId: 'ord_completed_1',
        reason: 'PAYMENT_APPROVED',
        state: 'PAYMENT_SUCCESS',
        success: {
          paymentId: 'pay_50',
          orderSessionId: 'ord_completed_1',
          invoiceNumber: 'INV-0050',
          amount: 30.0,
          khrAmount: toKhrAmount(30.0),
          paymentMethod: 'ABA KHQR',
          tenderedAmount: null,
          changeDue: 0,
          itemCount: 1,
          completedAt: now,
        },
      })
      applyIncomingSnapshot(ctx, successSnap, now)
      assert.equal(ctx.snapshot.state, 'PAYMENT_SUCCESS')

      // 1.2s later, POS auto-clears the cart in the background (POST_PAYMENT_CLEAR / CART_UPDATED with empty items).
      // The display must NOT be wiped to IDLE prematurely!
      const backgroundEmptyCartUpdate = createEmptyDisplaySnapshot({
        seq: 51,
        timestamp: now + 1200,
        orderSessionId: 'ord_next_2',
        reason: 'CART_UPDATED',
        state: 'IDLE',
      })
      const bgRes = applyIncomingSnapshot(ctx, backgroundEmptyCartUpdate, now + 1200)
      assert.equal(bgRes.accepted, false)
      assert.equal(bgRes.ignoredReason, 'POST_PAYMENT_CLEAR_PRESERVED')
      assert.equal(ctx.snapshot.state, 'PAYMENT_SUCCESS')

      // 2.5s later (still within the 5-second window), cashier scans the first item for Customer #2!
      const nextCustomerItemSnap = createEmptyDisplaySnapshot({
        seq: 52,
        timestamp: now + 2500,
        orderSessionId: 'ord_next_2',
        reason: 'ITEM_ADDED',
        state: 'CART_ACTIVE',
        items: [
          mapCartItemToDisplayItem({
            variant_id: 'v_new_cust_item',
            quantity: 1,
            unit_price: 19.0,
            discount_amount: 0,
            subtotal: 19.0,
            variant: { id: 'v_new_cust_item', product: { name: 'Ribbed Tank Top' } } as any,
          }),
        ],
        totalItemsCount: 1,
        uniqueItemsCount: 1,
        subtotal: 19.0,
        grandTotal: 19.0,
      })
      const nextOrderRes = applyIncomingSnapshot(ctx, nextCustomerItemSnap, now + 2500)
      assert.equal(nextOrderRes.accepted, true)
      assert.equal(ctx.snapshot.state, 'CART_ACTIVE')
      assert.equal(ctx.snapshot.orderSessionId, 'ord_next_2')
      assert.equal(ctx.snapshot.items.length, 1)
      assert.equal(ctx.snapshot.grandTotal, 19.0)

      // Duplicate PAYMENT_APPROVED for already-completed 'pay_50' must be ignored
      const dupApproval = applyIncomingSnapshot(ctx, { ...successSnap, seq: 53, timestamp: now + 2600 }, now + 2600)
      assert.equal(dupApproval.accepted, false)
      assert.equal(dupApproval.ignoredReason, 'STALE_ORDER_SESSION')
    })

    it('normalizes legacy message shapes cleanly for backward compatibility', () => {
      const base = createEmptyDisplaySnapshot()
      const legacySync = normalizeMessageToSnapshot(
        {
          type: 'SYNC_CART',
          timestamp: Date.now(),
          payload: {
            items: [{ variant_id: 'v_leg', name: 'Belt', variantInfo: 'Brown', quantity: 1, price: 12, total: 12 }],
            subtotal: 12,
            discount: 0,
            tax: 0,
            grandTotal: 12,
          },
        },
        base,
      )
      assert.ok(legacySync)
      assert.equal(legacySync.state, 'CART_ACTIVE')
      assert.equal(legacySync.items.length, 1)
      assert.equal(legacySync.grandTotal, 12)
    })
  })

  // ── UI & Workspace Rule Compliance Audit ────────────────────────────
  describe('UI Template & Workspace Rule Compliance (AGENTS.md)', () => {
    const displayVuePath = path.resolve(
      import.meta.dirname,
      '../app/pages/pos/customer-display.vue',
    )
    const displayVueSource = fs.readFileSync(displayVuePath, 'utf-8')

    it('removes the staff "Back to POS" navigation button from the customer display', () => {
      assert.ok(!displayVueSource.includes('Back to POS'), 'Must not contain "Back to POS" button')
      assert.ok(!displayVueSource.includes('to="/pos"'), 'Must not contain NuxtLink to="/pos"')
    })

    it('uses neutral subtle borders only — zero colorful borders (AGENTS.md Rule 1)', () => {
      const forbiddenColorBorderRegex =
        /\bborder-(?:red|green|blue|amber|yellow|pink|purple|indigo|emerald|rose|teal|cyan|orange|lime|violet|fuchsia)-\d+/g
      const matches = displayVueSource.match(forbiddenColorBorderRegex)
      assert.equal(
        matches,
        null,
        `Found forbidden colorful border classes in customer-display.vue: ${matches?.join(', ')}`,
      )
    })

    it('uses <UIcon> only — zero custom inline <svg> elements (AGENTS.md Rule 2)', () => {
      assert.ok(!/<svg[\s>]/i.test(displayVueSource), 'Must not contain custom inline <svg> tags')
      assert.ok(displayVueSource.includes('<UIcon'), 'Must use built-in <UIcon> component')
    })

    it('implements a 56px compact header, 2-column 8/4 grid layout (~67%/33%), and viewport-locked container', () => {
      assert.ok(displayVueSource.includes('overflow-hidden'), 'Must lock to viewport height without page scrolling')
      assert.ok(displayVueSource.includes('h-14'), 'Header must be compact 56px (h-14)')
      assert.ok(displayVueSource.includes('lg:col-span-8'), 'Left order panel must occupy ~67-70% (8/12 cols)')
      assert.ok(displayVueSource.includes('lg:col-span-4'), 'Right summary panel must occupy ~30-33% (4/12 cols)')
      assert.ok(displayVueSource.includes('Welcome! Your order will appear here.'), 'Must display welcoming empty state message')
    })

    it('uses the unified Main Default Layout (layouts/default.vue) across all pages with persistent AppSidebar', () => {
      const defaultLayoutPath = path.resolve(import.meta.dirname, '../app/layouts/default.vue')
      const posIndexPath = path.resolve(import.meta.dirname, '../app/pages/pos/index.vue')
      const settingsPath = path.resolve(import.meta.dirname, '../app/pages/settings.vue')

      const defaultLayoutSource = fs.readFileSync(defaultLayoutPath, 'utf-8')
      const posIndexSource = fs.readFileSync(posIndexPath, 'utf-8')
      const settingsSource = fs.readFileSync(settingsPath, 'utf-8')

      // 1. Default layout must host the single shared <AppSidebar>, <PosShortcutsModal>, and <AppToast>
      assert.ok(defaultLayoutSource.includes('<AppSidebar'), 'layouts/default.vue must render <AppSidebar>')
      assert.ok(defaultLayoutSource.includes('<PosShortcutsModal'), 'layouts/default.vue must render <PosShortcutsModal>')
      assert.ok(defaultLayoutSource.includes('<AppToast'), 'layouts/default.vue must render <AppToast>')
      assert.ok(defaultLayoutSource.includes('h-dvh w-screen overflow-hidden'), 'layouts/default.vue must lock outer shell viewport')

      // 2. Pages must not opt out via layout: false or duplicate <AppSidebar>
      for (const [name, src] of [
        ['pos/index.vue', posIndexSource],
        ['pos/customer-display.vue', displayVueSource],
        ['settings.vue', settingsSource],
      ] as const) {
        assert.ok(!src.includes('layout: false'), `${name} must use the default layout instead of layout: false`)
        assert.ok(!src.includes('<AppSidebar'), `${name} must not duplicate <AppSidebar> outside layouts/default.vue`)
      }
    })
  })

  // ── Multi-Register Terminal Isolation ───────────────────────────────
  describe('Multi-Register Terminal Identifier & Cross-Talk Isolation', () => {
    it('normalizes terminal IDs and generates scoped storage keys', () => {
      assert.equal(normalizeTerminalId(' reg-02 '), 'REG-02')
      assert.equal(normalizeTerminalId(''), 'POS-01')
      assert.equal(normalizeTerminalId(null), 'POS-01')
      assert.equal(getSnapshotStorageKey('reg-02'), 'pos_customer_display_snapshot_v1_REG-02')
      assert.equal(getHeartbeatStorageKey('reg-02'), 'pos_customer_display_heartbeat_v1_REG-02')
    })

    it('rejects events from a different register when bound to a specific terminal ID', () => {
      const ctx = createDisplayReceiverContext(undefined, 'REG-02')
      const now = Date.now()

      // Event from POS-01 arriving at a display bound to REG-02 -> MUST BE REJECTED
      const reg01Snap = createEmptyDisplaySnapshot({
        seq: 1,
        timestamp: now,
        terminalId: 'POS-01',
        orderSessionId: 'ord_reg1',
        state: 'CART_ACTIVE',
        items: [
          mapCartItemToDisplayItem({
            variant_id: 'v_1',
            quantity: 1,
            unit_price: 25,
            discount_amount: 0,
            subtotal: 25,
            variant: { id: 'v_1', product: { name: 'Polo Shirt' } } as any,
          }),
        ],
        subtotal: 25,
        grandTotal: 25,
      })

      const mismatchRes = applyIncomingSnapshot(ctx, reg01Snap, now)
      assert.equal(mismatchRes.accepted, false)
      assert.equal(mismatchRes.ignoredReason, 'TERMINAL_MISMATCH')
      assert.equal(ctx.snapshot.state, 'IDLE')

      // Event from REG-02 arriving at display bound to REG-02 -> ACCEPTED
      const reg02Snap = {
        ...reg01Snap,
        terminalId: 'REG-02',
        orderSessionId: 'ord_reg2',
      }
      const matchRes = applyIncomingSnapshot(ctx, reg02Snap, now + 50)
      assert.equal(matchRes.accepted, true)
      assert.equal(ctx.snapshot.state, 'CART_ACTIVE')
      assert.equal(ctx.snapshot.terminalId, 'REG-02')
      assert.equal(ctx.snapshot.grandTotal, 25)
    })
  })
})
