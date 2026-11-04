<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-3 sm:p-4"
      @click.self="$emit('update:modelValue', false)"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shift-orders-title"
        class="pos-focus bg-white rounded-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl font-sans"
      >
        <!-- Modal Header -->
        <div class="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between flex-shrink-0 bg-gray-50/70">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 border border-gray-200">
              <UIcon name="i-heroicons-receipt-percent" class="w-4 h-4" />
            </div>
            <div>
              <h3 id="shift-orders-title" class="text-base font-semibold text-gray-900 leading-tight">
                Shift Sales &amp; Order History
              </h3>
              <p class="text-xs text-gray-500">
                Recent invoices completed on {{ activeTerminalCode || 'this station' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              :disabled="loading"
              @click="loadOrders"
            >
              <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close"
              @click="$emit('update:modelValue', false)"
            >
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Search Omnibar & Filter -->
        <div class="p-3.5 border-b border-gray-200 bg-white flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
          <div class="relative flex-1">
            <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by invoice # (e.g. INV-001) or customer name..."
              class="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
            <span class="font-medium">Total:</span>
            <span class="font-bold text-gray-900">{{ filteredOrders.length }} orders</span>
          </div>
        </div>

        <!-- Orders List Container -->
        <div class="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-2.5 pos-scroll bg-gray-50/50">
          <!-- Loading State -->
          <div v-if="loading && orders.length === 0" class="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-gray-500" />
            <p class="text-xs font-medium">Loading completed sales...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredOrders.length === 0" class="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
            <div class="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
              <UIcon name="i-heroicons-receipt-refund" class="w-6 h-6" />
            </div>
            <p class="text-sm font-semibold text-gray-700">No sales transactions found</p>
            <p class="text-xs text-gray-500 text-center max-w-xs">
              {{ searchQuery ? 'Try adjusting your search criteria.' : 'Completed sales on this terminal will appear here.' }}
            </p>
          </div>

          <!-- Order Items Cards -->
          <div
            v-for="order in filteredOrders"
            :key="order.id"
            class="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:border-gray-300 transition-all shadow-xs"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <!-- Left: Invoice info -->
              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 flex-shrink-0 font-mono text-xs font-bold">
                  <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-gray-900 text-sm">
                      {{ order.invoice_number }}
                    </span>
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                      :class="order.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-amber-50 text-amber-700 border border-amber-200/60'"
                    >
                      {{ order.payment_status || 'PAID' }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                    <span>{{ formatTime(order.created_at) }}</span>
                    <span>&bull;</span>
                    <span class="text-gray-700 font-medium">
                      {{ order.customer?.name || order.customer_name || 'Walk-in Customer' }}
                    </span>
                  </p>
                </div>
              </div>

              <!-- Right: Total and Actions -->
              <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                <div class="text-left sm:text-right">
                  <div class="text-base font-bold font-mono text-gray-900">
                    ${{ Number(order.total || 0).toFixed(2) }}
                  </div>
                  <div class="text-xs text-gray-500 font-mono">
                    {{ formatRiel(Number(order.total || 0)) }}
                  </div>
                </div>

                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    class="h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="View Receipt"
                    @click="$emit('viewReceipt', order)"
                  >
                    <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    class="h-8 px-2.5 rounded-lg border border-gray-200 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Reprint 80mm Thermal Receipt"
                    @click="$emit('reprintReceipt', order)"
                  >
                    <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5" />
                    <span>Reprint</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Optional Items Preview Pill -->
            <div
              v-if="order.items && order.items.length > 0"
              class="mt-2.5 pt-2 border-t border-gray-100 text-xs text-gray-500 flex flex-wrap gap-2 items-center"
            >
              <span class="font-medium text-gray-400">Items:</span>
              <span
                v-for="(item, idx) in order.items.slice(0, 3)"
                :key="idx"
                class="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium text-[11px]"
              >
                {{ item.quantity }}x {{ item.variant?.product?.name || item.name || 'Item' }}
                <span v-if="item.variant?.size" class="text-gray-500">({{ item.variant.size.name || item.variant.size.code }})</span>
              </span>
              <span v-if="order.items.length > 3" class="text-gray-400 font-medium">
                +{{ order.items.length - 3 }} more
              </span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500 flex-shrink-0">
          <span>Showing the most recent completed sales</span>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
            @click="$emit('update:modelValue', false)"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSaleApi } from '~/composables/useApi'

const props = defineProps<{
  modelValue: boolean
  activeTerminalCode?: string
  formatRiel: (amount: number) => string
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'viewReceipt': [order: any]
  'reprintReceipt': [order: any]
}>()

const { listSales } = useSaleApi()
const loading = ref(false)
const searchQuery = ref('')
const orders = ref<any[]>([])

const filteredOrders = computed(() => {
  if (!searchQuery.value.trim()) return orders.value
  const q = searchQuery.value.trim().toLowerCase()
  return orders.value.filter((o) => {
    const inv = (o.invoice_number || '').toLowerCase()
    const cust = (o.customer?.name || o.customer_name || '').toLowerCase()
    return inv.includes(q) || cust.includes(q)
  })
})

function formatTime(isoStr?: string | null): string {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  } catch {
    return isoStr
  }
}

async function loadOrders() {
  loading.value = true
  try {
    const res: any = await listSales({ limit: 40 })
    orders.value = Array.isArray(res) ? res : (res?.items || [])
  } catch (err) {
    console.warn('Failed to load shift sales:', err)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      loadOrders()
    }
  },
  { immediate: true }
)
</script>

