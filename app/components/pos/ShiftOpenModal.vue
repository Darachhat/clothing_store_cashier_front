<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    role="dialog"
    aria-labelledby="shift-open-title"
  >
    <div
      class="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden flex flex-col"
    >
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-gray-900 text-white flex items-center justify-center">
            <UIcon name="i-heroicons-lock-open" class="w-5 h-5" />
          </div>
          <div>
            <h3 id="shift-open-title" class="text-base font-semibold text-gray-900 leading-tight">
              Open Cashier Shift
            </h3>
            <p class="text-xs text-gray-500">
              Station {{ terminalCode || 'POS-01' }} &bull; Set initial drawer float
            </p>
          </div>
        </div>
        <button
          v-if="allowDismiss"
          type="button"
          class="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          @click="$emit('close')"
        >
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>

      <!-- Modal Body -->
      <form class="p-5 space-y-4" @submit.prevent="handleSubmit">
        <!-- USD Float Input -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Starting Float (USD $)
            </label>
            <span class="text-xs text-gray-500 font-mono">US Dollars</span>
          </div>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">$</span>
            <input
              ref="floatUsdInputRef"
              v-model.number="floatUsd"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              class="w-full h-11 pl-8 pr-3 rounded-lg border border-gray-200 focus:border-gray-400 bg-white text-base font-bold font-mono text-gray-900 focus:outline-none transition-colors"
              required
            />
          </div>
          <!-- Presets -->
          <div class="flex items-center gap-1.5 pt-1">
            <button
              v-for="preset in [50, 100, 200]"
              :key="preset"
              type="button"
              class="px-2.5 py-1 rounded-md text-xs font-semibold border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
              @click="floatUsd = preset"
            >
              +${{ preset }}
            </button>
            <button
              type="button"
              class="px-2 py-1 rounded-md text-xs font-semibold border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors ml-auto"
              @click="floatUsd = 0"
            >
              Clear
            </button>
          </div>
        </div>

        <!-- KHR Float Input -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Starting Float (KHR ៛)
            </label>
            <span class="text-xs text-gray-500 font-mono">Khmer Riel</span>
          </div>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">៛</span>
            <input
              v-model.number="floatKhr"
              type="number"
              min="0"
              step="100"
              placeholder="0"
              class="w-full h-11 pl-8 pr-3 rounded-lg border border-gray-200 focus:border-gray-400 bg-white text-base font-bold font-mono text-gray-900 focus:outline-none transition-colors"
            />
          </div>
          <!-- KHR Presets -->
          <div class="flex items-center gap-1.5 pt-1">
            <button
              v-for="preset in [200000, 400000, 800000]"
              :key="preset"
              type="button"
              class="px-2.5 py-1 rounded-md text-xs font-semibold border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
              @click="floatKhr = preset"
            >
              +{{ (preset / 1000).toLocaleString() }}k ៛
            </button>
          </div>
        </div>

        <!-- Notes Input -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Shift Notes (Optional)
          </label>
          <input
            v-model="notes"
            type="text"
            maxlength="200"
            placeholder="e.g. Morning opening shift"
            class="w-full h-9 px-3 rounded-lg border border-gray-200 focus:border-gray-400 bg-white text-xs text-gray-900 focus:outline-none transition-colors"
          />
        </div>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="p-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-xs flex items-center gap-2"
        >
          <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Submit Button -->
        <div class="pt-2">
          <button
            type="submit"
            :disabled="loading"
            class="w-full h-11 rounded-lg bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            <UIcon v-else name="i-heroicons-check-circle" class="w-4 h-4" />
            <span>Open Register &amp; Begin Shift</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  isOpen: boolean
  terminalCode?: string
  loading?: boolean
  errorMessage?: string | null
  allowDismiss?: boolean
}>()

const emit = defineEmits<{
  'close': []
  'openShift': [payload: { openingFloatUsd: number; openingFloatKhr: number; notes: string }]
}>()

const floatUsd = ref<number>(100)
const floatKhr = ref<number>(400000)
const notes = ref<string>('')
const floatUsdInputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      nextTick(() => {
        floatUsdInputRef.value?.focus()
        floatUsdInputRef.value?.select()
      })
    }
  },
  { immediate: true },
)

function handleSubmit() {
  emit('openShift', {
    openingFloatUsd: Number(floatUsd.value) || 0,
    openingFloatKhr: Number(floatKhr.value) || 0,
    notes: notes.value.trim(),
  })
}
</script>

