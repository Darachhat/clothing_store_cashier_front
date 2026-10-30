<template>
  <header
    class="no-print flex items-center justify-between gap-2.5 px-3 h-12 min-h-[48px] bg-white border-b border-gray-200 z-10 select-none"
  >
    <!-- LEFT: Store & Register Identity -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <div class="w-7 h-7 rounded-md bg-gray-900 text-white flex items-center justify-center font-bold flex-shrink-0">
        <UIcon name="i-heroicons-building-storefront" class="w-3.5 h-3.5 text-white" />
      </div>
      <div class="flex flex-col leading-none gap-0.5">
        <div class="flex items-center gap-1.5">
          <span class="text-xs font-bold text-gray-900 whitespace-nowrap">{{ branchName }}</span>
          <span class="relative flex h-1.5 w-1.5" title="Active Terminal">
            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
        </div>
        <span class="text-[10px] text-gray-400 whitespace-nowrap">{{ terminalId || 'REG-01' }} &bull; POS Terminal</span>
      </div>
    </div>

    <!-- CENTER: Primary Product Search & Barcode Omnibar (Expands to fill available width) -->
    <div class="flex-1 min-w-0 mx-1">
      <div class="relative flex items-center group">
        <UIcon
          name="i-heroicons-magnifying-glass"
          class="absolute left-2.5 w-3.5 h-3.5 text-gray-400 group-focus-within:text-gray-900 transition-colors pointer-events-none z-10"
        />
        <input
          ref="inputEl"
          :value="modelValue"
          aria-label="Search products by name, SKU, or scan barcode"
          class="w-full h-8 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 focus:border-gray-400 rounded-lg pl-8 pr-24 text-xs font-medium text-gray-900 placeholder-gray-400 outline-none transition-colors"
          placeholder="Scan barcode or search product name, SKU [F2]..."
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          @keydown.enter="$emit('search')"
          @keydown.esc="$emit('update:modelValue', '')"
          @focus="(e: FocusEvent) => (e.target as HTMLInputElement).select()"
        >
        <!-- Clear button -->
        <button
          v-if="modelValue"
          type="button"
          class="absolute right-[72px] p-1 text-gray-400 hover:text-gray-700 rounded transition-colors cursor-pointer flex items-center justify-center"
          title="Clear Search [Esc]"
          aria-label="Clear Search"
          @click="$emit('update:modelValue', '')"
        >
          <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
        </button>
        <!-- Barcode / Camera Scan Action Button -->
        <button
          type="button"
          class="absolute right-1 h-6 bg-gray-900 hover:bg-gray-800 text-white rounded-md px-2 flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
          title="Open Barcode Scanner [F2]"
          @click="$emit('scan')"
        >
          <UIcon name="i-heroicons-qr-code" class="w-3.5 h-3.5 text-white" />
          <span class="hidden sm:inline">Scan</span>
          <kbd class="hidden md:inline-block text-[9px] font-mono text-gray-300 bg-gray-800 px-1 rounded">F2</kbd>
        </button>
      </div>
    </div>

    <!-- RIGHT: Aligned Status & Cashier Controls -->
    <div class="flex items-center gap-1.5 flex-shrink-0">
      <!-- Print Product Stickers Button -->
      <button
        type="button"
        class="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
        title="Print Product Barcode / QR Stickers"
        @click="$emit('openStickers')"
      >
        <UIcon name="i-heroicons-tag" class="w-3.5 h-3.5" />
        <span class="hidden lg:inline text-xs">Stickers</span>
      </button>

      <!-- Reprint Last Invoice Button -->
      <button
        v-if="hasLastReceipt"
        type="button"
        class="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
        title="Reprint Last Invoice Receipt"
        @click="$emit('reprintLast')"
      >
        <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5" />
        <span class="hidden lg:inline text-xs">Last Invoice</span>
      </button>

      <!-- Parked Orders Button -->
      <button
        type="button"
        class="h-8 px-2.5 rounded-lg border border-gray-200 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
        :class="heldCount > 0
          ? 'bg-amber-50 text-amber-900 hover:bg-amber-100/80'
          : 'bg-white text-gray-600 hover:bg-gray-50'"
        title="View Parked / Held Orders [F9]"
        @click="$emit('openParked')"
      >
        <UIcon name="i-heroicons-pause-circle" class="w-3.5 h-3.5" />
        <span class="hidden lg:inline text-xs">Parked</span>
        <span
          v-if="heldCount > 0"
          class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white leading-none"
        >
          {{ heldCount }}
        </span>
        <kbd class="hidden xl:inline-block text-[9px] font-mono text-gray-400 bg-gray-100 px-1 py-0.5 rounded">F9</kbd>
      </button>

      <!-- Keyboard Shortcuts Icon -->
      <button
        type="button"
        class="w-8 h-8 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
        title="Keyboard Shortcuts [F1]"
        aria-label="Keyboard Shortcuts"
        @click="$emit('openShortcuts')"
      >
        <UIcon name="i-heroicons-command-line" class="w-3.5 h-3.5" />
      </button>

      <!-- Live Digital Clock -->
      <div class="hidden xl:flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-gray-50 border border-gray-200 text-right leading-none">
        <span class="text-xs font-bold font-mono text-gray-900">{{ timeStr }}</span>
        <span class="text-[10px] font-mono text-gray-400 border-l border-gray-200 pl-1.5">{{ dateStr }}</span>
      </div>

      <!-- Cashier User Pill -->
      <div
        class="flex items-center gap-1.5 h-8 pl-1 pr-2.5 rounded-lg bg-white border border-gray-200 cursor-default"
        :title="`Logged in cashier: ${cashierName}`"
      >
        <div class="w-6 h-6 rounded-md bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
          {{ cashierInitials }}
        </div>
        <div class="hidden md:flex flex-col leading-none gap-0.5">
          <span class="text-[11px] font-semibold text-gray-800 whitespace-nowrap max-w-[110px] truncate">{{ cashierName }}</span>
          <span class="text-[9px] text-gray-400 uppercase tracking-wider">Cashier</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  branchName: string
  terminalId?: string
  cashierName: string
  cashierInitials: string
  cartCount: number
  heldCount: number
  hasLastReceipt?: boolean
  timeStr: string
  dateStr: string
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
  'search': []
  'scan': []
  'openParked': []
  'openShortcuts': []
  'openStickers': []
  'reprintLast': []
}>()

const inputEl = ref<HTMLInputElement | null>(null)

defineExpose({
  focus: () => inputEl.value?.focus(),
  select: () => inputEl.value?.select(),
  input: inputEl
})
</script>
