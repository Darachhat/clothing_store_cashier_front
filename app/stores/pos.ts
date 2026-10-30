// POS cart store — with localStorage persistence
import { defineStore } from 'pinia'
import type { ProductVariant, CartItem, HeldCart, CustomerSummary, PosCoupon } from '~/types/pos'

const STORAGE_KEY = 'pos_session_v2'
const MAX_CLOSED_SESSIONS = 60

export function generateOrderSessionId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `ord_${ts}_${rand}`
}

interface PosState {
  cart: CartItem[]
  heldCarts: HeldCart[]
  selectedCustomerId: string | null
  selectedCustomer: CustomerSummary | null
  discountAmount: number
  appliedCoupon: PosCoupon | null
  taxRate: number
  notes: string
  branchId: string | null
  warehouseId: string | null
  orderSessionId: string
  stateSeq: number
  lastUpdatedVariantId: string | null
  closedOrderSessions: string[]
}

export const usePosStore = defineStore('pos', {
  state: (): PosState => ({
    cart: [],
    heldCarts: [],
    selectedCustomerId: null,
    selectedCustomer: null,
    discountAmount: 0,
    appliedCoupon: null,
    taxRate: 0.05,
    notes: '',
    branchId: null,
    warehouseId: null,
    orderSessionId: generateOrderSessionId(),
    stateSeq: 1,
    lastUpdatedVariantId: null,
    closedOrderSessions: [],
  }),

  getters: {
    cartSubtotal: (state): number =>
      state.cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),

    itemDiscountsTotal: (state): number =>
      state.cart.reduce((sum, item) => sum + (item.discount_amount || 0), 0),

    totalDiscount: (state): number =>
      state.discountAmount + state.cart.reduce((sum, item) => sum + (item.discount_amount || 0), 0),

    taxAmount: (state): number => {
      const taxable = Math.max(0, state.cart.reduce((sum, item) => sum + item.unit_price * item.quantity - (item.discount_amount || 0), 0) - state.discountAmount)
      return taxable * state.taxRate
    },

    grandTotal: (state): number => {
      const taxable = Math.max(0, state.cart.reduce((sum, item) => sum + item.unit_price * item.quantity - (item.discount_amount || 0), 0) - state.discountAmount)
      return taxable + (taxable * state.taxRate)
    },

    itemCount: (state): number =>
      state.cart.reduce((sum, item) => sum + item.quantity, 0),

    uniqueItemCount: (state): number =>
      state.cart.length,
  },

  actions: {
    // ── Session & Sequence Helpers ────────────────────────────────
    recordClosedSession(sessionId: string) {
      if (!sessionId) return
      if (!this.closedOrderSessions.includes(sessionId)) {
        this.closedOrderSessions.push(sessionId)
        if (this.closedOrderSessions.length > MAX_CLOSED_SESSIONS) {
          this.closedOrderSessions = this.closedOrderSessions.slice(-MAX_CLOSED_SESSIONS)
        }
      }
    },

    bumpSequence() {
      this.stateSeq = (Number(this.stateSeq) || 0) + 1
    },

    // ── LocalStorage Persistence ──────────────────────────────────
    hydrateFromStorage() {
      if (typeof window === 'undefined') return
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const data = JSON.parse(raw)
        if (Array.isArray(data.cart)) this.cart = data.cart
        if (Array.isArray(data.heldCarts)) this.heldCarts = data.heldCarts
        if (data.selectedCustomer !== undefined) this.selectedCustomer = data.selectedCustomer
        if (data.selectedCustomerId !== undefined) this.selectedCustomerId = data.selectedCustomerId
        if (typeof data.discountAmount === 'number') this.discountAmount = data.discountAmount
        if (data.appliedCoupon !== undefined) this.appliedCoupon = data.appliedCoupon
        if (typeof data.notes === 'string') this.notes = data.notes
        if (typeof data.orderSessionId === 'string' && data.orderSessionId) {
          this.orderSessionId = data.orderSessionId
        } else if (!this.orderSessionId) {
          this.orderSessionId = generateOrderSessionId()
        }
        if (typeof data.stateSeq === 'number' && data.stateSeq > 0) {
          this.stateSeq = data.stateSeq
        }
        if (Array.isArray(data.closedOrderSessions)) {
          this.closedOrderSessions = data.closedOrderSessions.slice(-MAX_CLOSED_SESSIONS)
        }
        if (typeof data.lastUpdatedVariantId === 'string' || data.lastUpdatedVariantId === null) {
          this.lastUpdatedVariantId = data.lastUpdatedVariantId
        }
      } catch { /* corrupt storage — silent ignore */ }
    },

    persistToStorage() {
      if (typeof window === 'undefined') return
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          cart: this.cart,
          heldCarts: this.heldCarts,
          selectedCustomer: this.selectedCustomer,
          selectedCustomerId: this.selectedCustomerId,
          discountAmount: this.discountAmount,
          appliedCoupon: this.appliedCoupon,
          notes: this.notes,
          orderSessionId: this.orderSessionId,
          stateSeq: this.stateSeq,
          lastUpdatedVariantId: this.lastUpdatedVariantId,
          closedOrderSessions: this.closedOrderSessions,
        }))
      } catch { /* quota exceeded or private mode — ignore */ }
    },

    clearPersistedStorage() {
      if (typeof window === 'undefined') return
      try { localStorage.removeItem(STORAGE_KEY) } catch {}
    },

    // ── Cart Mutations ────────────────────────────────────────────
    addVariant(variant: ProductVariant, quantity: number = 1, maxStock?: number): { success: boolean; item?: CartItem; reachedLimit?: boolean } {
      if (!this.orderSessionId) {
        this.orderSessionId = generateOrderSessionId()
      }
      const existing = this.cart.find((i) => i.variant_id === variant.id)
      const unitPrice = Number(variant.selling_price)
      let reachedLimit = false

      if (existing) {
        // Enrich product metadata if missing on existing item
        if (!existing.variant.product && variant.product) {
          existing.variant = { ...existing.variant, product: variant.product }
        }
        let newQty = existing.quantity + quantity
        if (maxStock !== undefined && maxStock > 0 && newQty > maxStock) {
          newQty = maxStock
          reachedLimit = true
        }
        existing.quantity = newQty
        existing.subtotal = Math.max(0, existing.unit_price * existing.quantity - existing.discount_amount)
        this.lastUpdatedVariantId = variant.id
        this.bumpSequence()
        this.persistToStorage()
        return { success: true, item: existing, reachedLimit }
      } else {
        let finalQty = quantity
        if (maxStock !== undefined && maxStock > 0 && finalQty > maxStock) {
          finalQty = maxStock
          reachedLimit = true
        }
        const newItem: CartItem = {
          variant_id: variant.id,
          variant,
          quantity: finalQty,
          unit_price: unitPrice,
          discount_amount: 0,
          subtotal: unitPrice * finalQty,
        }
        this.cart.push(newItem)
        this.lastUpdatedVariantId = variant.id
        this.bumpSequence()
        this.persistToStorage()
        return { success: true, item: newItem, reachedLimit }
      }
    },

    removeItem(variantId: string) {
      this.cart = this.cart.filter((i) => i.variant_id !== variantId)
      if (this.lastUpdatedVariantId === variantId) {
        this.lastUpdatedVariantId = null
      }
      if (this.cart.length === 0) {
        this.appliedCoupon = null
        this.discountAmount = 0
      }
      this.bumpSequence()
      this.persistToStorage()
    },

    updateQuantity(variantId: string, quantity: number, maxStock?: number): { success: boolean; reachedLimit?: boolean } {
      const item = this.cart.find((i) => i.variant_id === variantId)
      if (item) {
        if (quantity <= 0) {
          this.removeItem(variantId)
          return { success: true }
        }
        let reachedLimit = false
        let finalQty = quantity
        if (maxStock !== undefined && maxStock > 0 && finalQty > maxStock) {
          finalQty = maxStock
          reachedLimit = true
        }
        item.quantity = finalQty
        item.subtotal = Math.max(0, item.unit_price * finalQty - item.discount_amount)
        this.lastUpdatedVariantId = variantId
        this.bumpSequence()
        this.persistToStorage()
        return { success: true, reachedLimit }
      }
      return { success: false }
    },

    setItemDiscount(variantId: string, discountAmount: number) {
      const item = this.cart.find((i) => i.variant_id === variantId)
      if (item) {
        item.discount_amount = Math.max(0, discountAmount)
        item.subtotal = Math.max(0, item.unit_price * item.quantity - item.discount_amount)
        this.lastUpdatedVariantId = variantId
        this.bumpSequence()
        this.persistToStorage()
      }
    },

    setCustomer(customer: CustomerSummary | null) {
      this.selectedCustomer = customer
      this.selectedCustomerId = customer ? customer.id : null
      this.bumpSequence()
      this.persistToStorage()
    },

    applyCoupon(code: string, discount: number, name?: string, promotion_id?: string) {
      this.appliedCoupon = { code, discount_amount: discount, name, promotion_id }
      this.discountAmount = discount
      this.bumpSequence()
      this.persistToStorage()
    },

    removeCoupon() {
      this.appliedCoupon = null
      this.discountAmount = 0
      this.bumpSequence()
      this.persistToStorage()
    },

    clearCart() {
      if (this.orderSessionId) {
        this.recordClosedSession(this.orderSessionId)
      }
      this.cart = []
      this.selectedCustomerId = null
      this.selectedCustomer = null
      this.discountAmount = 0
      this.appliedCoupon = null
      this.notes = ''
      this.lastUpdatedVariantId = null
      this.orderSessionId = generateOrderSessionId()
      this.bumpSequence()
      this.persistToStorage()
    },

    holdCart(name?: string) {
      if (this.cart.length === 0) return
      const now = new Date()
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      const heldName = name
        || (this.selectedCustomer
          ? `${this.selectedCustomer.name} — ${time}`
          : `Order #${Date.now().toString().slice(-4)} — ${time}`)
      this.heldCarts.push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        orderSessionId: this.orderSessionId,
        name: heldName,
        cart: JSON.parse(JSON.stringify(this.cart)),
        customerId: this.selectedCustomerId,
        customerName: this.selectedCustomer?.name || null,
        discount: this.discountAmount,
        appliedCoupon: this.appliedCoupon ? { ...this.appliedCoupon } : null,
        notes: this.notes,
        heldAt: new Date().toISOString(),
      })
      this.clearCart()
    },

    resumeCart(heldId: string) {
      const index = this.heldCarts.findIndex((h) => h.id === heldId)
      if (index === -1) return
      const held = this.heldCarts[index]
      if (this.orderSessionId) {
        this.recordClosedSession(this.orderSessionId)
      }
      this.cart = JSON.parse(JSON.stringify(held.cart))
      this.selectedCustomerId = held.customerId
      this.selectedCustomer = (held.customerId && held.customerName)
        ? { id: held.customerId, name: held.customerName, customer_code: '' }
        : null
      this.discountAmount = held.discount
      this.appliedCoupon = held.appliedCoupon ? { ...held.appliedCoupon } : null
      this.notes = held.notes || ''
      this.lastUpdatedVariantId = null
      this.orderSessionId = generateOrderSessionId()
      this.heldCarts.splice(index, 1)
      this.bumpSequence()
      this.persistToStorage()
    },

    removeHeldCart(heldId: string) {
      this.heldCarts = this.heldCarts.filter((h) => h.id !== heldId)
      this.bumpSequence()
      this.persistToStorage()
    },
  },
})
