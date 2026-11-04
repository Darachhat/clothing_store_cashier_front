<template>
  <div class="flex flex-col h-full overflow-hidden select-none font-sans">
    <!-- 1. Order header: title, hold/clear, customer -->
    <div class="px-3.5 pt-3 pb-2.5 border-b border-gray-200 flex flex-col gap-2.5 flex-shrink-0 bg-white">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <!-- Mobile Close / Back Button -->
          <button
            v-if="showCloseButton"
            type="button"
            class="w-8 h-8 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer mr-1"
            title="Back to products"
            aria-label="Back to products"
            @click="$emit('close')"
          >
            <UIcon name="i-heroicons-chevron-left" class="w-5 h-5" />
          </button>

          <h2 class="text-base font-semibold text-gray-900">Order</h2>
          <span
            class="min-w-[24px] h-6 px-2 rounded-full text-xs font-bold font-mono tabular-nums bg-gray-900 text-white leading-6 text-center"
            :aria-label="`${itemCount} items`"
          >{{ itemCount }}</span>
        </div>

        <div class="flex items-center gap-1.5">
          <div v-if="cart.length > 0" class="flex items-center gap-1.5">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm font-semibold text-gray-800 bg-white hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
              title="Park this order and start another (F9)"
              @click="$emit('holdCart')"
            >
              <UIcon name="i-heroicons-pause-circle" class="w-4 h-4" />
              <span class="hidden sm:inline">Park</span>
              <PosKeyHint class="hidden sm:inline-flex">F9</PosKeyHint>
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm font-semibold text-red-700 bg-white hover:bg-red-50 border border-gray-200 transition-colors cursor-pointer"
              title="Remove all items (asks to confirm)"
              @click="$emit('clearCart')"
            >
              <UIcon name="i-heroicons-trash" class="w-4 h-4" />
              <span class="hidden sm:inline">Clear</span>
            </button>
          </div>

          <!-- Close icon button for mobile -->
          <button
            v-if="showCloseButton"
            type="button"
            class="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer ml-1"
            title="Close order drawer"
            aria-label="Close order drawer"
            @click="$emit('close')"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Customer -->
      <div class="flex flex-col gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              <UIcon name="i-heroicons-user" class="w-4 h-4 text-gray-700" />
            </div>
            <div class="flex flex-col min-w-0 leading-tight">
              <span class="text-sm font-semibold text-gray-900 truncate">
                {{ selectedCustomer?.name || 'Walk-in customer' }}
              </span>
              <span v-if="selectedCustomer" class="text-xs text-gray-600 truncate flex items-center gap-1">
                <template v-if="selectedCustomer.loyalty_account">
                  <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                  {{ selectedCustomer.loyalty_account.tier }} &bull; {{ selectedCustomer.loyalty_account.points_balance }} pts
                </template>
                <template v-else>{{ selectedCustomer.phone || selectedCustomer.customer_code }}</template>
              </span>
              <span v-else class="text-xs text-gray-600">No customer attached</span>
            </div>
          </div>

          <div class="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              class="h-8 px-2.5 rounded-md text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              title="Choose or add a customer (F8)"
              @click="$emit('selectCustomer')"
            >
              <span>{{ selectedCustomer ? 'Change' : 'Add' }}</span>
              <PosKeyHint class="hidden sm:inline-flex">F8</PosKeyHint>
            </button>
            <button
              v-if="selectedCustomer"
              type="button"
              class="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-700 hover:bg-white rounded-md transition-colors cursor-pointer"
              title="Detach customer (walk-in)"
              aria-label="Detach customer and return to walk-in"
              @click="$emit('removeCustomer')"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Loyalty Points Redemption Banner -->
        <div
          v-if="selectedCustomer?.loyalty_account && selectedCustomer.loyalty_account.points_balance >= 100"
          class="pt-1.5 border-t border-gray-200/60 flex items-center justify-between text-xs"
        >
          <div class="flex items-center gap-1 text-gray-700 font-medium">
            <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5 text-amber-600" />
            <span>{{ selectedCustomer.loyalty_account.points_balance }} pts available</span>
          </div>

          <button
            v-if="posStore.redeemedLoyaltyPoints === 0"
            type="button"
            class="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/60 font-semibold cursor-pointer transition-colors flex items-center gap-1 text-[11px]"
            title="Redeem available points for discount"
            @click="redeemMaxLoyaltyPoints"
          >
            <span>Redeem ${{ maxRedeemableDollars.toFixed(2) }}</span>
          </button>
          <div
            v-else
            class="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded font-semibold text-[11px]"
          >
            <span>&minus;${{ posStore.redeemedPointsDiscount.toFixed(2) }} ({{ posStore.redeemedLoyaltyPoints }} pts)</span>
            <button
              type="button"
              class="text-emerald-700 hover:text-emerald-900 cursor-pointer p-0.5"
              title="Remove points discount"
              @click="posStore.removeLoyaltyRedemption()"
            >
              <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Scrollable cart lines -->
    <div ref="scrollEl" class="flex-1 min-h-0 overflow-y-auto pos-scroll p-2.5 bg-white">
      <!-- Empty -->
      <div
        v-if="cart.length === 0"
        class="h-full flex flex-col items-center justify-center text-center px-6 text-gray-600"
      >
        <UIcon name="i-heroicons-shopping-bag" class="w-10 h-10 text-gray-400 mb-3" />
        <div class="text-base font-semibold text-gray-900 mb-1">Order is empty</div>
        <p class="text-sm leading-snug max-w-[240px]">
          Scan a barcode or tap a product to start.
        </p>
      </div>

      <ul v-else class="flex flex-col gap-2" aria-label="Order lines">
        <CartItem
          v-for="item in cart"
          :key="item.variant_id"
          :data-variant-id="item.variant_id"
          :item="item"
          :line-stock="getLineStock(item.variant_id)"
          :highlight="flashId === item.variant_id"
          @discount="(val) => $emit('discountItem', val)"
          @update-qty="(variantId, newQty) => $emit('updateItemQty', variantId, newQty)"
          @change-qty="(variantId, event) => $emit('changeItemQty', variantId, event)"
          @remove="(variantId) => $emit('removeItem', variantId)"
        />
      </ul>
    </div>

    <!-- 3. Pinned footer: promo, totals, pay -->
    <div class="px-3.5 pt-2.5 pb-3 bg-white border-t border-gray-200 flex flex-col gap-2.5 flex-shrink-0">
      <!-- Promo code -->
      <div v-if="appliedCoupon" class="flex items-center justify-between gap-2 px-3 h-9 bg-emerald-50 border border-gray-200 rounded-md text-sm">
        <div class="flex items-center gap-2 min-w-0">
          <UIcon name="i-heroicons-ticket" class="w-4 h-4 text-emerald-800 flex-shrink-0" />
          <span class="font-bold text-emerald-900 uppercase font-mono truncate">{{ appliedCoupon.code }}</span>
          <span class="text-emerald-900 font-medium font-mono tabular-nums">(&minus;${{ Number(appliedCoupon.discount_amount ?? totalDiscount).toFixed(2) }})</span>
        </div>
        <button
          type="button"
          class="w-7 h-7 flex items-center justify-center text-emerald-900 hover:bg-emerald-100 rounded cursor-pointer"
          title="Remove promo code"
          aria-label="Remove promo code"
          @click="$emit('removeCoupon')"
        >
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>

      <template v-else>
        <button
          v-if="!showPromo"
          type="button"
          class="self-start inline-flex items-center gap-1.5 h-8 text-sm font-semibold text-gray-700 hover:text-gray-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="cart.length === 0"
          @click="showPromo = true"
        >
          <UIcon name="i-heroicons-ticket" class="w-4 h-4" />
          <span>Add promo code</span>
        </button>

        <div v-else class="flex flex-col gap-1.5">
          <div class="flex gap-1.5">
            <input
              :value="couponCode"
              aria-label="Promo code"
              placeholder="Promo code"
              autocomplete="off"
              class="flex-1 min-w-0 h-9 bg-white border border-gray-300 rounded-md px-3 text-sm font-mono uppercase placeholder:normal-case placeholder:font-sans placeholder-gray-500 focus:border-gray-500"
              @input="$emit('update:couponCode', ($event.target as HTMLInputElement).value)"
              @keydown.enter.prevent="$emit('applyCoupon')"
              @keydown.esc.stop="showPromo = false"
            >
            <button
              type="button"
              class="px-3.5 h-9 bg-gray-900 text-white rounded-md text-sm font-semibold hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
              :disabled="!couponCode.trim() || validatingCoupon || cart.length === 0"
              @click="$emit('applyCoupon')"
            >
              {{ validatingCoupon ? 'Checking…' : 'Apply' }}
            </button>
            <button
              type="button"
              class="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer"
              title="Close promo code"
              aria-label="Close promo code field"
              @click="showPromo = false"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </button>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xs text-gray-600">Quick fill:</span>
            <button
              v-for="preset in ['SAVE5', 'SAVE10', 'SAVE15', 'VIP20']"
              :key="preset"
              type="button"
              class="px-2 h-6 rounded text-xs font-mono font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 cursor-pointer"
              @click="$emit('update:couponCode', preset)"
            >
              {{ preset }}
            </button>
          </div>
        </div>
      </template>

      <!-- Totals -->
      <dl class="flex flex-col gap-1 text-sm">
        <div class="flex justify-between text-gray-700">
          <dt>Subtotal</dt>
          <dd class="font-mono tabular-nums text-gray-900">${{ cartSubtotal.toFixed(2) }}</dd>
        </div>
        <div v-if="totalDiscount > 0" class="flex justify-between text-emerald-800 font-semibold">
          <dt>Discounts</dt>
          <dd class="font-mono tabular-nums">&minus;${{ totalDiscount.toFixed(2) }}</dd>
        </div>
        <div class="flex justify-between text-gray-700">
          <dt>VAT ({{ (taxRate * 100).toFixed(0) }}%)</dt>
          <dd class="font-mono tabular-nums text-gray-900">${{ taxAmount.toFixed(2) }}</dd>
        </div>
      </dl>

      <!-- Final payable amount -->
      <div class="flex items-end justify-between gap-3 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200">
        <div class="flex flex-col leading-tight">
          <span class="text-sm font-semibold text-gray-900">Total due</span>
          <span class="text-xs font-mono tabular-nums text-gray-600">&asymp; {{ formatRiel(grandTotal) }}</span>
        </div>
        <div class="flex items-baseline gap-0.5" aria-live="polite">
          <span class="text-lg font-bold text-gray-600 font-mono">$</span>
          <span class="text-[30px] sm:text-[32px] leading-none font-bold font-mono tabular-nums text-gray-900 tracking-tight">{{ grandTotal.toFixed(2) }}</span>
        </div>
      </div>

      <!-- Stock warning -->
      <p v-if="hasStockIssue" class="flex items-center gap-1.5 text-sm font-semibold text-red-700" role="alert">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 flex-shrink-0" />
        Some lines exceed available stock.
      </p>

      <!-- Actions -->
      <div class="flex flex-col gap-2">
        <button
          type="button"
          class="h-12 w-full bg-pay hover:bg-pay-hover disabled:bg-gray-200 disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded-lg px-4 flex items-center justify-between font-bold text-base transition-colors cursor-pointer"
          :disabled="cart.length === 0 || processingSale"
          @click="$emit('checkout')"
        >
          <span class="flex items-center gap-2">
            <UIcon :name="processingSale ? 'i-heroicons-arrow-path' : 'i-heroicons-credit-card'" class="w-5 h-5" :class="{ 'animate-spin': processingSale }" />
            {{ processingSale ? 'Processing…' : 'Pay' }}
          </span>
          <span class="flex items-center gap-2">
            <span class="font-mono tabular-nums">${{ grandTotal.toFixed(2) }}</span>
            <PosKeyHint class="hidden sm:inline-flex" tone="inverse">F4</PosKeyHint>
          </span>
        </button>

        <button
          type="button"
          class="h-10 w-full bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 rounded-lg px-3 flex items-center justify-between font-semibold text-sm transition-colors cursor-pointer border border-gray-300"
          :disabled="cart.length === 0 || processingSale"
          title="Skip method selection and show the KHQR code now (F7)"
          @click="$emit('quickAba')"
        >
          <span class="flex items-center gap-2">
            <UIcon name="i-heroicons-qr-code" class="w-4 h-4" />
            Pay by ABA KHQR
          </span>
          <PosKeyHint class="hidden sm:inline-flex">F7</PosKeyHint>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import CartItem from './CartItem.vue'
