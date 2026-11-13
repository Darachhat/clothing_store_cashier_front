<template>
  <div class="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-gray-200 select-none flex-shrink-0">
    <!-- CATEGORY_MODEL navigation -->
    <nav
      class="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto pos-scroll pb-0.5"
      aria-label="Product categories"
    >
      <button
        type="button"
        class="h-8 px-3 rounded-md text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer border"
        :class="activeCategory === ''
          ? 'bg-gray-900 text-white border-transparent'
          : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'"
        :aria-pressed="activeCategory === ''"
        @click="$emit('update:activeCategory', '')"
      >
        All
      </button>

      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        class="h-8 px-3 rounded-md text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer border"
        :class="activeCategory === cat.name
          ? 'bg-gray-900 text-white border-transparent'
          : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'"
        :aria-pressed="activeCategory === cat.name"
        @click="$emit('update:activeCategory', cat.name)"
      >
        {{ cat.name }}
      </button>
    </nav>

    <!-- BRAND_MODEL filter, active search chip, result count -->
    <div class="flex items-center gap-2 flex-shrink-0 pl-3 border-l border-gray-200">
      <div
        v-if="searchQuery"
        class="flex items-center gap-1 h-8 pl-2.5 pr-1 bg-gray-100 border border-gray-200 rounded-md text-sm font-medium text-gray-800"
      >
        <span class="max-w-[120px] truncate">&ldquo;{{ searchQuery }}&rdquo;</span>
        <button
          type="button"
          class="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded cursor-pointer"
          title="Clear search"
          aria-label="Clear search"
          @click="$emit('clearSearch')"
        >
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>

      <div class="relative flex items-center">
        <select
          :value="activeBrand"
          aria-label="Filter by brand"
          class="h-8 pl-3 pr-8 bg-white hover:bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-800 cursor-pointer transition-colors appearance-none"
          @change="$emit('update:activeBrand', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">All brands</option>
          <option v-for="b in brands" :key="b.id" :value="b.name">
            {{ b.name }}
          </option>
        </select>
        <UIcon
          name="i-heroicons-chevron-down"
          class="w-4 h-4 text-gray-500 absolute right-2 pointer-events-none"
        />
      </div>

      <span class="hidden lg:block text-sm text-gray-600 font-medium tabular-nums whitespace-nowrap" aria-live="polite">
        {{ productCount ?? 0 }} products
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  categories: Array<{ id: string; name: string }>
  brands: Array<{ id: string; name: string; logo_url?: string }>
  activeCategory: string
  activeBrand: string
  productCount?: number
  showingLabel?: string
  searchQuery?: string
}>()

defineEmits<{
  'update:activeCategory': [category: string]
  'update:activeBrand': [brand: string]
  'clearSearch': []
}>()
</script>
