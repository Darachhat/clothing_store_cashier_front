<template>
  <div class="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 select-none flex-shrink-0">
    <!-- Left: Horizontal Scrollable Category Segment Pills -->
    <div class="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto no-scrollbar">
      <button
        type="button"
        class="h-7 px-2.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border"
        :class="activeCategory === ''
          ? 'bg-gray-900 text-white border-transparent'
          : 'bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 border-gray-200/80'"
        @click="$emit('update:activeCategory', '')"
      >
        All Items
      </button>

      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        class="h-7 px-2.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border"
        :class="activeCategory === cat.name
          ? 'bg-gray-900 text-white border-transparent'
          : 'bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 border-gray-200/80'"
        @click="$emit('update:activeCategory', cat.name)"
      >
        {{ cat.name }}
      </button>
    </div>

    <!-- Right: Integrated Brand Selector & Active Filter Indicators -->
    <div class="flex items-center gap-2 flex-shrink-0 pl-2 border-l border-gray-200">
      <!-- Active Search Tag -->
      <div
        v-if="searchQuery"
        class="flex items-center gap-1 h-7 px-2 bg-amber-50 border border-gray-200 rounded-md text-[11px] font-medium text-amber-900"
      >
        <span class="max-w-[90px] truncate">&ldquo;{{ searchQuery }}&rdquo;</span>
        <button
          type="button"
          class="p-0.5 text-amber-700 hover:text-amber-950 cursor-pointer flex items-center justify-center"
          title="Clear search"
          aria-label="Clear search"
          @click="$emit('clearSearch')"
        >
          <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
        </button>
      </div>

      <!-- Brand Dropdown Pill -->
      <div class="relative flex items-center">
        <select
          :value="activeBrand"
          aria-label="Filter by brand"
          class="h-7 pl-2.5 pr-6 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-xs font-medium text-gray-800 outline-none cursor-pointer transition-colors appearance-none"
          @change="$emit('update:activeBrand', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">All Brands</option>
          <option v-for="b in brands" :key="b.id" :value="b.name">
            {{ b.name }}
          </option>
        </select>
        <UIcon
          name="i-heroicons-chevron-down"
          class="w-3 h-3 text-gray-500 absolute right-2 pointer-events-none"
        />
      </div>

      <!-- Product Count Badge -->
      <div class="hidden sm:flex items-center text-[11px] text-gray-500 font-mono font-medium whitespace-nowrap">
        <span>{{ productCount ?? 0 }} items</span>
      </div>
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