import type { CartItem as CartItemType, CustomerSummary, PosCoupon } from '~/types/pos'
import { usePosStore } from '~/stores/pos'

const props = withDefaults(
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
    showCloseButton?: boolean
  }>(),
  {
    lastUpdatedVariantId: null,
    showCloseButton: false,
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
  'close': []
}>()

const scrollEl = ref<HTMLElement | null>(null)
const showPromo = ref(false)
const flashId = ref<string | null>(null)
let flashTimer: ReturnType<typeof setTimeout> | null = null

const posStore = usePosStore()

const maxRedeemableDollars = computed(() => {
  if (!props.selectedCustomer?.loyalty_account?.points_balance) return 0
  const points = props.selectedCustomer.loyalty_account.points_balance
  // Each 100 points = $1.00 credit, up to the total cart value
  const dollarEquivalent = Math.floor(points / 100) * 1.0
  return Math.min(dollarEquivalent, Math.max(0, Math.floor(props.cartSubtotal)))
})

function redeemMaxLoyaltyPoints() {
  const dollarVal = maxRedeemableDollars.value
  if (dollarVal <= 0) return
  const pointsUsed = Math.round(dollarVal * 100)
  posStore.applyLoyaltyRedemption(pointsUsed, dollarVal)
}

const hasStockIssue = computed(() =>
  props.cart.some((i) => {
    const s = props.getLineStock(i.variant_id)
    return s !== null && i.quantity > Math.max(0, s)
  }),
)

watch(
  () => [props.lastUpdatedVariantId, props.itemCount] as const,
  async ([id]) => {
    if (!id || !props.cart.some((i) => i.variant_id === id)) return
    flashId.value = null
    await nextTick()
    flashId.value = id
    scrollEl.value
      ?.querySelector<HTMLElement>(`[data-variant-id="${CSS.escape(id)}"]`)
      ?.scrollIntoView({ block: 'nearest' })
    if (flashTimer) clearTimeout(flashTimer)
    flashTimer = setTimeout(() => { flashId.value = null }, 1000)
  },
)

watch(() => props.cart.length, (len) => { if (len === 0) showPromo.value = false })

onBeforeUnmount(() => { if (flashTimer) clearTimeout(flashTimer) })
</script>

