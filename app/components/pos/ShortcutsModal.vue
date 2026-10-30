<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      @click.self="$emit('update:modelValue', false)"
    >
      <div class="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <!-- Header -->
        <div class="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-command-line" class="w-4 h-4 text-gray-700" />
            <h3 class="text-sm font-bold text-gray-900">POS Keyboard Shortcuts</h3>
          </div>
          <button
            type="button"
            class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            @click="$emit('update:modelValue', false)"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-3.5 flex flex-col gap-1.5">
          <div
            v-for="sc in shortcuts"
            :key="sc.key"
            class="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200"
          >
            <kbd class="px-1.5 py-0.5 text-[11px] font-mono font-bold bg-white border border-gray-200 rounded text-gray-900 shadow-2xs">
              {{ sc.key }}
            </kbd>
            <span class="text-xs font-medium text-gray-700">{{ sc.description }}</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [val: boolean]
}>()

const shortcuts = [
  { key: 'F1', description: 'Keyboard Shortcuts Cheat Sheet' },
  { key: 'F2', description: 'Focus Search & Scan Omnibar' },
  { key: 'F4', description: 'Open Payment / Checkout Modal' },
  { key: 'F7', description: 'Quick Pay with ABA KHQR (Full-Screen Kiosk)' },
  { key: 'F8', description: 'Assign or Change Customer' },
  { key: 'F9', description: 'Park / Hold Current Order' },
  { key: 'Esc', description: 'Close Any Open Modal / Clear Search' },
  { key: 'Enter', description: 'Confirm / Add / Proceed' },
]
</script>
