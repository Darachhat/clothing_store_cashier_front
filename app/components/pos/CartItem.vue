<template>
  <div class="flex items-center gap-2.5 p-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors select-none">
    <!-- Compact Thumbnail (40x40px) -->
    <div class="w-10 h-10 rounded-md bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200/80">
      <img
        v-if="(item.variant?.image_url || item.variant?.product?.image_url) && !imgError"
        :src="item.variant?.image_url || item.variant?.product?.image_url"
        :alt="item.variant?.product?.name"
        class="w-full h-full object-cover"
        loading="lazy"
        @error="imgError = true"
      />
      <div v-else class="text-gray-300 flex items-center justify-center">
        <UIcon name="i-heroicons-photo" class="w-4 h-4 text-gray-300" />
      </div>
    </div>

    <!-- Center: Product Name, Variant Meta, Unit Price & Discount -->
    <div class="flex-1 min-w-0 flex flex-col gap-1">
      <!-- Readable Product Name with Tooltip -->
      <div
        class="text-xs font-semibold text-gray-900 truncate leading-tight"
        :title="item.variant?.product?.name || 'Product Item'"
      >
        {{ item.variant?.product?.name || 'Product Item' }}
      </div>

      <!-- Variant, Unit Price & Discount Row -->
      <div class="flex items-center gap-1.5 flex-wrap leading-none">
        <!-- Color & Size Chip -->
        <span
          v-if="item.variant?.color || item.variant?.size"
          class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200/70"
        >
          <span
            v-if="item.variant?.color"
            class="w-2 h-2 rounded-full border border-gray-300 flex-shrink-0"
            :style="{ background: item.variant.color.hex_code || '#888' }"
          />
          <span v-if="item.variant?.color">{{ item.variant.color.name }}</span>
          <span v-if="item.variant?.color && item.variant?.size" class="text-gray-400">/</span>
          <span v-if="item.variant?.size" class="font-semibold">{{ item.variant.size.name }}</span>
        </span>

        <!-- Unit Price -->
        <span class="text-[11px] font-mono text-gray-500">
          ${{ Number(item.unit_price).toFixed(2) }}
        </span>

        <!-- Line Item Discount Action -->
        <button
          type="button"
          class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border border-gray-200 transition-colors cursor-pointer"
          :class="item.discount_amount > 0
            ? 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            : 'bg-gray-50 text-gray-500 hover:text-gray-800 hover:bg-gray-100'"
          title="Apply Line Item Discount"
          @click="$emit('discount', item)"
        >
          <UIcon name="i-heroicons-tag" class="w-2.5 h-2.5" :class="item.discount_amount > 0 ? 'text-amber-600' : 'text-gray-400'" />
          <span>{{ item.discount_amount > 0 ? `-$${item.discount_amount.toFixed(2)}` : 'Disc' }}</span>
        </button>
      </div>
    </div>

    <!-- Right: Line Total & Quantity Controls -->
    <div class="flex flex-col items-end justify-between gap-1 flex-shrink-0">
      <div class="text-xs font-bold text-gray-900 font-mono tracking-tight leading-tight">
        ${{ item.subtotal.toFixed(2) }}
      </div>

      <!-- Compact Quantity Stepper (h-7 = 28px) -->
      <div class="flex items-center bg-gray-50 border border-gray-200 rounded-md overflow-hidden h-7 flex-shrink-0">
        <button
          type="button"
          class="w-6 h-full flex-shrink-0 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 transition-colors cursor-pointer"
          title="Decrease quantity"
          aria-label="Decrease quantity"
          @click="$emit('updateQty', item.variant_id, item.quantity - 1)"
        >
          <UIcon name="i-heroicons-minus" class="w-3 h-3" />
        </button>
        <input
          type="number"
          min="1"
          aria-label="Item quantity"
          class="w-7 h-full text-center text-xs font-bold font-mono text-gray-900 bg-transparent outline-none p-0 border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          :value="item.quantity"
          @change="$emit('changeQty', item.variant_id, $event)"
        />
        <button
          type="button"
          class="w-6 h-full flex-shrink-0 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 transition-colors cursor-pointer"
          title="Increase quantity"
          aria-label="Increase quantity"
          @click="$emit('updateQty', item.variant_id, item.quantity + 1)"
        >
          <UIcon name="i-heroicons-plus" class="w-3 h-3" />
        </button>
        <button
          type="button"
          class="w-6 h-full flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-l border-gray-200"
          title="Remove item"
          aria-label="Remove item"
          @click="$emit('remove', item.variant_id)"
        >
          <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  item: any
}>()

defineEmits<{
  'discount': [item: any]
  'updateQty': [variantId: string, newQty: number]
  'changeQty': [variantId: string, event: Event]
  'remove': [variantId: string]
}>()

const imgError = ref(false)
</script>
