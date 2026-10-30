// POS-specific types
import type { ProductVariant } from './index'

export interface CartItem {
  variant_id: string
  variant: ProductVariant
  quantity: number
  unit_price: number
  discount_amount: number
  subtotal: number
}

export interface CustomerSummary {
  id: string
  customer_code: string
  name: string
  phone?: string | null
  email?: string | null
  loyalty_account?: {
    points_balance: number
    tier: string
  } | null
}

export interface PosCoupon {
  code: string
  discount_amount: number
  name?: string
  promotion_id?: string
}

export interface HeldCart {
  id: string
  orderSessionId?: string
  name: string
  cart: CartItem[]
  customerId: string | null
  customerName?: string | null
  discount: number
  appliedCoupon?: PosCoupon | null
  notes?: string
  heldAt: string
}

export interface PaymentEntry {
  payment_method: 'CASH' | 'KHQR' | 'BANK_TRANSFER' | 'CARD' | 'BAKONG' | 'OTHER'
  amount: number
  reference_number?: string
  notes?: string
}

export type { ProductVariant } from './index'
