<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3"
      @click.self="$emit('update:modelValue', false)"
    >
      <div class="bg-white rounded-xl border border-gray-200 w-full max-w-[480px] max-h-[calc(100dvh-24px)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
        <!-- 1. Modal Header -->
        <div class="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between gap-2 flex-shrink-0">
          <div class="flex flex-col leading-tight">
            <h3 class="text-sm font-bold text-gray-900">Complete Sale &amp; Payment</h3>
            <p class="text-[11px] text-gray-400">Select payment method, split tender, or cash tender</p>
          </div>
          <button
            type="button"
            class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close payment modal"
            @click="$emit('update:modelValue', false)"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="p-3.5 overflow-y-auto flex-1 min-h-0 flex flex-col gap-2.5">
          <!-- 2. Total Amount Due Banner (Compact Horizontal Layout) -->
          <div class="px-3.5 py-2.5 bg-gray-900 text-white rounded-lg flex items-center justify-between gap-3 flex-shrink-0">
            <div class="flex flex-col leading-tight">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Total Amount Due
              </span>
              <span class="text-xs text-gray-300 font-mono mt-0.5">
                &approx; {{ formatRiel(grandTotal) }}
              </span>
            </div>
            <div class="flex items-baseline gap-0.5">
              <span class="text-sm font-bold font-mono text-gray-400">$</span>
              <span class="text-2xl font-bold font-mono text-white tracking-tight">
                {{ grandTotal.toFixed(2) }}
              </span>
            </div>
          </div>

          <!-- 3. Mode Toggle (Standard vs Split Tender) -->
          <div class="grid grid-cols-2 p-0.5 bg-gray-100 border border-gray-200/70 rounded-lg text-xs font-semibold flex-shrink-0">
            <button
              type="button"
              class="h-7 text-center rounded-md transition-colors cursor-pointer border border-transparent"
              :class="!isSplitMode ? 'bg-white text-gray-900 border-gray-200/80' : 'text-gray-500 hover:text-gray-900'"
              @click="$emit('disableSplitMode')"
            >
              Standard Payment
            </button>
            <button
              type="button"
              class="h-7 text-center rounded-md transition-colors cursor-pointer border border-transparent"
              :class="isSplitMode ? 'bg-white text-gray-900 border-gray-200/80' : 'text-gray-500 hover:text-gray-900'"
              @click="$emit('enableSplitMode')"
            >
              Split Tender (Multi-Method)
            </button>
          </div>

          <!-- ── Standard Single Payment Mode ── -->
          <template v-if="!isSplitMode">
            <!-- Payment Method Selector (4 Options) -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-shrink-0">
              <button
                v-for="method in paymentMethods"
                :key="method.value"
                type="button"
                class="flex flex-col items-center justify-center gap-0.5 py-2 px-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer text-center min-h-[56px]"
                :class="selectedPaymentMethod === method.value
                  ? 'bg-gray-900 text-white border-transparent'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'"
                @click="handleMethodSelect(method.value)"
              >
                <div class="flex items-center justify-center h-4">
                  <UIcon v-if="method.value === 'CASH'" name="i-heroicons-banknotes" class="w-4 h-4" />
                  <img
                    v-else-if="method.value === 'ABA_KHQR'"
                    src="/images/payments/aba-khqr.svg"
                    alt="ABA KHQR"
                    class="w-4 h-4 object-contain"
                  />
                  <div v-else-if="method.value === 'CARD'" class="flex items-center gap-0.5">
                    <img src="/images/payments/visa.svg" alt="Visa" class="w-3.5 h-3.5 object-contain" />
                    <img src="/images/payments/mastercard.svg" alt="Mastercard" class="w-3.5 h-3.5 object-contain" />
                  </div>
                  <UIcon v-else-if="method.value === 'BANK_TRANSFER'" name="i-heroicons-building-library" class="w-4 h-4" />
                  <UIcon v-else name="i-heroicons-currency-dollar" class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-bold leading-tight">{{ method.label }}</span>
                <span
                  v-if="method.subtitle"
                  class="text-[9px] font-normal leading-tight truncate max-w-full"
                  :class="selectedPaymentMethod === method.value ? 'text-gray-300' : 'text-gray-400'"
                >
                  {{ method.subtitle }}
                </span>
              </button>
            </div>

            <!-- 4A. Detail Section: Cash Tender -->
            <div v-if="selectedPaymentMethod === 'CASH'" class="flex flex-col gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
              <!-- Quick-Tender Denominations (USD & KHR) -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center gap-1 flex-wrap">
                  <span class="text-[10px] font-bold uppercase text-gray-400 w-7 flex-shrink-0">USD</span>
                  <button
                    type="button"
                    class="h-7 px-2 rounded-md text-xs font-mono font-semibold bg-white border border-gray-200 text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                    @click="$emit('update:tenderAmount', Number(grandTotal.toFixed(2)))"
                  >
                    Exact (${{ grandTotal.toFixed(2) }})
                  </button>
                  <button
                    v-for="amt in fastCashPresets"
                    :key="amt"
                    type="button"
                    class="h-7 px-2 rounded-md text-xs font-mono font-semibold bg-white border border-gray-200 text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                    @click="$emit('update:tenderAmount', amt)"
                  >
                    ${{ amt }}
                  </button>
                </div>

                <div class="flex items-center gap-1 flex-wrap">
                  <span class="text-[10px] font-bold uppercase text-gray-400 w-7 flex-shrink-0">KHR</span>
                  <button
                    v-for="riel in [20000, 50000, 100000, 200000]"
                    :key="riel"
                    type="button"
                    class="h-7 px-2 rounded-md text-[11px] font-mono font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    :title="`៛${riel.toLocaleString()} ($${(riel / 4100).toFixed(2)})`"
                    @click="$emit('update:tenderAmount', Number((riel / 4100).toFixed(2)))"
                  >
                    ៛{{ (riel / 1000).toLocaleString() }}k (${{ (riel / 4100).toFixed(2) }})
                  </button>
                </div>
              </div>

              <!-- Amount Tendered Input & Change Summary -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-gray-200/70">
                <div class="flex flex-col gap-1">
                  <label class="text-[11px] font-semibold text-gray-700">Amount Tendered ($)</label>
                  <div class="relative flex items-center">
                    <span class="absolute left-2.5 text-xs font-mono font-bold text-gray-400 pointer-events-none">$</span>
                    <input
                      :value="formattedTenderValue"
                      type="number"
                      step="0.01"
                      min="0"
                      aria-label="Amount Tendered in USD"
                      class="w-full h-9 bg-white border border-gray-200 rounded-md pl-6 pr-2.5 text-sm font-mono font-bold text-gray-900 outline-none focus:border-gray-400"
                      @input="onTenderInput"
                    />
                  </div>
                </div>

                <div class="flex flex-col gap-1">
                  <div class="flex items-center justify-between">
                    <span class="text-[11px] font-semibold text-gray-700">
                      {{ cashTenderState === 'insufficient' ? 'Balance Due' : cashTenderState === 'exact' ? 'Change Due (Exact)' : 'Change Due' }}
                    </span>
                    <span
                      class="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded"
                      :class="cashTenderState === 'insufficient'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'"
                    >
                      {{ cashTenderState === 'insufficient' ? 'Short' : cashTenderState === 'exact' ? 'Exact' : 'Change' }}
                    </span>
                  </div>
                  <div
                    class="h-9 px-2.5 rounded-md border border-gray-200 flex items-baseline justify-between flex-wrap"
                    :class="cashTenderState === 'insufficient'
                      ? 'bg-amber-50/80 text-amber-900'
                      : 'bg-emerald-50/80 text-emerald-900'"
                  >
                    <span v-if="cashTenderState === 'insufficient'" class="text-sm font-bold font-mono text-amber-900">
                      -${{ cashShortfall.toFixed(2) }}
                    </span>
                    <template v-else>
                      <span class="text-base font-bold font-mono text-emerald-900">${{ changeDue.toFixed(2) }}</span>
                      <span class="text-[10px] font-mono text-emerald-800">({{ formatRiel(changeDue) }})</span>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4B. Detail Section: ABA KHQR -->
            <PosAbaKhqrPanel
              v-else-if="selectedPaymentMethod === 'ABA_KHQR' && (abaQrImage || abaLoading)"
              :loading="abaLoading"
              :error="abaError"
              :status="abaStatus || 'PENDING'"
              :qr-image="abaQrImage"
              :qr-string="abaQrString"
              :amount="grandTotal"
              :apv="abaApv"
              :seconds-left="abaSecondsLeft || 0"
              :cancelling="abaCancelling || false"
              @retry="$emit('abaRetry')"
              @cancel="$emit('abaCancel')"
              @generate="$emit('selectAbaKhqr')"
            />
            <div
              v-else-if="selectedPaymentMethod === 'ABA_KHQR'"
              class="flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center p-1.5 flex-shrink-0">
                  <img src="/images/payments/aba-khqr.svg" alt="ABA KHQR" class="w-full h-full object-contain" />
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="text-xs font-bold text-gray-900">Full-Screen ABA KHQR Kiosk</span>
                  <span class="text-[11px] text-gray-500 leading-snug">
                    Displays scannable dynamic KHQR with live verification &amp; auto-receipt.
                  </span>
                </div>
              </div>
              <button
                type="button"
                class="h-8 px-3 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                @click="$emit('selectAbaKhqr')"
              >
                <UIcon name="i-heroicons-arrows-pointing-out" class="w-3.5 h-3.5" />
                <span>Open QR</span>
              </button>
            </div>

            <!-- 4C. Detail Section: Card Payment (ABA PayWay Modal & EDC) -->
            <div
              v-else-if="selectedPaymentMethod === 'CARD'"
              class="flex flex-col gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-900 flex-shrink-0">
                    <UIcon name="i-heroicons-credit-card" class="w-4 h-4" />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-xs font-bold text-gray-900">Credit / Debit Card Checkout</span>
                    <div class="flex items-center gap-1 mt-0.5">
                      <img src="/images/payments/visa.svg" alt="Visa" class="h-3 w-3.5 object-contain" />
                      <img src="/images/payments/mastercard.svg" alt="Mastercard" class="h-3 w-3.5 object-contain" />
                      <img src="/images/payments/unionpay.svg" alt="UnionPay" class="h-3 w-3.5 object-contain" />
                      <img src="/images/payments/jcb.svg" alt="JCB" class="h-3 w-3.5 object-contain" />
                      <span class="text-[10px] text-gray-500 ml-0.5">via ABA PayWay</span>
                    </div>
                  </div>
                </div>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-gray-200 text-gray-600">3D Secure</span>
              </div>

              <!-- Status Banner when ABA modal is active -->
              <div
                v-if="isAbaModalActive && abaStatus === 'PENDING'"
                class="p-2.5 bg-white border border-gray-200 rounded-lg flex items-center justify-between"
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-gray-700 animate-spin" />
                  <div class="flex flex-col">
                    <span class="text-xs font-bold text-gray-900">Awaiting Card Authorization</span>
                    <span class="text-[10px] text-gray-500">Complete card entry in ABA modal</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="h-7 px-2.5 rounded-md text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 cursor-pointer"
                  @click="$emit('abaCancel')"
                >
                  Cancel
                </button>
              </div>

              <!-- Optional manual terminal reference fallback -->
              <div class="flex flex-col gap-1">
                <label class="text-[11px] font-semibold text-gray-600">Offline EDC Terminal Auth Code (optional):</label>
                <input
                  :value="paymentReferenceNumber"
                  class="h-8 bg-white border border-gray-200 rounded-md px-2.5 text-xs outline-none focus:border-gray-400"
                  placeholder="Enter slip auth code, or leave blank for ABA Card Modal"
                  @input="$emit('update:paymentReferenceNumber', ($event.target as HTMLInputElement).value)"
                />
              </div>
            </div>

            <!-- 4D. Detail Section: Bank Transfer -->
            <div
              v-else-if="selectedPaymentMethod === 'BANK_TRANSFER'"
              class="flex flex-col gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-900 flex-shrink-0">
                  <UIcon name="i-heroicons-building-library" class="w-4 h-4" />
                </div>
                <div class="flex flex-col">
                  <span class="text-xs font-bold text-gray-900">Direct Bank Transfer</span>
                  <span class="text-[11px] text-gray-500">Record wire or mobile transfer reference number</span>
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-[11px] font-semibold text-gray-700">Bank Transfer / Reference No.</label>
                <input
                  :value="paymentReferenceNumber"
                  class="h-8 bg-white border border-gray-200 rounded-md px-2.5 text-xs outline-none focus:border-gray-400"
                  placeholder="Enter bank transaction ID or account reference"
                  @input="$emit('update:paymentReferenceNumber', ($event.target as HTMLInputElement).value)"
                />
              </div>
            </div>
          </template>

          <!-- ── 4E. Split Tender Builder Mode ── -->
          <template v-else>
            <div class="flex flex-col gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
              <div class="flex flex-col gap-1.5">
                <div
                  v-for="(split, sIdx) in splitPayments"
                  :key="sIdx"
                  class="flex items-center gap-1.5"
                >
                  <select
                    v-model="split.payment_method"
                    aria-label="Split payment method"
                    class="h-8 bg-white border border-gray-200 rounded-md px-2 text-xs font-medium text-gray-800 outline-none focus:border-gray-400"
                  >
                    <option value="CASH">Cash</option>
                    <option value="KHQR">ABA KHQR</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>

                  <div class="relative w-28 flex-shrink-0 flex items-center">
                    <span class="absolute left-2 text-xs text-gray-400 font-mono pointer-events-none">$</span>
                    <input
                      v-model.number="split.amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      aria-label="Split payment amount"
                      class="w-full h-8 bg-white border border-gray-200 rounded-md pl-5 pr-2 text-xs font-mono font-semibold outline-none focus:border-gray-400"
                    />
                  </div>

                  <input
                    v-model="split.reference_number"
                    placeholder="Ref / Auth (opt)"
                    aria-label="Split payment reference"
                    class="h-8 bg-white border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-gray-400 flex-1 min-w-0"
                  />

                  <button
                    type="button"
                    class="w-7 h-8 flex items-center justify-center text-gray-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer flex-shrink-0"
                    title="Remove split entry"
                    aria-label="Remove split entry"
                    :disabled="splitPayments.length <= 1"
                    @click="$emit('removeSplitRow', sIdx)"
                  >
                    <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div class="flex items-center justify-between pt-1.5 border-t border-gray-200 text-xs">
                <button
                  type="button"
                  class="h-7 px-2 rounded-md bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-1 cursor-pointer"
                  @click="$emit('addSplitRow')"
                >
                  <UIcon name="i-heroicons-plus" class="w-3 h-3" />
                  <span>Add Method</span>
                </button>

                <div class="flex items-center gap-2.5 font-mono text-xs">
                  <span class="text-gray-500">Paid: <strong class="text-gray-800">${{ totalSplitAmount.toFixed(2) }}</strong></span>
                  <span
                    class="px-1.5 py-0.5 rounded font-bold"
                    :class="remainingSplitBalance === 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-800'"
                  >
                    {{ remainingSplitBalance === 0 ? 'Balanced ($0.00)' : `Due: $${remainingSplitBalance.toFixed(2)}` }}
                  </span>
                </div>
              </div>
            </div>
          </template>

          <!-- 5. Optional Order Memo -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <label class="text-[11px] font-semibold text-gray-600 whitespace-nowrap">Memo:</label>
            <input
              :value="orderNotes"
              aria-label="Order Memo or Notes"
              class="h-8 flex-1 bg-white border border-gray-200 rounded-md px-2.5 text-xs outline-none focus:border-gray-400"
              placeholder="Optional order note or gift receipt instruction..."
              @input="$emit('update:orderNotes', ($event.target as HTMLInputElement).value)"
            />
          </div>

          <!-- Compact Trust Strip -->
          <div class="pt-1.5 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
            <PosWeAcceptPaymentStrip :show-label="true" size="sm" :show-e-wallets="false" />
            <span class="text-[10px] text-gray-400 font-medium">Secured by ABA PayWay</span>
          </div>
        </div>

        <!-- 6. Modal Footer -->
        <div class="px-4 py-2.5 border-t border-gray-200 flex items-center gap-2 bg-gray-50 flex-shrink-0">
          <button
            type="button"
            class="h-9 px-3.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-colors cursor-pointer"
            @click="$emit('update:modelValue', false)"
          >
            Cancel
          </button>
          <button
            v-if="!isSplitMode && selectedPaymentMethod === 'ABA_KHQR'"
            type="button"
            class="h-9 flex-1 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 disabled:opacity-40 transition-colors cursor-pointer border border-transparent flex items-center justify-center gap-1.5"
            :disabled="processingSale || isCheckoutDisabled"
            @click="$emit('selectAbaKhqr')"
          >
            <UIcon name="i-heroicons-arrows-pointing-out" class="w-4 h-4" />
            <span>Launch Full-Screen QR Kiosk (${{ grandTotal.toFixed(2) }})</span>
          </button>
          <button
            v-else-if="!isSplitMode && selectedPaymentMethod === 'CARD' && !paymentReferenceNumber"
            type="button"
            class="h-9 flex-1 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 disabled:opacity-40 transition-colors cursor-pointer border border-transparent flex items-center justify-center gap-1.5"
            :disabled="processingSale || isCheckoutDisabled || isAbaModalActive"
            @click="$emit('selectAbaCard')"
          >
            <UIcon name="i-heroicons-credit-card" class="w-4 h-4" />
            <span>{{ isAbaModalActive ? 'Awaiting Card Modal…' : `Pay with Card (ABA Modal) ($${grandTotal.toFixed(2)})` }}</span>
          </button>
          <button
            v-else
            type="button"
            class="h-9 flex-1 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 disabled:opacity-40 transition-colors cursor-pointer border border-transparent flex items-center justify-center gap-1.5"
            :disabled="processingSale || isCheckoutDisabled"
            @click="$emit('finalizeSale')"
          >
            <template v-if="processingSale">
              Authorizing...
            </template>
            <template v-else>
              Confirm &amp; Charge ${{ grandTotal.toFixed(2) }}
            </template>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  grandTotal: number
  formatRiel: (amount: number) => string
  isSplitMode: boolean
  paymentMethods: Array<{ value: string; label: string; subtitle?: string; icon?: string }>
  selectedPaymentMethod: string
  tenderAmount: number
  changeDue: number
  fastCashPresets: number[]
  paymentReferenceNumber: string
  splitPayments: Array<{ payment_method: string; amount: number; reference_number?: string }>
  totalSplitAmount: number
  remainingSplitBalance: number
  orderNotes: string
  processingSale: boolean
  isCheckoutDisabled: boolean
  // ABA KHQR props
  abaLoading: boolean
  abaError: string | null
  abaStatus: string
  abaQrImage: string | null
  abaQrString: string | null
  abaApv: string | null
  abaSecondsLeft: number
  abaCancelling: boolean
  isAbaModalActive?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'update:selectedPaymentMethod': [val: string]
  'update:tenderAmount': [val: number]
  'update:paymentReferenceNumber': [val: string]
  'update:orderNotes': [val: string]
  'enableSplitMode': []
  'disableSplitMode': []
  'addSplitRow': []
  'removeSplitRow': [index: number]
  'finalizeSale': []
  'abaRetry': []
  'abaCancel': []
  'selectAbaKhqr': []
  'selectAbaCard': []
}>()

/**
 * Prevent long IEEE-754 floating-point numbers (e.g. 216.27900000000002)
 * from appearing in the cash tender input while preserving smooth typing.
 */
const formattedTenderValue = computed(() => {
  const val = Number(props.tenderAmount)
  if (!Number.isFinite(val)) return 0
  return Number(val.toFixed(2))
})

const cashTenderState = computed<'insufficient' | 'exact' | 'overpaid'>(() => {
  const tendered = Number((Number(props.tenderAmount) || 0).toFixed(2))
  const due = Number((Number(props.grandTotal) || 0).toFixed(2))
  if (tendered < due) return 'insufficient'
  if (Math.abs(tendered - due) < 0.005) return 'exact'
  return 'overpaid'
})

const cashShortfall = computed(() => {
  const tendered = Number((Number(props.tenderAmount) || 0).toFixed(2))
  const due = Number((Number(props.grandTotal) || 0).toFixed(2))
  return Math.max(0, Number((due - tendered).toFixed(2)))
})

function onTenderInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const parsed = parseFloat(raw)
  emit('update:tenderAmount', Number.isFinite(parsed) ? parsed : 0)
}

function handleMethodSelect(methodVal: string) {
  emit('update:selectedPaymentMethod', methodVal)
}
</script>
