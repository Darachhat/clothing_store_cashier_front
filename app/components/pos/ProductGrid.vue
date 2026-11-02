<template>
  <div class="flex flex-col flex-1 min-h-0 overflow-hidden">
    <!-- Product grid (independent, visible-scrollbar scroll region) -->
    <div class="flex-1 min-h-0 overflow-y-auto pos-scroll pb-1 pr-1" :aria-busy="loading">
      <!-- Loading skeletons -->
      <div
        v-if="loading"
        class="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2.5"
        role="status"
        aria-label="Loading products"
      >
        <div
          v-for="i in 12"
          :key="i"
          class="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse flex flex-col"
        >
          <div class="aspect-[4/3] bg-gray-100" />
          <div class="p-2.5 flex flex-col gap-2">
            <div class="h-3 w-16 bg-gray-100 rounded" />
            <div class="h-4 w-4/5 bg-gray-100 rounded" />
            <div class="h-3 w-1/2 bg-gray-100 rounded" />
            <div class="mt-2 flex items-center justify-between">
              <div class="h-5 w-14 bg-gray-100 rounded" />
              <div class="w-16 h-9 rounded-md bg-gray-100" />
            </div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-lg border border-gray-200"
        role="alert"
      >
        <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-700 mb-2" />
        <h4 class="text-base font-semibold text-gray-900 mb-1">Can't load products</h4>
        <p class="text-sm text-gray-600 mb-4 max-w-sm">
          {{ errorMessage || 'The product catalogue did not respond. Check the connection and try again.' }}
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-2 h-10 px-4 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors cursor-pointer"
          @click="$emit('retry')"
        >
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
          <span>Try again</span>
        </button>
      </div>

      <!-- Product cards -->
      <div
        v-else-if="products.length > 0"
        class="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2.5 auto-rows-fr"
        role="list"
        aria-label="Product catalogue"
      >
        <PosProductCard
          v-for="prod in products"
          :key="prod.id"
          role="listitem"
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

      <!-- Empty -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-lg border border-gray-200"
      >
        <UIcon name="i-heroicons-magnifying-glass" class="w-8 h-8 text-gray-500 mb-2" />
        <h4 class="text-base font-semibold text-gray-900 mb-1">No products match</h4>
        <p class="text-sm text-gray-600 mb-4 max-w-sm">
          Check the spelling, try a SKU or barcode, or clear the category and brand filters.
        </p>
        <button
          type="button"
          class="h-10 px-4 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors cursor-pointer"
          @click="$emit('resetFilters')"
        >
          Clear all filters
        </button>
      </div>
    </div>

    <!-- Pagination (pinned under the grid) -->
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
import type { Product } from '~/types/index'

defineProps<{
  loading: boolean
  error?: boolean
  errorMessage?: string
  products: Product[]
  pagination?: PosProductPagination
  showingLabel?: string
  getProductStock: (product: Product) => number
  getResolvedPrice: (product: Product) => string | number
  getProductColors: (product: Product) => Array<{ name: string; hex?: string }>
  getProductSizes: (product: Product) => Array<{ name: string }>
  getSelectedColor: (productId: string) => string | undefined
  getSelectedSize: (productId: string) => string | undefined
}>()

defineEmits<{
  'clickProduct': [product: Product]
  'selectColor': [payload: { productId: string; color: string }]
  'selectSize': [payload: { productId: string; size: string }]
  'quickAdd': [product: Product]
  'resetFilters': []
  'retry': []
  'goToPage': [page: number]
  'nextPage': []
  'previousPage': []
}>()
</script>
