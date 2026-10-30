<template>
  <article
    class="group relative bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full cursor-pointer transition-colors duration-150 hover:border-gray-300 select-none"
    @click="$emit('click')"
  >
    <!-- 1. Product Image (4:3 Landscape Aspect Ratio) -->
    <div class="relative aspect-[4/3] w-full bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 border-b border-gray-100">
      <img
        v-if="product.image_url && !imgError"
        :src="product.image_url"
        :alt="product.name"
        class="w-full h-full object-cover"
        loading="lazy"
        @error="imgError = true"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
        <UIcon name="i-heroicons-photo" class="w-7 h-7 text-gray-300" />
      </div>

      <!-- Brand Overlay Badge (Top Left) -->
      <span
        v-if="product.brand"
        class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/90 text-gray-700 border border-gray-200/80 max-w-[50%] truncate leading-none"
      >
        {{ product.brand.name }}
      </span>

      <!-- Stock Availability Badge (Top Right) -->
      <span
        class="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-white/95 border border-gray-200/80 flex items-center gap-1 leading-none"
      >
        <span
          class="w-1.5 h-1.5 rounded-full flex-shrink-0"
          :class="stock <= 0
            ? 'bg-rose-500'
            : stock <= 10
              ? 'bg-amber-500'
              : 'bg-emerald-500'"
        />
        <span class="text-gray-700">
          {{ stock > 0 ? (stock <= 10 ? `${stock} left` : `${stock}`) : 'Out' }}
        </span>
      </span>
    </div>

    <!-- Product Info Content -->
    <div class="p-2 flex flex-col flex-1 justify-between gap-1 min-w-0">
      <!-- 2. Brand / Category Metadata & 3. Product Name -->
      <div class="flex flex-col gap-0.5 min-w-0">
        <div class="text-[10px] font-medium text-gray-400 uppercase tracking-wider truncate leading-tight">
          {{ product.category?.name || product.brand?.name || 'Apparel' }}
        </div>

        <h3
          class="text-xs font-semibold text-gray-900 line-clamp-2 min-h-[32px] leading-4 group-hover:text-gray-950"
          :title="product.name"
        >
          {{ product.name }}
        </h3>
      </div>

      <!-- 4. Compact Variant & Size Row (Lightweight, no heavy box) -->
      <div class="flex items-center justify-between gap-1 min-h-[18px] text-[10px] text-gray-500 min-w-0">
        <!-- Compact Color Swatches -->
        <div v-if="colors.length > 0" class="flex items-center gap-1 overflow-hidden flex-shrink-0">
          <button
            v-for="color in colors.slice(0, 4)"
            :key="color.name"
            type="button"
            class="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0 cursor-pointer transition-transform"
            :class="selectedColor === color.name ? 'scale-110 ring-1 ring-gray-900 ring-offset-1' : ''"
            :style="{ background: color.hex || '#666' }"
            :title="`Color: ${color.name}`"
            :aria-label="`Select color ${color.name}`"
            @click.stop="$emit('selectColor', color.name)"
          />
          <span v-if="colors.length > 4" class="text-[9px] text-gray-400 font-medium leading-none">+{{ colors.length - 4 }}</span>
        </div>
        <span v-else class="text-[10px] text-gray-400 truncate">Std</span>

        <!-- Concise Size Availability -->
        <div class="truncate text-[10px] font-medium text-gray-500 font-mono text-right">
          <span v-if="sizes.length > 3" :title="sizes.map(s => s.name).join(', ')">
            {{ sizes[0]?.name }}–{{ sizes[sizes.length - 1]?.name }} ({{ sizes.length }})
          </span>
          <span v-else-if="sizes.length > 1">
            {{ sizes.map(s => s.name).join('·') }}
          </span>
          <span v-else-if="sizes.length === 1">
            {{ sizes[0].name }}
          </span>
          <span v-else-if="variantCount > 1">
            {{ variantCount }} vars
          </span>
        </div>
      </div>

      <!-- 5. Price and Add-to-Cart Button -->
      <div class="pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1.5 mt-auto">
        <div class="flex items-baseline gap-0.5 min-w-0">
          <span class="text-[11px] text-gray-400 font-mono font-medium">$</span>
          <span class="text-sm font-bold text-gray-900 font-mono tracking-tight truncate">{{ price }}</span>
        </div>

        <button
          type="button"
          class="h-7 px-2 rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-1 transition-colors cursor-pointer border border-transparent text-[11px] font-semibold flex-shrink-0"
          :title="stock <= 0 ? 'Out of stock' : `Add ${product.name} to Cart`"
          :disabled="stock <= 0"
          @click.stop="$emit('quickAdd')"
        >
          <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  product: any
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
</script>
