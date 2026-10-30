<template>
  <aside class="w-[336px] xl:w-[360px] bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden flex-shrink-0 select-none">
    <!-- ── 1. Compact Customer & Cart Header ── -->
    <div class="px-3 py-2 bg-white border-b border-gray-200 flex flex-col gap-1.5 flex-shrink-0">
      <!-- Top Row: Customer Assignment -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0 border border-gray-200/80">
            <UIcon name="i-heroicons-user" class="w-3.5 h-3.5 text-gray-700" />
          </div>
          <div class="flex flex-col min-w-0 leading-tight">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="text-xs font-bold text-gray-900 truncate">
                {{ selectedCustomer?.name || 'Walk-in Customer' }}
              </span>
              <span
                v-if="selectedCustomer?.loyalty_account"
                class="inline-flex items-center gap-0.5 text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-semibold border border-gray-200 flex-shrink-0"
              >
                <UIcon name="i-heroicons-sparkles" class="w-2.5 h-2.5 text-amber-600" />
                {{ selectedCustomer.loyalty_account.tier }} &bull; {{ selectedCustomer.loyalty_account.points_balance }}p
              </span>
              <span v-else class="text-[10px] text-gray-400 font-medium flex-shrink-0">Guest</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            class="h-7 px-2.5 rounded-md text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200/80 transition-colors cursor-pointer border border-gray-200"
            title="Select Registered Customer [F8]"
            @click="$emit('selectCustomer')"
          >
            {{ selectedCustomer ? 'Change' : 'Assign [F8]' }}
          </button>
          <button
            v-if="selectedCustomer"
            type="button"
            class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
            title="Reset to Walk-in"
            aria-label="Reset to Walk-in"
            @click="$emit('removeCustomer')"
          >
            <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Bottom Row: Cart Count & Hold/Clear Actions -->
      <div class="pt-1.5 border-t border-gray-100 flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5">
          <span class="text-[11px] font-bold text-gray-700 tracking-wider uppercase">Cart</span>
          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-gray-900 text-white leading-none">
            {{ itemCount }} pcs
          </span>
        </div>

        <div class="flex items-center gap-1">
          <button
            v-if="cart.length > 0"
            type="button"
            class="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-semibold text-amber-900 bg-amber-50/70 hover:bg-amber-100/80 transition-colors cursor-pointer border border-gray-200"
            title="Park / Hold Current Order [F9]"
            @click="$emit('holdCart')"
          >
            <UIcon name="i-heroicons-pause-circle" class="w-3 h-3 text-amber-700" />
            <span>Hold [F9]</span>
          </button>
          <button
            v-if="cart.length > 0"
            type="button"
            class="h-6 px-2 rounded-md text-[11px] font-medium text-rose-700 bg-white hover:bg-rose-50 transition-colors cursor-pointer border border-gray-200"
            title="Clear Entire Cart"
            @click="$emit('clearCart')"
          >
            Clear
          </button>
        </div>
      </div>
    </div>

    <!-- ── 2. Dedicated Scrollable Cart Items Area ── -->
    <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-2 flex flex-col gap-1.5">
      <!-- Empty state -->
      <div
        v-if="cart.length === 0"
        class="flex-1 flex flex-col items-center justify-center text-center p-4 text-gray-400 my-auto"
      >
        <div class="w-11 h-11 rounded-lg bg-gray-50 flex items-center justify-center mb-2 border border-gray-200">
          <UIcon name="i-heroicons-shopping-bag" class="w-5 h-5 text-gray-400" />
        </div>
        <div class="text-xs font-semibold text-gray-700 mb-0.5">Cart is empty</div>
        <div class="text-[11px] text-gray-400 max-w-[200px] leading-snug">
          Scan a barcode or select items from the catalog to start an order.
        </div>
      </div>

      <!-- Active Cart Items -->
      <template v-else>
        <CartItem
          v-for="item in cart"
          :key="item.variant_id"
          :item="item"
          @discount="(val) => $emit('discountItem', val)"
          @update-qty="(variantId, newQty) => $emit('updateItemQty', variantId, newQty)"
          @change-qty="(variantId, event) => $emit('changeItemQty', variantId, event)"
          @remove="(variantId) => $emit('removeItem', variantId)"
        />
      </template>
    </div>

    <!-- ── 3. Pinned Checkout Footer & Order Summary ── -->
    <div class="px-3 py-2.5 bg-white border-t border-gray-200 flex flex-col gap-2 flex-shrink-0">
      <!-- Promo Code Input & Quick Presets -->
      <div class="flex flex-col gap-1">
        <div v-if="!appliedCoupon" class="flex gap-1.5">
          <div class="relative flex-1 flex items-center">
            <UIcon name="i-heroicons-ticket" class="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
            <input
              :value="couponCode"
              aria-label="Promo code"
              placeholder="Promo code (e.g. SAVE10)..."
              class="w-full h-8 bg-gray-50 border border-gray-200 rounded-md pl-7 pr-2 text-xs font-mono outline-none transition-colors focus:bg-white focus:border-gray-400"
              @input="$emit('update:couponCode', ($event.target as HTMLInputElement).value)"
              @keydown.enter="$emit('applyCoupon')"
            />
          </div>
          <button
            type="button"
            class="px-2.5 h-8 bg-gray-900 text-white rounded-md text-xs font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors cursor-pointer border border-transparent whitespace-nowrap"
            :disabled="!couponCode.trim() || validatingCoupon"
            @click="$emit('applyCoupon')"
          >
            {{ validatingCoupon ? '...' : 'Apply' }}
          </button>
        </div>

        <!-- Compact Quick Presets Strip (when cart has items & no coupon applied) -->
        <div v-if="!appliedCoupon && cart.length > 0" class="flex items-center gap-1">
          <span class="text-[10px] text-gray-400 font-medium mr-0.5">Presets:</span>
          <button
            v-for="preset in ['SAVE5', 'SAVE10', 'SAVE15', 'VIP20']"
            :key="preset"
            type="button"
            class="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/80 transition-colors cursor-pointer"
            @click="$emit('update:couponCode', preset)"
          >
            {{ preset }}
          </button>
        </div>

        <!-- Applied Coupon Banner -->
        <div
          v-else-if="appliedCoupon"
          class="flex items-center justify-between px-2.5 py-1 bg-emerald-50 border border-gray-200 rounded-md text-xs"
        >
          <div class="flex items-center gap-1.5">
            <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5 text-emerald-600" />
            <span class="font-bold text-emerald-800 uppercase tracking-wide font-mono">{{ appliedCoupon.code }}</span>
            <span class="text-emerald-700 font-medium">(-${{ totalDiscount.toFixed(2) }})</span>
          </div>
          <button
            type="button"
            class="text-emerald-700 hover:text-emerald-950 p-0.5 rounded cursor-pointer flex items-center justify-center"
            title="Remove coupon"
            aria-label="Remove coupon"
            @click="$emit('removeCoupon')"
          >
            <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Order Summary (Clear Hierarchy, No Heavy Nested Box) -->
      <div class="pt-1.5 border-t border-gray-100 flex flex-col gap-1">
        <div class="flex justify-between text-xs text-gray-500">
          <span>Subtotal</span>
          <span class="font-mono font-medium text-gray-800">${{ cartSubtotal.toFixed(2) }}</span>
        </div>

        <div v-if="totalDiscount > 0" class="flex justify-between text-xs text-emerald-700 font-semibold">
          <span>Discounts</span>
          <span class="font-mono">&minus;${{ totalDiscount.toFixed(2) }}</span>
        </div>

        <div class="flex justify-between text-xs text-gray-500">
          <span>VAT / Tax ({{ (taxRate * 100).toFixed(0) }}%)</span>
          <span class="font-mono font-medium text-gray-800">${{ taxAmount.toFixed(2) }}</span>
        </div>

        <div class="pt-1.5 mt-0.5 border-t border-gray-200 flex items-baseline justify-between">
          <div class="flex items-baseline gap-1.5">
            <span class="text-xs font-bold text-gray-900">Total Due</span>
            <span class="text-[11px] font-mono text-gray-400">≈ {{ formatRiel(grandTotal) }}</span>
          </div>
          <div class="flex items-baseline gap-0.5">
            <span class="text-xs font-bold text-gray-400 font-mono">$</span>
            <span class="text-[22px] leading-none font-bold font-mono text-gray-900 tracking-tight">{{ grandTotal.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- Checkout Action Buttons -->
      <div class="flex flex-col gap-1.5">
        <!-- Primary Proceed to Pay CTA -->
        <button
          type="button"
          class="h-10 w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-lg px-3.5 flex items-center justify-between font-bold text-xs transition-colors cursor-pointer border border-transparent"
          :disabled="cart.length === 0 || processingSale"
          @click="$emit('checkout')"
        >
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-credit-card" class="w-4 h-4 text-white" />
            <span class="text-sm font-bold">Proceed to Pay</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="font-mono text-sm font-bold">${{ grandTotal.toFixed(2) }}</span>
            <kbd class="text-[10px] font-mono opacity-80 bg-white/20 px-1.5 py-0.5 rounded">F4</kbd>
          </div>
        </button>

        <!-- Secondary Fast Action: ABA KHQR Fast Pay -->
        <button
          type="button"
          class="h-8 w-full bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-800 rounded-lg px-3 flex items-center justify-between font-semibold text-xs transition-colors cursor-pointer border border-gray-200"
          :disabled="cart.length === 0 || processingSale"
          @click="$emit('quickAba')"
        >
          <div class="flex items-center gap-1.5">
            <UIcon name="i-heroicons-qr-code" class="w-3.5 h-3.5 text-red-600" />
            <span>ABA KHQR Fast Pay</span>
          </div>
          <kbd class="text-[10px] font-mono text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded">F7</kbd>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import CartItem from './CartItem.vue'

defineProps<{
  cart: any[]
  selectedCustomer: any
  itemCount: number
  appliedCoupon: any
  cartSubtotal: number
  totalDiscount: number
  taxRate: number
  taxAmount: number
  grandTotal: number
  formatRiel: (amount: number) => string
  couponCode: string
  validatingCoupon: boolean
  processingSale: boolean
}>()

defineEmits<{
  'selectCustomer': []
  'removeCustomer': []
  'holdCart': []
  'clearCart': []
  'discountItem': [item: any]
  'updateItemQty': [variantId: string, newQty: number]
  'changeItemQty': [variantId: string, event: Event]
  'removeItem': [variantId: string]
  'update:couponCode': [code: string]
  'applyCoupon': []
  'removeCoupon': []
  'checkout': []
  'quickAba': []
}>()
</script>
