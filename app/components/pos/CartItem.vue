<template>
  <li
    class="flex flex-col gap-2 p-2.5 bg-white border rounded-lg transition-colors select-none list-none"
    :class="[
      invalid ? 'border-gray-200 bg-red-50/60' : 'border-gray-200 hover:border-gray-300',
      highlight ? 'pos-line-flash' : '',
    ]"
  >
    <!-- Row 1: identity + line total -->
    <div class="flex items-start gap-2.5">
      <div class="w-11 h-11 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
        <img
          v-if="(item.variant?.image_url || item.variant?.product?.image_url) && !imgError"
          :src="(item.variant?.image_url || item.variant?.product?.image_url) || undefined"
          alt=""
          class="w-full h-full object-cover"
          loading="lazy"
          @error="imgError = true"
        >
        <UIcon v-else name="i-heroicons-photo" class="w-5 h-5 text-gray-400" />
      </div>

      <div class="flex-1 min-w-0 flex flex-col gap-1">
        <div
          class="text-sm font-semibold text-gray-900 leading-tight line-clamp-2"
          :title="item.variant?.product?.name || 'Product'"
        >
          {{ item.variant?.product?.name || 'Product' }}
        </div>
        <div class="flex items-center gap-1.5 flex-wrap text-xs text-gray-600">
          <span
            v-if="item.variant?.color || item.variant?.size"
            class="inline-flex items-center gap-1 px-1.5 h-5 rounded bg-gray-100 text-gray-800 font-medium"
          >
            <span
              v-if="item.variant?.color"
              class="w-2.5 h-2.5 rounded-full border border-gray-300 flex-shrink-0"
              :style="{ background: item.variant.color.hex_code || '#6B7280' }"
            />
            <span v-if="item.variant?.color">{{ item.variant.color.name }}</span>
            <span v-if="item.variant?.color && item.variant?.size" aria-hidden="true">/</span>
            <span v-if="item.variant?.size" class="font-semibold">{{ item.variant.size.name }}</span>
          </span>
          <span class="font-mono tabular-nums">${{ Number(item.unit_price).toFixed(2) }} each</span>
        </div>
      </div>

      <div class="text-right flex-shrink-0">
        <div class="text-base font-bold text-gray-900 font-mono tabular-nums leading-tight">
          ${{ item.subtotal.toFixed(2) }}
        </div>
        <div v-if="item.discount_amount > 0" class="text-xs text-gray-600 font-mono tabular-nums">
          incl. &minus;${{ item.discount_amount.toFixed(2) }}
        </div>
      </div>
    </div>

    <!-- Stock problem (text + icon, not colour alone) -->
    <div v-if="invalid" class="flex items-center gap-1.5 text-xs font-semibold text-red-700" role="alert">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 flex-shrink-0" />
      <span v-if="lineStock !== null && lineStock !== undefined && lineStock <= 0">Out of stock — remove this item</span>
      <span v-else>Only {{ lineStock }} available — reduce quantity</span>
    </div>

    <!-- Row 2: controls -->
    <div class="flex items-center justify-between gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs font-semibold border border-gray-200 transition-colors cursor-pointer"
        :class="item.discount_amount > 0
          ? 'bg-amber-50 text-amber-900 hover:bg-amber-100'
          : 'bg-white text-gray-700 hover:bg-gray-100'"
        title="Set line discount"
        @click="$emit('discount', item)"
      >
        <UIcon name="i-heroicons-tag" class="w-3.5 h-3.5" />
        <span>{{ item.discount_amount > 0 ? `−$${item.discount_amount.toFixed(2)}` : 'Discount' }}</span>
      </button>

      <div class="flex items-center gap-2">
        <!-- Quantity stepper -->
        <div class="flex items-center border border-gray-300 rounded-md overflow-hidden h-9 bg-white">
          <button
            type="button"
            class="w-9 h-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            :title="item.quantity <= 1 ? 'Remove item' : 'Decrease quantity'"
            :aria-label="item.quantity <= 1 ? 'Remove item' : 'Decrease quantity'"
            @click="$emit('updateQty', item.variant_id, item.quantity - 1)"
          >
            <UIcon :name="item.quantity <= 1 ? 'i-heroicons-trash' : 'i-heroicons-minus'" class="w-4 h-4" :class="item.quantity <= 1 ? 'text-red-700' : ''" />
          </button>
          <input
            type="number"
            min="1"
            inputmode="numeric"
            :aria-label="`Quantity of ${item.variant?.product?.name || 'item'}`"
            class="w-11 h-full text-center text-sm font-bold font-mono tabular-nums text-gray-900 bg-transparent p-0 border-0 border-x border-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            :value="item.quantity"
            @focus="(e: FocusEvent) => (e.target as HTMLInputElement).select()"
            @change="$emit('changeQty', item.variant_id, $event)"
          >
          <button
            type="button"
            class="w-9 h-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Increase quantity"
            aria-label="Increase quantity"
            @click="$emit('updateQty', item.variant_id, item.quantity + 1)"
          >
            <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          </button>
        </div>

        <!-- Remove: deliberately apart from the stepper to avoid mis-taps -->
        <button
          type="button"
          class="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
          title="Remove item from order"
          aria-label="Remove item from order"
          @click="$emit('remove', item.variant_id)"
        >
          <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
        </button>
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CartItem } from '~/types/pos'

const props = defineProps<{
  item: CartItem
  /** Known on-hand stock for this variant, or null/undefined when stock is not loaded. */
  lineStock?: number | null
  /** True for the line that was just added / changed (brief visual flash). */
  highlight?: boolean
}>()

defineEmits<{
  'discount': [item: CartItem]
  'updateQty': [variantId: string, newQty: number]
  'changeQty': [variantId: string, event: Event]
  'remove': [variantId: string]
}>()

const imgError = ref(false)

const invalid = computed(() =>
  props.lineStock !== null && props.lineStock !== undefined && props.item.quantity > Math.max(0, props.lineStock),
)
</script>
