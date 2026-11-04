<template>
  <header
    class="no-print flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 h-14 min-h-[56px] bg-white border-b border-gray-200 z-10 select-none"
  >
    <!-- LEFT: Mobile Hamburger Menu Button (Visible on < lg) -->
    <button
      type="button"
      class="lg:hidden w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 flex items-center justify-center text-gray-700 flex-shrink-0 transition-colors cursor-pointer"
      title="Open navigation menu"
      aria-label="Open navigation menu"
      @click="openMobile"
    >
      <UIcon name="i-heroicons-bars-3" class="w-5 h-5" />
    </button>

    <!-- LEFT: Store & Register Identity -->
    <div
      class="hidden sm:flex items-center gap-2.5 flex-shrink-0 cursor-pointer hover:bg-gray-50 p-1 rounded-md transition-colors"
      title="Click to switch POS Station / Register"
      role="button"
      tabindex="0"
      @click="$emit('selectTerminal')"
      @keydown.enter="$emit('selectTerminal')"
    >
      <div class="w-8 h-8 rounded-md bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
        <UIcon name="i-heroicons-building-storefront" class="w-4 h-4" />
      </div>
      <div class="hidden md:flex flex-col leading-tight">
        <span class="text-sm font-semibold text-gray-900 whitespace-nowrap max-w-[180px] truncate">{{ branchName }}</span>
        <span class="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
          <UIcon name="i-heroicons-computer-desktop" class="w-3 h-3 text-gray-400" />
          {{ terminalId || 'POS-01' }} &bull; Register
        </span>
      </div>
    </div>

    <!-- CENTER: Product search / barcode input (always the primary control) -->
    <form
      class="flex-1 min-w-0 max-w-3xl"
      role="search"
      @submit.prevent="$emit('search')"
    >
      <div class="relative flex items-center">
        <UIcon
          name="i-heroicons-magnifying-glass"
          class="absolute left-2.5 sm:left-3 w-4 h-4 text-gray-500 pointer-events-none"
        />
        <input
          ref="inputEl"
          :value="modelValue"
          type="text"
          inputmode="search"
          enterkeyhint="search"
          autocomplete="off"
          spellcheck="false"
          title="Search or scan (F2)"
          aria-label="Search products by name or SKU, or scan a barcode"
          class="w-full h-10 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-gray-400 rounded-lg pl-8 sm:pl-10 pr-12 sm:pr-24 lg:pr-[148px] text-xs sm:text-sm font-medium text-gray-900 placeholder-gray-500 transition-colors"
          placeholder="Scan barcode or search name / SKU (F2)"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          @keydown.esc="$emit('update:modelValue', '')"
          @focus="(e: FocusEvent) => (e.target as HTMLInputElement).select()"
        >
        <!-- Clear -->
        <button
          v-if="modelValue"
          type="button"
          class="absolute right-10 sm:right-24 lg:right-[104px] w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200/70 rounded-md transition-colors cursor-pointer"
          title="Clear search (Esc)"
          aria-label="Clear search"
          @click="$emit('update:modelValue', ''); inputEl?.focus()"
        >
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
        <!-- Camera scan -->
        <button
          type="button"
          class="absolute right-1 h-8 bg-gray-900 hover:bg-gray-800 text-white rounded-md px-2 sm:px-2.5 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          title="Open camera scanner"
          @click="$emit('scan')"
        >
          <UIcon name="i-heroicons-qr-code" class="w-4 h-4" />
          <span class="hidden sm:inline">Camera</span>
        </button>
      </div>
    </form>

    <!-- RIGHT: Session tools -->
    <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto">
      <!-- Mobile Cart Toggle Button (Visible on < lg) -->
      <button
        type="button"
        class="lg:hidden relative h-9 px-2.5 sm:px-3 rounded-lg border border-gray-200 bg-gray-900 text-white flex items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer flex-shrink-0"
        title="View order cart"
        aria-label="View order cart"
        @click="$emit('toggleCart')"
      >
        <UIcon name="i-heroicons-shopping-bag" class="w-4 h-4" />
        <span
          v-if="cartCount > 0"
          class="min-w-[18px] h-4.5 px-1 rounded-full text-xs font-bold bg-white text-gray-900 flex items-center justify-center font-mono leading-none"
        >{{ cartCount }}</span>
      </button>

      <!-- Parked orders -->
      <button
        type="button"
        class="h-9 px-2 sm:px-3 rounded-lg border border-gray-200 flex items-center gap-1.5 sm:gap-2 text-sm font-semibold transition-colors cursor-pointer"
        :class="heldCount > 0
          ? 'bg-amber-50 text-amber-900 hover:bg-amber-100'
          : 'bg-white text-gray-700 hover:bg-gray-50'"
        :title="`Parked orders (F9)${heldCount ? ` — ${heldCount} waiting` : ''}`"
        @click="$emit('openParked')"
      >
        <UIcon name="i-heroicons-pause-circle" class="w-4 h-4 flex-shrink-0" />
        <span class="hidden lg:inline">Parked</span>
        <span
          v-if="heldCount > 0"
          class="min-w-[18px] h-4.5 px-1 rounded-full text-xs font-bold bg-amber-700 text-white leading-none flex items-center justify-center"
        >{{ heldCount }}</span>
        <PosKeyHint class="hidden xl:inline-flex">F9</PosKeyHint>
      </button>

      <!-- Reprint last invoice (hidden on small mobile) -->
      <button
        v-if="hasLastReceipt"
        type="button"
        class="hidden sm:flex h-9 px-2.5 sm:px-3 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 items-center gap-2 text-sm font-semibold transition-colors cursor-pointer"
        title="Reprint last invoice"
        @click="$emit('reprintLast')"
      >
        <UIcon name="i-heroicons-printer" class="w-4 h-4" />
        <span class="hidden lg:inline">Last receipt</span>
      </button>

      <!-- Shift Orders History -->
      <button
        type="button"
        class="hidden sm:flex h-9 px-2.5 sm:px-3 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 items-center gap-2 text-sm font-semibold transition-colors cursor-pointer"
        title="View shift sales history"
        @click="$emit('openHistory')"
      >
        <UIcon name="i-heroicons-clock" class="w-4 h-4" />
        <span class="hidden 2xl:inline">History</span>
      </button>

      <!-- Customer Display (opens the customer-facing screen for this register) -->
      <button
        type="button"
        class="hidden md:flex h-9 px-2.5 sm:px-3 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer"
        :title="customerDisplayOnline ? 'Customer Display is online — click to focus' : 'Open Customer Display window'"
        aria-label="Open Customer Display"
        @click="$emit('openCustomerDisplay')"
      >
        <span
          class="w-2 h-2 rounded-full flex-shrink-0"
          :class="customerDisplayOnline ? 'bg-gray-900' : 'bg-gray-300'"
        />
        <UIcon name="i-heroicons-computer-desktop" class="w-4 h-4" />
        <span class="hidden 2xl:inline">Display</span>
      </button>

      <!-- Cashier Shift / Register Drawer -->
      <button
        type="button"
        class="hidden sm:flex h-9 px-2.5 sm:px-3 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer"
        :title="shiftActive ? 'Active shift open — click to reconcile & close' : 'No active shift — click to open register'"
        @click="$emit('openShiftModal')"
      >
        <span
          class="w-2 h-2 rounded-full flex-shrink-0"
          :class="shiftActive ? 'bg-gray-900' : 'bg-gray-400'"
        />
        <UIcon name="i-heroicons-banknotes" class="w-4 h-4 text-gray-600" />
        <span class="hidden 2xl:inline">{{ shiftActive ? 'Shift' : 'Open Shift' }}</span>
      </button>

      <!-- Stickers (hidden on small mobile) -->
      <button
        type="button"
        class="hidden md:flex h-9 px-2.5 sm:px-3 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 items-center gap-2 text-sm font-semibold transition-colors cursor-pointer"
        title="Print product barcode / QR stickers"
        aria-label="Print product stickers"
        @click="$emit('openStickers')"
      >
        <UIcon name="i-heroicons-tag" class="w-4 h-4" />
        <span class="hidden 2xl:inline">Stickers</span>
      </button>

      <!-- Shortcuts (hidden on mobile) -->
      <button
        type="button"
        class="hidden sm:flex h-9 w-9 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 items-center justify-center transition-colors cursor-pointer"
        title="Keyboard shortcuts (F1)"
        aria-label="Keyboard shortcuts"
        @click="$emit('openShortcuts')"
      >
        <UIcon name="i-heroicons-command-line" class="w-4 h-4" />
      </button>

      <!-- Clock -->
      <div class="hidden xl:flex flex-col items-end leading-tight pl-1" aria-label="Current time">
        <span class="text-sm font-semibold font-mono tabular-nums text-gray-900">{{ timeStr }}</span>
        <span class="text-xs text-gray-500">{{ dateStr }}</span>
      </div>

      <!-- Cashier -->
      <div
        class="flex items-center gap-2 h-9 pl-1 pr-2 sm:pr-3 rounded-lg bg-gray-50 border border-gray-200 flex-shrink-0"
        :title="`Signed in as ${cashierName}`"
      >
        <div class="w-7 h-7 rounded-md bg-gray-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {{ cashierInitials }}
        </div>
        <div class="hidden md:flex flex-col leading-tight">
          <span class="text-xs font-semibold text-gray-900 whitespace-nowrap max-w-[110px] truncate">{{ cashierName }}</span>
          <span class="text-xs text-gray-500">Cashier</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSidebar } from '~/composables/useSidebar'

const { openMobile } = useSidebar()

defineProps<{
  branchName: string
  terminalId?: string
  cashierName: string
  cashierInitials: string
  cartCount: number
  heldCount: number
  hasLastReceipt?: boolean
  shiftActive?: boolean
  customerDisplayOnline?: boolean
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
  'openHistory': []
  'openShiftModal': []
  'toggleCart': []
  'selectTerminal': []
  'openCustomerDisplay': []
}>()

const inputEl = ref<HTMLInputElement | null>(null)

defineExpose({
  focus: () => inputEl.value?.focus(),
  select: () => inputEl.value?.select(),
  input: inputEl,
})
</script>
