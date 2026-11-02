<template>
  <article
    class="group relative bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full transition-colors duration-150 hover:border-gray-400 select-none"
    :class="{ 'bg-gray-50': stock <= 0 }"
  >
    <!-- Main selectable area: image + identity (one real button = keyboard + screen-reader friendly) -->
    <button
      type="button"
      class="text-left flex flex-col flex-1 min-w-0 cursor-pointer"
      :aria-label="`${product.name}, ${stockText}. ${variantCount > 1 ? 'Choose size and colour' : 'Add to order'}`"
      @click="$emit('click')"
    >
      <div class="relative aspect-[4/3] w-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
        <img
          v-if="product.image_url && !imgError"
          :src="product.image_url"
          :alt="''"
          class="w-full h-full object-cover"
          :class="{ 'grayscale opacity-70': stock <= 0 }"
          loading="lazy"
          @error="imgError = true"
        >
        <UIcon v-else name="i-heroicons-photo" class="w-8 h-8 text-gray-400" />

        <!-- Stock state: text + dot, never colour alone -->
        <span
          class="absolute top-1.5 right-1.5 px-1.5 h-5 rounded text-xs font-semibold bg-white/95 border border-gray-200 flex items-center gap-1 leading-none"
          :class="stock <= 0 ? 'text-red-700' : stock <= 10 ? 'text-amber-800' : 'text-gray-700'"
        >
          <span
            class="w-1.5 h-1.5 rounded-full flex-shrink-0"
            :class="stock <= 0 ? 'bg-red-600' : stock <= 10 ? 'bg-amber-600' : 'bg-emerald-600'"
          />
          {{ stockText }}
        </span>
      </div>

      <div class="px-2.5 pt-2 flex flex-col gap-0.5 min-w-0">
        <span class="text-xs font-medium text-gray-500 truncate leading-tight">
          {{ product.brand?.name || product.category?.name || 'Apparel' }}
        </span>
        <h3
          class="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[36px] leading-[18px]"
          :title="product.name"
        >
          {{ product.name }}
        </h3>
        <span class="text-xs font-mono text-gray-500 truncate leading-tight" :title="skuLabel">{{ skuLabel }}</span>
      </div>
    </button>

    <!-- Colour swatches + sizes -->
    <div class="px-2.5 pt-1.5 flex items-center justify-between gap-2 min-h-[28px] min-w-0">
      <div v-if="colors.length > 0" class="flex items-center gap-0.5 flex-shrink-0">
        <button
          v-for="color in colors.slice(0, 4)"
          :key="color.name"
          type="button"
          class="w-6 h-6 flex items-center justify-center rounded-full cursor-pointer"
          :aria-label="`Colour ${color.name}`"
          :aria-pressed="selectedColor === color.name"
          :title="color.name"
          @click.stop="$emit('selectColor', color.name)"
        >
          <span
            class="w-4 h-4 rounded-full border border-gray-300 block"
            :class="selectedColor === color.name ? 'ring-2 ring-gray-900 ring-offset-1' : ''"
            :style="{ background: color.hex || '#6B7280' }"
          />
        </button>
        <span v-if="colors.length > 4" class="text-xs text-gray-600 font-medium">+{{ colors.length - 4 }}</span>
      </div>
      <span v-else class="text-xs text-gray-500">One colour</span>

      <span class="truncate text-xs font-medium text-gray-600 font-mono text-right">
        <template v-if="sizes.length > 3">{{ sizes[0]?.name }}–{{ sizes[sizes.length - 1]?.name }} ({{ sizes.length }})</template>
        <template v-else-if="sizes.length > 0">{{ sizes.map(s => s.name).join(' · ') }}</template>
        <template v-else-if="variantCount > 1">{{ variantCount }} variants</template>
      </span>
    </div>

    <!-- Price + add -->
    <div class="p-2.5 pt-2 flex items-center justify-between gap-2 mt-auto">
      <div class="flex items-baseline gap-1 min-w-0">
        <span v-if="showFrom" class="text-xs text-gray-500">from</span>
        <span class="text-base font-bold text-gray-900 font-mono tabular-nums truncate">${{ displayPrice }}</span>
      </div>

      <button
        type="button"
        class="h-9 px-3 rounded-md bg-gray-900 text-white hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-1 transition-colors cursor-pointer text-sm font-semibold flex-shrink-0"
        :title="stock <= 0 ? 'Out of stock' : needsChoice ? `Choose variant for ${product.name}` : `Add ${product.name} to order`"
        :disabled="stock <= 0"
        @click.stop="$emit('quickAdd')"
      >
        <UIcon :name="needsChoice ? 'i-heroicons-squares-2x2' : 'i-heroicons-plus'" class="w-4 h-4" />
        <span>{{ needsChoice ? 'Choose' : 'Add' }}</span>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Product } from '~/types/index'

const props = defineProps<{
  product: Product
  stock: number
  price: string | number
  variantCount: number
  colors: Array<{ name: string; hex?: string }>
  sizes: Array<{ name: string }>
  selectedColor?: string
  selectedSize?: string
}>()

defineEmits<{
  'click': []
  'selectColor': [color: string]
  'selectSize': [size: string]
  'quickAdd': []
}>()

const imgError = ref(false)

const stockText = computed(() =>
  props.stock <= 0 ? 'Out of stock' : props.stock <= 10 ? `${props.stock} left` : `${props.stock} in stock`,
)

const skuLabel = computed(() => {
  const v = props.product?.variants
  if (Array.isArray(v) && v.length === 1 && v[0]) return v[0].sku || v[0].barcode || props.product.code || ''
  return props.product?.code || ''
})

/** Multi-variant product with nothing preselected → the button opens the variant picker. */
const needsChoice = computed(() => props.variantCount > 1 && !props.selectedColor && !props.selectedSize)

/** Real variant prices (from the API payload) — show "from" only when they truly differ. */
const priceRange = computed(() => {
  const prices = (props.product?.variants || [])
    .map((v) => Number(v.selling_price))
    .filter((n) => Number.isFinite(n))
  if (prices.length < 2) return null
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? null : { min, max }
})

const showFrom = computed(() => needsChoice.value && priceRange.value !== null)
const displayPrice = computed(() => (showFrom.value && priceRange.value ? priceRange.value.min.toFixed(2) : props.price))
</script>
