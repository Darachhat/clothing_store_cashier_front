<template>
  <!-- ─── Desktop Persistent Sidebar (lg: and above) ──────────────── -->
  <aside
    class="hidden lg:flex w-[360px] 2xl:w-[400px] bg-white border-l border-gray-200 flex-col h-full overflow-hidden flex-shrink-0 select-none"
    aria-label="Current order"
  >
    <PosCartBody
      :cart="cart"
      :selected-customer="selectedCustomer"
      :item-count="itemCount"
      :applied-coupon="appliedCoupon"
      :cart-subtotal="cartSubtotal"
      :total-discount="totalDiscount"
      :tax-rate="taxRate"
      :tax-amount="taxAmount"
      :grand-total="grandTotal"
      :format-riel="formatRiel"
      :coupon-code="couponCode"
      :validating-coupon="validatingCoupon"
      :processing-sale="processingSale"
      :get-line-stock="getLineStock"
      :last-updated-variant-id="lastUpdatedVariantId"
      @select-customer="$emit('selectCustomer')"
      @remove-customer="$emit('removeCustomer')"
      @hold-cart="$emit('holdCart')"
      @clear-cart="$emit('clearCart')"
      @discount-item="(val) => $emit('discountItem', val)"
      @update-item-qty="(variantId, newQty) => $emit('updateItemQty', variantId, newQty)"
      @change-item-qty="(variantId, event) => $emit('changeItemQty', variantId, event)"
      @remove-item="(variantId) => $emit('removeItem', variantId)"
      @update:coupon-code="(code) => $emit('update:couponCode', code)"
      @apply-coupon="$emit('applyCoupon')"
      @remove-coupon="$emit('removeCoupon')"
      @checkout="$emit('checkout')"
      @quick-aba="$emit('quickAba')"
    />
  </aside>

  <!-- ─── Mobile Slide-over Drawer (< lg screens) ────────────────── -->
  <Teleport to="body">
    <div
      v-if="isOpenMobile"
      class="fixed inset-0 z-50 lg:hidden flex"
      role="dialog"
      aria-modal="true"
      aria-label="Current order drawer"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        @click="$emit('update:isOpenMobile', false)"
      />

      <!-- Slide-in Drawer from Right -->
      <aside
        class="relative w-full max-w-[420px] ml-auto h-full bg-white flex flex-col overflow-hidden shadow-2xl z-10 font-sans select-none"
      >
        <PosCartBody
          show-close-button
          :cart="cart"
          :selected-customer="selectedCustomer"
          :item-count="itemCount"
          :applied-coupon="appliedCoupon"
          :cart-subtotal="cartSubtotal"
          :total-discount="totalDiscount"
          :tax-rate="taxRate"
          :tax-amount="taxAmount"
          :grand-total="grandTotal"
          :format-riel="formatRiel"
          :coupon-code="couponCode"
          :validating-coupon="validatingCoupon"
          :processing-sale="processingSale"
          :get-line-stock="getLineStock"
          :last-updated-variant-id="lastUpdatedVariantId"
          @close="$emit('update:isOpenMobile', false)"
          @select-customer="$emit('selectCustomer')"
          @remove-customer="$emit('removeCustomer')"
          @hold-cart="$emit('holdCart')"
          @clear-cart="$emit('clearCart')"
          @discount-item="(val) => $emit('discountItem', val)"
          @update-item-qty="(variantId, newQty) => $emit('updateItemQty', variantId, newQty)"
          @change-item-qty="(variantId, event) => $emit('changeItemQty', variantId, event)"
          @remove-item="(variantId) => $emit('removeItem', variantId)"
          @update:coupon-code="(code) => $emit('update:couponCode', code)"
          @apply-coupon="$emit('applyCoupon')"
          @remove-coupon="$emit('removeCoupon')"
          @checkout="$emit('checkout')"
          @quick-aba="$emit('quickAba')"
        />
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import PosCartBody from './CartBody.vue'
import type { CartItem as CartItemType, CustomerSummary, PosCoupon } from '~/types/pos'

withDefaults(
  defineProps<{
    cart: CartItemType[]
    selectedCustomer: CustomerSummary | null
    itemCount: number
    appliedCoupon: PosCoupon | null
    cartSubtotal: number
    totalDiscount: number
    taxRate: number
    taxAmount: number
    grandTotal: number
    formatRiel: (amount: number) => string
    couponCode: string
    validatingCoupon: boolean
    processingSale: boolean
    getLineStock: (variantId: string) => number | null
    lastUpdatedVariantId?: string | null
    isOpenMobile?: boolean
  }>(),
  {
    lastUpdatedVariantId: null,
    isOpenMobile: false,
  }
)

defineEmits<{
  'selectCustomer': []
  'removeCustomer': []
  'holdCart': []
  'clearCart': []
  'discountItem': [item: CartItemType]
  'updateItemQty': [variantId: string, newQty: number]
  'changeItemQty': [variantId: string, event: Event]
  'removeItem': [variantId: string]
  'update:couponCode': [code: string]
  'applyCoupon': []
  'removeCoupon': []
  'checkout': []
  'quickAba': []
  'update:isOpenMobile': [value: boolean]
}>()
</script>
