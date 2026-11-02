<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-3"
      @click.self="$emit('update:modelValue', false)"
    >
      <div
        ref="dialogEl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-payment-title"
        class="pos-focus bg-white rounded-xl border border-gray-200 w-full max-w-[580px] max-h-[calc(100dvh-24px)] flex flex-col overflow-hidden font-sans"
      >
        <!-- 1. Header -->
        <div class="px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-3 flex-shrink-0">
          <div class="flex flex-col leading-tight min-w-0">
            <h3 id="pos-payment-title" class="text-base font-semibold text-gray-900">Payment</h3>
            <p class="text-sm text-gray-600 truncate">
              {{ itemCount ?? 0 }} item{{ itemCount === 1 ? '' : 's' }} &bull; {{ customerName || 'Walk-in customer' }}
            </p>
          </div>
          <button
            type="button"
            class="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close payment (Esc)"
            title="Close (Esc)"
            @click="$emit('update:modelValue', false)"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <!-- Scrollable body -->
        <div class="px-5 py-4 overflow-y-auto pos-scroll flex-1 min-h-0 flex flex-col gap-3.5">
          <!-- 2. Amount due -->
          <div class="px-4 py-3 bg-gray-900 text-white rounded-lg flex items-center justify-between gap-3 flex-shrink-0">
            <div class="flex flex-col leading-tight">
              <span class="text-sm font-semibold text-gray-200">Amount due</span>
              <span class="text-sm text-gray-300 font-mono tabular-nums">&asymp; {{ formatRiel(grandTotal) }}</span>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-xl font-bold font-mono text-gray-300">$</span>
              <span class="text-[40px] leading-none font-bold font-mono tabular-nums text-white tracking-tight">
                {{ grandTotal.toFixed(2) }}
              </span>
            </div>
          </div>

          <!-- 3. Standard vs split -->
          <div class="grid grid-cols-2 p-1 bg-gray-100 rounded-lg text-sm font-semibold flex-shrink-0" role="tablist" aria-label="Payment mode">
            <button
              type="button"
              role="tab"
              :aria-selected="!isSplitMode"
              class="h-9 text-center rounded-md transition-colors cursor-pointer"
              :class="!isSplitMode ? 'bg-white text-gray-900' : 'text-gray-700 hover:text-gray-900'"
              @click="$emit('disableSplitMode')"
            >
              Single payment
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="isSplitMode"
              class="h-9 text-center rounded-md transition-colors cursor-pointer"
              :class="isSplitMode ? 'bg-white text-gray-900' : 'text-gray-700 hover:text-gray-900'"
              @click="$emit('enableSplitMode')"
            >
              Split payment
            </button>
          </div>

          <!-- ── Single payment ── -->
          <template v-if="!isSplitMode">
            <!-- Method selector -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-shrink-0" role="radiogroup" aria-label="Payment method">
              <button
                v-for="method in paymentMethods"
                :key="method.value"
                type="button"
                role="radio"
                :aria-checked="selectedPaymentMethod === method.value"
                class="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg border text-center min-h-[72px] transition-colors cursor-pointer"
                :class="selectedPaymentMethod === method.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'"
                @click="handleMethodSelect(method.value)"
              >
                <span class="flex items-center justify-center h-5">
                  <UIcon v-if="method.value === 'CASH'" name="i-heroicons-banknotes" class="w-5 h-5" />
                  <img
                    v-else-if="method.value === 'ABA_KHQR'"
                    src="/images/payments/aba-khqr.svg"
                    alt=""
                    class="w-5 h-5 object-contain"
                  >
                  <span v-else-if="method.value === 'CARD'" class="flex items-center gap-0.5">
                    <img src="/images/payments/visa.svg" alt="" class="w-4 h-4 object-contain">
                    <img src="/images/payments/mastercard.svg" alt="" class="w-4 h-4 object-contain">
                  </span>
                  <UIcon v-else-if="method.value === 'BANK_TRANSFER'" name="i-heroicons-building-library" class="w-5 h-5" />
                  <UIcon v-else name="i-heroicons-currency-dollar" class="w-5 h-5" />
                </span>
                <span class="text-sm font-semibold leading-tight">{{ method.label }}</span>
                <span
                  v-if="method.subtitle"
                  class="text-xs leading-tight"
                  :class="selectedPaymentMethod === method.value ? 'text-gray-300' : 'text-gray-600'"
                >
                  {{ method.subtitle }}
                </span>
              </button>
            </div>

            <!-- 4A. Cash -->
            <div v-if="selectedPaymentMethod === 'CASH'" class="flex flex-col gap-3 p-3.5 bg-gray-50 border border-gray-200 rounded-lg">
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-xs font-bold uppercase text-gray-600 w-9 flex-shrink-0">USD</span>
                  <button
                    type="button"
                    class="h-9 px-3 rounded-md text-sm font-mono font-semibold tabular-nums bg-white border border-gray-300 text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                    @click="$emit('update:tenderAmount', Number(grandTotal.toFixed(2)))"
                  >
                    Exact ${{ grandTotal.toFixed(2) }}
                  </button>
                  <button
                    v-for="amt in fastCashPresets"
                    :key="amt"
                    type="button"
                    class="h-9 px-3 rounded-md text-sm font-mono font-semibold tabular-nums bg-white border border-gray-300 text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                    @click="$emit('update:tenderAmount', amt)"
                  >
                    ${{ amt }}
                  </button>
                </div>

                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-xs font-bold uppercase text-gray-600 w-9 flex-shrink-0">KHR</span>
                  <button
                    v-for="riel in [20000, 50000, 100000, 200000]"
                    :key="riel"
                    type="button"
                    class="h-9 px-3 rounded-md text-sm font-mono font-medium tabular-nums bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                    :title="`៛${riel.toLocaleString()} ($${(riel / 4100).toFixed(2)})`"
                    @click="$emit('update:tenderAmount', Number((riel / 4100).toFixed(2)))"
                  >
                    ៛{{ (riel / 1000).toLocaleString() }}k
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                <div class="flex flex-col gap-1.5">
                  <label for="pos-tender-input" class="text-sm font-semibold text-gray-900">Cash received ($)</label>
                  <div class="relative flex items-center">
                    <span class="absolute left-3 text-lg font-mono font-bold text-gray-600 pointer-events-none">$</span>
                    <input
                      id="pos-tender-input"
                      ref="tenderEl"
                      :value="formattedTenderValue"
                      type="number"
                      step="0.01"
                      min="0"
                      inputmode="decimal"
                      class="w-full h-12 bg-white border border-gray-300 rounded-md pl-8 pr-3 text-xl font-mono tabular-nums font-bold text-gray-900 focus:border-gray-500"
                      @input="onTenderInput"
                      @focus="(e: FocusEvent) => (e.target as HTMLInputElement).select()"
                      @keydown.enter.prevent="onTenderEnter"
                    >
                  </div>
                </div>

                <div class="flex flex-col gap-1.5" aria-live="polite">
                  <span class="text-sm font-semibold text-gray-900">
                    {{ cashTenderState === 'insufficient' ? 'Still to pay' : 'Change to give' }}
                  </span>
                  <div
                    class="h-12 px-3 rounded-md border border-gray-200 flex items-center justify-between gap-2"
                    :class="cashTenderState === 'insufficient'
                      ? 'bg-amber-50 text-amber-900'
                      : 'bg-emerald-50 text-emerald-900'"
                  >
                    <span class="text-xl font-bold font-mono tabular-nums">
                      <template v-if="cashTenderState === 'insufficient'">${{ cashShortfall.toFixed(2) }}</template>
                      <template v-else>${{ changeDue.toFixed(2) }}</template>
                    </span>
                    <span class="text-xs font-mono tabular-nums text-right">
                      <template v-if="cashTenderState === 'insufficient'">short</template>
                      <template v-else>{{ formatRiel(changeDue) }}</template>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4B. ABA KHQR -->
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
              class="flex items-center justify-between gap-3 p-3.5 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center p-1.5 flex-shrink-0">
                  <img src="/images/payments/aba-khqr.svg" alt="" class="w-full h-full object-contain">
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="text-sm font-semibold text-gray-900">ABA KHQR</span>
                  <span class="text-sm text-gray-600 leading-snug">
                    Shows a full-screen QR for the customer. Payment is verified automatically and the receipt opens when paid.
                  </span>
                </div>
              </div>
            </div>

            <!-- 4C. Card -->
            <div
              v-else-if="selectedPaymentMethod === 'CARD'"
              class="flex flex-col gap-3 p-3.5 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-900 flex-shrink-0">
                    <UIcon name="i-heroicons-credit-card" class="w-5 h-5" />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-sm font-semibold text-gray-900">Credit / debit card</span>
                    <span class="flex items-center gap-1.5 mt-0.5">
                      <img src="/images/payments/visa.svg" alt="Visa" class="h-4 w-5 object-contain">
                      <img src="/images/payments/mastercard.svg" alt="Mastercard" class="h-4 w-5 object-contain">
                      <img src="/images/payments/unionpay.svg" alt="UnionPay" class="h-4 w-5 object-contain">
                      <img src="/images/payments/jcb.svg" alt="JCB" class="h-4 w-5 object-contain">
                      <span class="text-xs text-gray-600 ml-0.5">via ABA PayWay</span>
                    </span>
                  </div>
                </div>
                <span class="px-2 h-6 leading-6 rounded text-xs font-semibold bg-white border border-gray-200 text-gray-700">3D Secure</span>
              </div>

              <!-- Awaiting card modal -->
              <div
                v-if="isAbaModalActive && abaStatus === 'PENDING'"
                class="p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between gap-2"
                role="status"
              >
                <div class="flex items-center gap-2.5">
                  <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-gray-700 animate-spin" />
                  <div class="flex flex-col">
                    <span class="text-sm font-semibold text-gray-900">Waiting for card authorisation</span>
                    <span class="text-xs text-gray-600">Finish card entry in the ABA window</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="h-9 px-3 rounded-md text-sm font-semibold text-gray-800 hover:bg-gray-100 border border-gray-300 cursor-pointer"
                  @click="$emit('abaCancel')"
                >
                  Cancel
                </button>
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="pos-card-ref" class="text-sm font-semibold text-gray-900">Terminal slip code <span class="font-normal text-gray-600">(optional)</span></label>
                <input
                  id="pos-card-ref"
                  :value="paymentReferenceNumber"
                  class="h-10 bg-white border border-gray-300 rounded-md px-3 text-sm focus:border-gray-500 placeholder-gray-500"
                  placeholder="Leave blank to pay in the ABA card window"
                  @input="$emit('update:paymentReferenceNumber', ($event.target as HTMLInputElement).value)"
                >
                <span class="text-xs text-gray-600">Enter a code only if the card was already charged on a separate EDC terminal.</span>
              </div>
            </div>

            <!-- 4D. Bank transfer -->
            <div
              v-else-if="selectedPaymentMethod === 'BANK_TRANSFER'"
              class="flex flex-col gap-3 p-3.5 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-900 flex-shrink-0">
                  <UIcon name="i-heroicons-building-library" class="w-5 h-5" />
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-semibold text-gray-900">Bank transfer</span>
                  <span class="text-sm text-gray-600">Record the transfer reference from the customer</span>
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="pos-bank-ref" class="text-sm font-semibold text-gray-900">Reference number</label>
                <input
                  id="pos-bank-ref"
                  :value="paymentReferenceNumber"
                  class="h-10 bg-white border border-gray-300 rounded-md px-3 text-sm focus:border-gray-500 placeholder-gray-500"
                  placeholder="Bank transaction ID or reference"
                  @input="$emit('update:paymentReferenceNumber', ($event.target as HTMLInputElement).value)"
                  @keydown.enter.prevent="onTenderEnter"
                >
              </div>
            </div>
          </template>

          <!-- ── Split payment ── -->
          <template v-else>
            <div class="flex flex-col gap-2.5 p-3.5 bg-gray-50 border border-gray-200 rounded-lg">
              <div class="flex flex-col gap-2">
                <div
                  v-for="(split, sIdx) in splitPayments"
                  :key="sIdx"
                  class="flex items-center gap-2"
                >
                  <select
                    v-model="split.payment_method"
                    :aria-label="`Method for payment ${sIdx + 1}`"
                    class="h-10 bg-white border border-gray-300 rounded-md px-2 text-sm font-medium text-gray-900"
                  >
                    <option value="CASH">Cash</option>
                    <option value="KHQR">ABA KHQR</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                  </select>

                  <div class="relative w-28 flex-shrink-0 flex items-center">
                    <span class="absolute left-2.5 text-sm text-gray-600 font-mono pointer-events-none">$</span>
                    <input
                      v-model.number="split.amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      inputmode="decimal"
                      :aria-label="`Amount for payment ${sIdx + 1}`"
                      class="w-full h-10 bg-white border border-gray-300 rounded-md pl-6 pr-2 text-sm font-mono tabular-nums font-semibold"
                    >
                  </div>

                  <input
                    v-model="split.reference_number"
                    placeholder="Ref (optional)"
                    :aria-label="`Reference for payment ${sIdx + 1}`"
                    class="h-10 bg-white border border-gray-300 rounded-md px-2.5 text-sm flex-1 min-w-0 placeholder-gray-500"
                  >

                  <button
                    type="button"
                    class="w-9 h-10 flex items-center justify-center text-gray-600 hover:text-red-700 disabled:opacity-40 disabled:hover:text-gray-600 cursor-pointer flex-shrink-0"
                    title="Remove this payment line"
                    aria-label="Remove this payment line"
                    :disabled="splitPayments.length <= 1"
                    @click="$emit('removeSplitRow', sIdx)"
                  >
                    <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div class="flex items-center justify-between gap-2 pt-2.5 border-t border-gray-200">
                <button
                  type="button"
                  class="h-9 px-3 rounded-md bg-white border border-gray-300 text-sm font-semibold text-gray-800 hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer"
                  @click="$emit('addSplitRow')"
                >
                  <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                  <span>Add method</span>
                </button>

                <div class="flex items-center gap-3 font-mono tabular-nums text-sm" aria-live="polite">
                  <span class="text-gray-700">Entered <strong class="text-gray-900">${{ totalSplitAmount.toFixed(2) }}</strong></span>
                  <span
                    class="px-2 h-7 leading-7 rounded font-bold"
                    :class="remainingSplitBalance === 0 ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'"
                  >
                    {{ remainingSplitBalance === 0 ? 'Fully covered' : `Short $${remainingSplitBalance.toFixed(2)}` }}
                  </span>
                </div>
              </div>
            </div>
          </template>

          <!-- 5. Order memo -->
          <div class="flex items-center gap-2.5 flex-shrink-0">
            <label for="pos-order-memo" class="text-sm font-semibold text-gray-800 whitespace-nowrap">Note</label>
            <input
              id="pos-order-memo"
              :value="orderNotes"
              class="h-10 flex-1 bg-white border border-gray-300 rounded-md px-3 text-sm placeholder-gray-500 focus:border-gray-500"
              placeholder="Optional order note, e.g. gift receipt"
              @input="$emit('update:orderNotes', ($event.target as HTMLInputElement).value)"
            >
          </div>

          <!-- Accepted payments strip -->
          <div class="pt-2 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
            <PosWeAcceptPaymentStrip :show-label="true" size="sm" :show-e-wallets="false" />
            <span class="text-xs text-gray-600">Secured by ABA PayWay</span>
          </div>
        </div>

        <!-- 6. Footer: one clear primary action -->
        <div class="px-5 py-3 border-t border-gray-200 flex items-center gap-3 bg-gray-50 flex-shrink-0">
          <button
            type="button"
            class="h-12 px-4 rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-100 text-sm font-semibold transition-colors cursor-pointer"
            @click="$emit('update:modelValue', false)"
          >
            Back <span class="text-gray-600 font-normal">(Esc)</span>
          </button>

          <button
            v-if="!isSplitMode && selectedPaymentMethod === 'ABA_KHQR'"
            type="button"
            class="h-12 flex-1 bg-pay text-white rounded-lg text-base font-bold hover:bg-pay-hover disabled:bg-gray-200 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2"
            :disabled="processingSale || isCheckoutDisabled"
            @click="$emit('selectAbaKhqr')"
          >
            <UIcon :name="processingSale ? 'i-heroicons-arrow-path' : 'i-heroicons-qr-code'" class="w-5 h-5" :class="{ 'animate-spin': processingSale }" />
            <span>{{ processingSale ? 'Creating QR…' : `Show QR · $${grandTotal.toFixed(2)}` }}</span>
          </button>
          <button
            v-else-if="!isSplitMode && selectedPaymentMethod === 'CARD' && !paymentReferenceNumber"
            type="button"
            class="h-12 flex-1 bg-pay text-white rounded-lg text-base font-bold hover:bg-pay-hover disabled:bg-gray-200 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2"
            :disabled="processingSale || isCheckoutDisabled || isAbaModalActive"
            @click="$emit('selectAbaCard')"
          >
            <UIcon name="i-heroicons-credit-card" class="w-5 h-5" />
            <span>{{ isAbaModalActive ? 'Waiting for card…' : `Pay by card · $${grandTotal.toFixed(2)}` }}</span>
          </button>
          <button
            v-else
            type="button"
            class="h-12 flex-1 bg-pay text-white rounded-lg text-base font-bold hover:bg-pay-hover disabled:bg-gray-200 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2"
            :disabled="processingSale || isCheckoutDisabled"
            :aria-busy="processingSale"
            @click="$emit('finalizeSale')"
          >
            <UIcon :name="processingSale ? 'i-heroicons-arrow-path' : 'i-heroicons-check'" class="w-5 h-5" :class="{ 'animate-spin': processingSale }" />
            <span>{{ processingSale ? 'Processing payment…' : `Complete sale · $${grandTotal.toFixed(2)}` }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, toRef, watch } from 'vue'
import { useDialogFocus } from '~/composables/useDialogFocus'

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
  // Context shown in the header
  itemCount?: number
  customerName?: string | null
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

const dialogEl = ref<HTMLElement | null>(null)
const tenderEl = ref<HTMLInputElement | null>(null)

// Focus the cash field first (the common case) so the cashier can type the amount immediately.
useDialogFocus(toRef(props, 'modelValue'), dialogEl, {
  initialFocus: () => (props.selectedPaymentMethod === 'CASH' && !props.isSplitMode ? tenderEl.value : null),
})

watch(
  () => [props.selectedPaymentMethod, props.isSplitMode] as const,
  async ([method, split]) => {
    if (!props.modelValue || split || method !== 'CASH') return
    await nextTick()
    tenderEl.value?.focus()
    tenderEl.value?.select()
  },
)

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

/** Enter in the cash / reference field completes the sale — but never twice, and never while invalid. */
function onTenderEnter() {
  if (props.processingSale || props.isCheckoutDisabled) return
  emit('finalizeSale')
}

function handleMethodSelect(methodVal: string) {
  emit('update:selectedPaymentMethod', methodVal)
}
</script>
