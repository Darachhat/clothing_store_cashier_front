<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4"
      @click.self="$emit('update:modelValue', false)"
    >
      <div
        ref="dialogEl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-shortcuts-title"
        class="pos-focus bg-white rounded-xl border border-gray-200 w-full max-w-md max-h-[calc(100dvh-32px)] flex flex-col overflow-hidden"
      >
        <div class="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-command-line" class="w-5 h-5 text-gray-700" />
            <h3 id="pos-shortcuts-title" class="text-base font-semibold text-gray-900">Keyboard shortcuts</h3>
          </div>
          <button
            type="button"
            class="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close shortcuts"
            @click="$emit('update:modelValue', false)"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <ul class="p-4 flex flex-col gap-1.5 overflow-y-auto pos-scroll">
          <li
            v-for="sc in shortcuts"
            :key="sc.description"
            class="flex items-center justify-between gap-4 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200"
          >
            <span class="text-sm font-medium text-gray-800">{{ sc.description }}</span>
            <kbd class="min-w-[44px] text-center px-2 py-1 text-xs font-mono font-bold bg-white border border-gray-200 rounded text-gray-900 whitespace-nowrap">
              {{ sc.key }}
            </kbd>
          </li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useDialogFocus } from '~/composables/useDialogFocus'

const props = defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [val: boolean]
}>()

const dialogEl = ref<HTMLElement | null>(null)
useDialogFocus(toRef(props, 'modelValue'), dialogEl)

const shortcuts = [
  { key: 'F1', description: 'Show / hide this list' },
  { key: 'F2', description: 'Jump to search & scan field' },
  { key: 'F4', description: 'Pay — open payment' },
  { key: 'F7', description: 'Pay by ABA KHQR (full-screen QR)' },
  { key: 'F8', description: 'Add or change customer' },
  { key: 'F9', description: 'Park current order / open parked orders' },
  { key: 'Enter', description: 'Search field: add exact barcode/SKU, or open the only matching product' },
  { key: 'Enter', description: 'Cash field in payment: complete the sale' },
  { key: 'Enter', description: 'On the receipt: start a new sale' },
  { key: 'Esc', description: 'Close the open dialog / clear the search' },
]
</script>
