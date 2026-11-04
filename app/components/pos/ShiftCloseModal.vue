<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    role="dialog"
    aria-labelledby="shift-close-title"
  >
    <div
      class="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]"
    >
      <!-- Header -->
      <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-gray-900 text-white flex items-center justify-center">
            <UIcon name="i-heroicons-calculator" class="w-5 h-5" />
          </div>
          <div>
            <h3 id="shift-close-title" class="text-base font-semibold text-gray-900 leading-tight">
              Shift Settlement &amp; Reconciliation
            </h3>
            <p class="text-xs text-gray-500">
              Station {{ summary?.terminal_code || 'POS-01' }} &bull; Count drawer cash before closing
            </p>
          </div>
        </div>
        <button
          type="button"
          class="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          @click="$emit('close')"
        >
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>

      <!-- Body / Scrollable Content -->
      <div class="p-5 space-y-4 overflow-y-auto">
        <!-- Shift Financial Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div class="p-2.5 rounded-lg border border-gray-200 bg-gray-50/50 flex flex-col">
            <span class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Start Float</span>
            <span class="text-sm font-bold font-mono text-gray-900 pt-0.5">
              ${{ Number(summary?.opening_float_usd || 0).toFixed(2) }}
            </span>
            <span class="text-[10px] text-gray-500 font-mono">
              {{ Number(summary?.opening_float_khr || 0).toLocaleString() }} ៛
            </span>
          </div>

          <div class="p-2.5 rounded-lg border border-gray-200 bg-gray-50/50 flex flex-col">
            <span class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Cash Sales</span>
            <span class="text-sm font-bold font-mono text-gray-900 pt-0.5">
              ${{ Number(summary?.cash_sales_amount || 0).toFixed(2) }}
            </span>
            <span class="text-[10px] text-gray-500">
              {{ summary?.cash_payments_count || 0 }} order{{ summary?.cash_payments_count === 1 ? '' : 's' }}
            </span>
          </div>

          <div class="p-2.5 rounded-lg border border-gray-200 bg-gray-50/50 flex flex-col">
            <span class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">ABA KHQR</span>
            <span class="text-sm font-bold font-mono text-gray-900 pt-0.5">
              ${{ Number(summary?.aba_sales_amount || 0).toFixed(2) }}
            </span>
            <span class="text-[10px] text-gray-500">
              {{ summary?.aba_payments_count || 0 }} order{{ summary?.aba_payments_count === 1 ? '' : 's' }}
            </span>
          </div>

          <div class="p-2.5 rounded-lg border border-gray-200 bg-gray-50/50 flex flex-col">
            <span class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Total Sales</span>
            <span class="text-sm font-bold font-mono text-gray-900 pt-0.5">
              ${{ Number(summary?.total_sales_amount || 0).toFixed(2) }}
            </span>
            <span class="text-[10px] text-gray-500">
              {{ summary?.total_sales_count || 0 }} orders
            </span>
          </div>
        </div>

        <!-- Expected Cash Banner -->
        <div class="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-banknotes" class="w-4 h-4 text-gray-700" />
            <span class="text-xs font-semibold text-gray-700">Expected Drawer Cash:</span>
          </div>
          <div class="text-right">
            <span class="text-sm font-bold font-mono text-gray-900">
              ${{ Number(summary?.expected_cash_usd || 0).toFixed(2) }}
            </span>
            <span v-if="Number(summary?.expected_cash_khr || 0) > 0" class="text-xs text-gray-500 font-mono ml-1.5">
              + {{ Number(summary?.expected_cash_khr || 0).toLocaleString() }} ៛
            </span>
          </div>
        </div>

        <!-- Counted Cash Form -->
        <div class="space-y-3 pt-1">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Counted Drawer Cash (USD $)
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">$</span>
              <input
                ref="countedUsdInputRef"
                v-model.number="closingCashUsd"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full h-11 pl-8 pr-3 rounded-lg border border-gray-200 focus:border-gray-400 bg-white text-base font-bold font-mono text-gray-900 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Counted Drawer Cash (KHR ៛)
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">៛</span>
              <input
                v-model.number="closingCashKhr"
                type="number"
                min="0"
                step="100"
                placeholder="0"
                class="w-full h-11 pl-8 pr-3 rounded-lg border border-gray-200 focus:border-gray-400 bg-white text-base font-bold font-mono text-gray-900 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <!-- Live Discrepancy Status Pill -->
          <div
            class="p-3 rounded-lg border border-gray-200 bg-gray-50/70 flex items-center justify-between text-xs"
          >
            <span class="font-medium text-gray-600">Reconciliation Discrepancy:</span>
            <div class="flex items-center gap-2 font-mono font-bold">
              <span v-if="usdDiff === 0 && khrDiff === 0" class="text-gray-900 flex items-center gap-1">
                <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-gray-700" />
                Balanced ($0.00)
              </span>
              <span v-else-if="usdDiff > 0" class="text-gray-900">
                +${{ usdDiff.toFixed(2) }} (Over)
              </span>
              <span v-else class="text-gray-900">
                -${{ Math.abs(usdDiff).toFixed(2) }} (Short)
              </span>

              <span v-if="khrDiff !== 0" class="text-gray-500 text-[11px]">
                {{ khrDiff > 0 ? `+${khrDiff.toLocaleString()} ៛` : `-${Math.abs(khrDiff).toLocaleString()} ៛` }}
              </span>
            </div>
          </div>

          <!-- Closing Notes -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Closing Notes / Reason for Over/Short
            </label>
            <textarea
              v-model="closingNotes"
              rows="2"
              placeholder="e.g. End of day count verified with manager"
              class="w-full p-2.5 rounded-lg border border-gray-200 focus:border-gray-400 bg-white text-xs text-gray-900 focus:outline-none transition-colors"
            ></textarea>
          </div>
        </div>

        <!-- Error Banner -->
        <div
          v-if="errorMessage"
          class="p-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-xs flex items-center gap-2"
        >
          <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
        <button
          type="button"
          class="h-9 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors"
          @click="$emit('close')"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="loading"
          class="h-9 px-4 rounded-lg bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          @click="handleCloseShift"
        >
          <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
          <UIcon v-else name="i-heroicons-lock-closed" class="w-4 h-4" />
          <span>Close Shift &amp; Print Z-Report</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { ShiftSummary } from '~/composables/useApi'

