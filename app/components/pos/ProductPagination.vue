<template>
  <!-- Pagination sits directly below the Product Grid in a unified single row -->
  <div
    v-if="totalPages > 0"
    class="flex items-center justify-between pt-2 mt-1 border-t border-gray-200 px-1 select-none flex-shrink-0 gap-2"
    role="navigation" aria-label="Product pagination"
  >
    <!-- Left: Showing X–Y of Z label -->
    <div class="text-xs sm:text-sm text-gray-600 font-medium select-none truncate">
      {{ showingLabel }}
    </div>

    <!-- Right: Page Buttons Row -->
    <div class="flex items-center gap-1 flex-shrink-0" role="navigation">
      <!-- Previous Button -->
      <button
        id="pos-pagination-prev"
        type="button"
        class="flex items-center gap-1 h-8 sm:h-9 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-semibold border transition-colors duration-150 cursor-pointer select-none"
        :class="hasPrevious
          ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          : 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed'"
        :disabled="!hasPrevious"
        :aria-disabled="!hasPrevious"
        @click="hasPrevious && $emit('previous')"
      >
        <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" />
        <span class="hidden md:inline">Prev</span>
      </button>

      <!-- Page Number Buttons -->
      <template v-for="item in pageItems" :key="item.key">
        <!-- Ellipsis -->
        <span
          v-if="item.type === 'ellipsis'"
          class="px-0.5 sm:px-1 text-xs sm:text-sm text-gray-500 select-none"
        >
          …
        </span>
        <!-- Page button -->
        <button
          v-else
          :id="`pos-pagination-page-${item.page}`"
          type="button"
          class="min-w-[28px] h-8 sm:h-9 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-semibold border transition-colors duration-150 cursor-pointer select-none"
          :class="item.page === currentPage
            ? 'bg-gray-900 text-white border-transparent'
            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'"
          :aria-current="item.page === currentPage ? 'page' : undefined"
          @click="item.page !== currentPage && $emit('goToPage', item.page)"
        >
          {{ item.page }}
        </button>
      </template>

      <!-- Next Button -->
      <button
        id="pos-pagination-next"
        type="button"
        class="flex items-center gap-1 h-8 sm:h-9 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-semibold border transition-colors duration-150 cursor-pointer select-none"
        :class="hasNext
          ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          : 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed'"
        :disabled="!hasNext"
        :aria-disabled="!hasNext"
        @click="hasNext && $emit('next')"
      >
        <span class="hidden md:inline">Next</span>
        <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
  showingLabel: string
}>()

defineEmits<{
  'goToPage': [page: number]
  'next': []
  'previous': []
}>()

/**
 * Build the list of page items to display with ellipsis.
 * Shows at most 7 page buttons, collapsing distant ranges to '…'.
 *
 * Examples:
 *   1  2  3  4  5   (5 pages total)
 *   1  2  3  …  12  13  14  (14 pages, on page 1)
 *   1  …  5  6  7  …  14   (14 pages, on page 6)
 *   1  2  3  …  12  13  14  (14 pages, on page 13)
 */
const pageItems = computed(() => {
  const total = props.totalPages
  const current = props.currentPage

  if (total <= 7) {
    // Show all pages when there aren't many
    return Array.from({ length: total }, (_, i) => ({
      type: 'page' as const,
      page: i + 1,
      key: `p${i + 1}`,
    }))
  }

  const items: Array<{ type: 'page' | 'ellipsis'; page: number; key: string }> = []

  const addPage = (p: number) => items.push({ type: 'page', page: p, key: `p${p}` })
  const addEllipsis = (pos: string) => items.push({ type: 'ellipsis', page: -1, key: `e${pos}` })

  // Always show first page
  addPage(1)

  if (current <= 4) {
    // Near start: 1 2 3 4 5 … last
    for (let p = 2; p <= Math.min(5, total - 1); p++) addPage(p)
    if (total > 6) addEllipsis('end')
    addPage(total)
  } else if (current >= total - 3) {
    // Near end: 1 … (last-4) (last-3) (last-2) (last-1) last
    addEllipsis('start')
    for (let p = Math.max(2, total - 4); p <= total; p++) addPage(p)
  } else {
    // Middle: 1 … (c-1) c (c+1) … last
    addEllipsis('start')
    addPage(current - 1)
    addPage(current)
    addPage(current + 1)
    addEllipsis('end')
    addPage(total)
  }

  return items
})
</script>
