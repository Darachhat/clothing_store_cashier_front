<template>
  <div class="flex flex-col flex-1 min-h-0 overflow-hidden">
    <!-- ── Product Grid Area (Independent Scroll) ────────────────── -->
    <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-1">
      <!-- Loading Skeletons -->
      <div
        v-if="loading"
        class="grid grid-cols-[repeat(auto-fill,minmax(152px,1fr))] gap-2"
      >
        <div
          v-for="i in 12"
          :key="i"
          class="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse flex flex-col"
        >
          <div class="aspect-[4/3] bg-gray-100" />
          <div class="p-2 flex flex-col gap-1.5">
            <div class="h-2.5 w-14 bg-gray-100 rounded" />
            <div class="h-3.5 w-4/5 bg-gray-100 rounded" />
            <div class="h-3 w-1/2 bg-gray-100 rounded" />
            <div class="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between">
              <div class="h-4 w-12 bg-gray-100 rounded" />
              <div class="w-12 h-7 rounded-md bg-gray-100" />
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-lg border border-gray-200"
      >
        <div class="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-2.5 border border-gray-200">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-rose-500" />
        </div>
        <h4 class="text-sm font-semibold text-gray-900 mb-1">Unable to load products</h4>
        <p class="text-xs text-gray-500 mb-3 max-w-xs">
          {{ errorMessage || 'Failed to connect to product catalog. Please verify server connection and try again.' }}
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-8 px-3.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors cursor-pointer border border-transparent"
          @click="$emit('retry')"
        >
          <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 text-white" />
          <span>Retry</span>
        </button>
      </div>

      <!-- Product Cards Grid -->
      <div
        v-else-if="products.length > 0"
        class="grid grid-cols-[repeat(auto-fill,minmax(152px,1fr))] gap-2 auto-rows-fr"
        role="region"
        aria-label="Product Catalog"
      >
        <PosProductCard
          v-for="prod in products"
          :key="prod.id"
          :product="prod"
          :stock="getProductStock(prod)"
          :price="getResolvedPrice(prod)"
          :variant-count="prod.variants?.length || 1"
          :colors="getProductColors(prod)"
          :sizes="getProductSizes(prod)"
          :selected-color="getSelectedColor(prod.id)"
          :selected-size="getSelectedSize(prod.id)"
          @click="$emit('clickProduct', prod)"
          @select-color="(color) => $emit('selectColor', { productId: prod.id, color })"
          @select-size="(size) => $emit('selectSize', { productId: prod.id, size })"
          @quick-add="$emit('quickAdd', prod)"
        />
      </div>

      <!-- Empty Search State -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-lg border border-gray-200"
      >
        <div class="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2.5 border border-gray-200">
          <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5" />
        </div>
        <h4 class="text-sm font-semibold text-gray-900 mb-1">No products match your criteria</h4>
        <p class="text-xs text-gray-500 mb-3 max-w-xs">
          Try searching by a different name, SKU, category, or clear active filters.
        </p>
        <button
          type="button"
          class="h-8 px-3.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors cursor-pointer border border-transparent"
          @click="$emit('resetFilters')"
        >
          Reset All Filters
        </button>
      </div>
    </div>

    <!-- ── Pagination — directly below the product grid ─────────── -->
    <ProductPagination
      v-if="!loading && !error && pagination"
      :current-page="pagination.page"
      :total-pages="pagination.totalPages"
      :has-next="pagination.hasNext"
      :has-previous="pagination.hasPrevious"
      :showing-label="showingLabel || ''"
      @go-to-page="$emit('goToPage', $event)"
      @next="$emit('nextPage')"
      @previous="$emit('previousPage')"
    />
  </div>
</template>

<script setup lang="ts">
import ProductPagination from './ProductPagination.vue'
import type { PosProductPagination } from '~/composables/usePosProducts'

defineProps<{
  loading: boolean
  error?: boolean
  errorMessage?: string
  products: any[]
  pagination?: PosProductPagination
  showingLabel?: string
  getProductStock: (product: any) => number
  getResolvedPrice: (product: any) => string | number
  getProductColors: (product: any) => Array<{ name: string; hex?: string }>
  getProductSizes: (product: any) => Array<{ name: string }>
  getSelectedColor: (productId: string) => string | undefined
  getSelectedSize: (productId: string) => string | undefined
}>()

defineEmits<{
  'clickProduct': [product: any]
  'selectColor': [payload: { productId: string; color: string }]
  'selectSize': [payload: { productId: string; size: string }]
  'quickAdd': [product: any]
  'resetFilters': []
  'retry': []
  'goToPage': [page: number]
  'nextPage': []
  'previousPage': []
}>()
</script>
