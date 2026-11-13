<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    role="dialog"
    aria-labelledby="z-report-title"
  >
    <div
      class="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-sm w-full overflow-hidden flex flex-col max-h-[92vh]"
    >
      <!-- Header -->
      <div class="no-print px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-gray-900" />
          <h3 id="z-report-title" class="text-sm font-semibold text-gray-900">
            Shift Z-Report (Settlement)
          </h3>
        </div>
        <button
          type="button"
          class="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          @click="$emit('close')"
        >
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>

      <!-- Printable 80mm Slip Body -->
      <div class="p-4 overflow-y-auto font-mono text-xs text-gray-900 space-y-3 bg-white">
        <!-- Store BRAND_MODEL Header -->
        <div class="text-center space-y-0.5 border-b border-gray-300 pb-3">
          <p class="font-bold text-sm tracking-wider uppercase text-gray-900">
            {{ storeName || 'CLOTHING STORE' }}
          </p>
          <p class="text-[11px] text-gray-600">
            {{ summary?.branch_name || 'Flagship Store' }}
          </p>
          <p class="text-[10px] text-gray-500 pt-1">
            === END OF SHIFT Z-REPORT ===
          </p>
        </div>

        <!-- Shift Metadata -->
        <div class="space-y-1 text-[11px] border-b border-dashed border-gray-300 pb-2">
          <div class="flex justify-between">
            <span class="text-gray-500">Terminal:</span>
            <span class="font-bold">{{ summary?.terminal_code || 'POS-01' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Cashier:</span>
            <span>{{ summary?.cashier_name || 'Cashier' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Shift ID:</span>
            <span class="text-[10px]">{{ (summary?.shift_id || '').slice(0, 8) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Opened:</span>
            <span>{{ formatDateTime(summary?.opened_at) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Closed:</span>
            <span>{{ formatDateTime(summary?.closed_at) }}</span>
          </div>
        </div>

        <!-- Float Section -->
        <div class="space-y-1 border-b border-dashed border-gray-300 pb-2">
          <p class="font-bold text-[11px] uppercase text-gray-700">1. Drawer Opening Float</p>
          <div class="flex justify-between">
            <span>Float USD:</span>
            <span class="font-bold">${{ Number(summary?.opening_float_usd || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Float KHR:</span>
            <span>{{ Number(summary?.opening_float_khr || 0).toLocaleString() }} ៛</span>
          </div>
        </div>

        <!-- Sales Section -->
        <div class="space-y-1 border-b border-dashed border-gray-300 pb-2">
          <p class="font-bold text-[11px] uppercase text-gray-700">2. Sales Summary</p>
          <div class="flex justify-between">
            <span>Total Orders:</span>
            <span>{{ summary?.total_sales_count || 0 }}</span>
          </div>
          <div class="flex justify-between font-bold">
            <span>Gross Sales:</span>
            <span>${{ Number(summary?.total_sales_amount || 0).toFixed(2) }}</span>
          </div>
        </div>

        <!-- Tender Breakdown -->
        <div class="space-y-1 border-b border-dashed border-gray-300 pb-2">
          <p class="font-bold text-[11px] uppercase text-gray-700">3. Tender Breakdown</p>
          <div class="flex justify-between">
            <span>Cash Sales ({{ summary?.cash_payments_count || 0 }}):</span>
            <span>${{ Number(summary?.cash_sales_amount || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>ABA KHQR ({{ summary?.aba_payments_count || 0 }}):</span>
            <span>${{ Number(summary?.aba_sales_amount || 0).toFixed(2) }}</span>
          </div>
          <div v-if="Number(summary?.card_sales_amount || 0) > 0" class="flex justify-between">
            <span>Credit Card:</span>
            <span>${{ Number(summary?.card_sales_amount || 0).toFixed(2) }}</span>
          </div>
          <div v-if="Number(summary?.bank_sales_amount || 0) > 0" class="flex justify-between">
            <span>Bank Wire:</span>
            <span>${{ Number(summary?.bank_sales_amount || 0).toFixed(2) }}</span>
          </div>
        </div>

        <!-- Drawer Cash Reconciliation -->
        <div class="space-y-1 border-b border-gray-300 pb-3">
          <p class="font-bold text-[11px] uppercase text-gray-700">4. Drawer Cash Reconciliation</p>
          <div class="flex justify-between">
            <span>Expected Cash USD:</span>
            <span>${{ Number(summary?.expected_cash_usd || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between font-bold">
            <span>Counted Cash USD:</span>
            <span>${{ Number(summary?.closing_cash_usd || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between font-bold pt-1 border-t border-dotted border-gray-300">
            <span>USD Discrepancy:</span>
            <span>
              {{ Number(summary?.discrepancy_usd || 0) >= 0 ? '+' : '' }}${{ Number(summary?.discrepancy_usd || 0).toFixed(2) }}
              <template v-if="Number(summary?.discrepancy_usd || 0) === 0"> (BALANCED)</template>
              <template v-else-if="Number(summary?.discrepancy_usd || 0) > 0"> (OVER)</template>
              <template v-else> (SHORT)</template>
            </span>
          </div>
          <div v-if="Number(summary?.expected_cash_khr || 0) > 0 || Number(summary?.closing_cash_khr || 0) > 0" class="flex justify-between text-[10px] text-gray-500 pt-0.5">
            <span>Counted KHR:</span>
            <span>{{ Number(summary?.closing_cash_khr || 0).toLocaleString() }} ៛</span>
          </div>
        </div>

        <!-- Notes if any -->
        <div v-if="summary?.notes" class="text-[10px] text-gray-600 italic border-b border-gray-300 pb-2">
          Note: {{ summary.notes }}
        </div>

        <!-- Signature Lines -->
        <div class="pt-3 space-y-6 text-[10px] text-gray-500">
          <div>
            <div class="border-b border-gray-400 w-3/4 mb-1"></div>
            <p>Cashier Signature: {{ summary?.cashier_name }}</p>
          </div>
          <div>
            <div class="border-b border-gray-400 w-3/4 mb-1"></div>
            <p>Manager Signature: __________________</p>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="no-print px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
        <button
          type="button"
          class="h-9 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors"
          @click="$emit('close')"
        >
          Done
        </button>
        <button
          type="button"
          class="h-9 px-4 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          @click="handlePrint"
        >
          <UIcon name="i-heroicons-printer" class="w-4 h-4" />
          <span>Print Z-Report</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ShiftSummary } from '~/composables/useApi'

defineProps<{
  isOpen: boolean
  summary: ShiftSummary | null
  storeName?: string
}>()

defineEmits<{
  'close': []
}>()

function formatDateTime(val?: string | null): string {
  if (!val) return '-'
  try {
    const d = new Date(val)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return val
  }
}

function handlePrint() {
  window.print()
}
</script>