const props = defineProps<{
  isOpen: boolean
  summary: ShiftSummary | null
  loading?: boolean
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  'close': []
  'confirmClose': [payload: { closingCashUsd: number; closingCashKhr: number; notes: string }]
}>()

const closingCashUsd = ref<number>(0)
const closingCashKhr = ref<number>(0)
const closingNotes = ref<string>('')
const countedUsdInputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.summary,
  (sum) => {
    if (sum) {
      closingCashUsd.value = Number(sum.expected_cash_usd || 0)
      closingCashKhr.value = Number(sum.expected_cash_khr || 0)
    }
  },
  { immediate: true },
)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      nextTick(() => {
        countedUsdInputRef.value?.focus()
        countedUsdInputRef.value?.select()
      })
    }
  },
)

const usdDiff = computed(() => {
  const expected = Number(props.summary?.expected_cash_usd || 0)
  const actual = Number(closingCashUsd.value || 0)
  return Number((actual - expected).toFixed(2))
})

const khrDiff = computed(() => {
  const expected = Number(props.summary?.expected_cash_khr || 0)
  const actual = Number(closingCashKhr.value || 0)
  return Math.round(actual - expected)
})

function handleCloseShift() {
  emit('confirmClose', {
    closingCashUsd: Number(closingCashUsd.value) || 0,
    closingCashKhr: Number(closingCashKhr.value) || 0,
    notes: closingNotes.value.trim(),
  })
}
</script>

