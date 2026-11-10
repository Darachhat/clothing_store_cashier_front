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
            <h3 id="pos-payment-title" class="text-base font-semibold text-gray-900">{{ t('pos.payment_title', 'Complete Payment') }}</h3>
            <p class="text-sm text-gray-600 truncate">
              {{ itemCount ?? 0 }} item{{ itemCount === 1 ? '' : 's' }} &bull; {{ customerName || t('pos.walk_in', 'Walk-in customer') }}
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
          <div
            class="px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-center text-center gap-1 flex-shrink-0"
            aria-live="polite"
          >
            <span class="text-xs font-semibold uppercase tracking-wider text-gray-600">{{ t('pos.amount_due', 'Amount Due') }}</span>
            <div class="flex items-baseline gap-1 text-gray-900">
              <span class="text-2xl font-semibold font-mono text-gray-500">$</span>
              <span class="text-5xl leading-none font-bold font-mono tabular-nums tracking-tight">{{ grandTotal.toFixed(2) }}</span>
              <span class="text-xs font-semibold text-gray-500 ml-1">USD</span>
            </div>
            <span class="text-sm text-gray-600 font-mono tabular-nums">&asymp; {{ formatRiel(grandTotal) }}</span>
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

          <!-- ── Single payment: Exactly 2 Payment Methods (Cash & ABA Payment) ── -->
          <template v-if="!isSplitMode">
            <!-- 2 Main Methods: Cash vs ABA Payment -->
            <div class="grid grid-cols-2 gap-2.5 flex-shrink-0" role="radiogroup" aria-label="Payment method" @keydown="onMethodKeydown">
              <button
                v-for="method in primaryPaymentMethods"
                :key="method.value"
                type="button"
                role="radio"
                :aria-checked="selectedPaymentMethod === method.value"
                :tabindex="selectedPaymentMethod === method.value ? 0 : -1"
                class="flex flex-col items-center justify-center gap-1.5 py-3 px-3 rounded-xl border text-center min-h-[92px] transition-colors cursor-pointer"
                :class="selectedPaymentMethod === method.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'"
                @click="handleMethodSelect(method.value)"
              >
                <UIcon :name="method.icon" class="w-6 h-6" />
                <span class="text-sm font-bold leading-tight">{{ method.label }}</span>
                <span
                  class="text-[11px] leading-tight"
                  :class="selectedPaymentMethod === method.value ? 'text-gray-300' : 'text-gray-500'"
                >
                  {{ method.subtitle }}
                </span>
              </button>
            </div>

            <!-- 4A. Cash Flow -->
            <div v-if="selectedPaymentMethod === 'CASH'" class="flex flex-col gap-3 p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-xs font-bold uppercase text-gray-600 w-9 flex-shrink-0">USD</span>
                  <button
                    type="button"
                    class="h-10 sm:h-11 px-3.5 rounded-lg text-sm font-mono font-semibold tabular-nums bg-white border border-gray-300 text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer touch-manipulation"
                    @click="$emit('update:tenderAmount', Number(grandTotal.toFixed(2)))"
                  >
                    Exact ${{ grandTotal.toFixed(2) }}
                  </button>
                  <button
                    v-for="amt in fastCashPresets"
                    :key="amt"
                    type="button"
                    class="h-10 sm:h-11 px-3.5 rounded-lg text-sm font-mono font-semibold tabular-nums bg-white border border-gray-300 text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer touch-manipulation"
                    @click="$emit('update:tenderAmount', amt)"
                  >
                    ${{ amt }}
                  </button>
                  <button
                    type="button"
                    class="h-10 sm:h-11 px-3 rounded-lg text-sm font-semibold bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 active:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer touch-manipulation"
                    title="Clear tender amount"
                    @click="$emit('update:tenderAmount', 0)"
                  >
                    Clear
                  </button>
                </div>

                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-xs font-bold uppercase text-gray-600 w-9 flex-shrink-0">KHR</span>
                  <button
                    v-for="riel in [20000, 50000, 100000, 200000, 400000]"
                    :key="riel"
                    type="button"
                    class="h-10 sm:h-11 px-3.5 rounded-lg text-sm font-mono font-medium tabular-nums bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer touch-manipulation"
                    :title="`៛${riel.toLocaleString()} ($${(riel / KHR_EXCHANGE_RATE).toFixed(2)})`"
                    @click="$emit('update:tenderAmount', Number((riel / KHR_EXCHANGE_RATE).toFixed(2)))"
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

            <!-- 4B. ABA Payment Flow (Official Built-in Modal Integration) -->
            <div
              v-else-if="isAbaPaymentSelected"
              class="flex flex-col gap-3.5 p-3.5 bg-gray-50 border border-gray-200 rounded-xl"
            >
              <!-- Info Row -->
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-900 flex-shrink-0">
                    <UIcon name="i-heroicons-building-library" class="w-5 h-5" />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-sm font-semibold text-gray-900">ABA PayWay Checkout</span>
                    <span class="text-xs text-gray-600">Built-in popup modal for cards, ABA PAY, KHQR &amp; e-wallets</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-gray-200 text-gray-700">
                  Official PayWay Modal
                </span>
              </div>

              <!-- ABA Payment Options Grid -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Payment Option
                  </label>
                  <span class="text-xs text-gray-500 font-mono">
                    {{ selectedAbaOptionLabel }}
                  </span>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="ABA Payment Option">
                  <button
                    v-for="opt in abaOptions"
                    :key="opt.value"
                    type="button"
                    role="radio"
                    :aria-checked="currentAbaOption === opt.value"
                    class="flex flex-col items-start p-2.5 rounded-lg border text-left transition-colors cursor-pointer"
                    :class="currentAbaOption === opt.value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-100'"
                    @click="onSelectAbaOption(opt.value)"
                  >
                    <div class="flex items-center gap-1.5 mb-1 w-full justify-between">
                      <UIcon :name="opt.icon" class="w-4 h-4" />
                      <span
                        v-if="opt.badge"
                        class="text-[9px] font-bold uppercase px-1 py-0.2 rounded"
                        :class="currentAbaOption === opt.value ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-600'"
                      >
                        {{ opt.badge }}
                      </span>
                    </div>
                    <span class="text-xs font-bold leading-tight">{{ opt.label }}</span>
                    <span
                      class="text-[10px] leading-tight mt-0.5 line-clamp-1"
                      :class="currentAbaOption === opt.value ? 'text-gray-300' : 'text-gray-500'"
                    >
                      {{ opt.subtitle }}
                    </span>
                  </button>
                </div>
              </div>

              <!-- Active Modal Notification / Waiting State -->
              <div
                v-if="isAbaModalActive"
                class="p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between gap-2"
                role="status"
              >
                <div class="flex items-center gap-2.5">
                  <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-gray-700 animate-spin" />
                  <div class="flex flex-col">
                    <span class="text-sm font-semibold text-gray-900">ABA PayWay Modal Active</span>
                    <span class="text-xs text-gray-600">Please complete payment in the ABA popup window</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="h-8 px-3 rounded-md text-xs font-semibold text-gray-800 hover:bg-gray-100 border border-gray-300 cursor-pointer"
                  @click="$emit('abaCancel')"
                >
                  Cancel
                </button>
              </div>

              <!-- Informational explanation -->
              <div v-else class="text-xs text-gray-600 leading-snug">
                Clicking <strong>Pay with ABA</strong> launches ABA PayWay's built-in checkout window with <strong>{{ selectedAbaOptionLabel }}</strong>. Payment is verified automatically upon completion.
              </div>
            </div>
          </template>

          <!-- ── Split payment mode: Exactly 2 Methods (Cash & ABA Payment) ── -->
          <template v-else>
            <div class="flex flex-col gap-2.5 p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
              <div class="flex flex-col gap-2">
                <div
                  v-for="(split, sIdx) in splitPayments"
                  :key="sIdx"
                  class="flex flex-wrap items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg"
                >
                  <select
                    v-model="split.payment_method"
                    :aria-label="`Method for payment ${sIdx + 1}`"
                    class="h-10 bg-white border border-gray-300 rounded-md px-2.5 text-sm font-semibold flex-1 min-w-[130px]"
                  >
                    <option value="CASH">Cash</option>
                    <option value="ABA_PAYWAY">ABA Payment</option>
                  </select>

                  <div class="relative flex items-center w-36">
                    <span class="absolute left-2.5 text-sm font-mono text-gray-600 pointer-events-none">$</span>
                    <input
                      v-model.number="split.amount"
                      type="number"
                      step="0.01"
                      min="0"
                      inputmode="decimal"
                      :aria-label="`Amount for payment ${sIdx + 1}`"
                      class="h-10 bg-white border border-gray-300 rounded-md pl-6 pr-2 text-sm font-mono tabular-nums font-bold text-gray-900 w-full focus:border-gray-500"
                    >
                  </div>

                  <button
                    type="button"
                    class="h-10 px-2.5 rounded-md text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 cursor-pointer"
                    title="Fill remaining balance into this line"
                    @click="fillRemainingBalance(sIdx)"
                  >
                    Fill rest
                  </button>

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

                  <input
                    v-if="split.payment_method !== 'CASH'"
                    v-model="split.reference_number"
                    placeholder="Reference (optional)"
                    :aria-label="`Reference for payment ${sIdx + 1}`"
                    class="h-10 bg-white border border-gray-300 rounded-md px-2.5 text-sm w-full placeholder-gray-500"
                  >
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
            <PosWeAcceptPaymentStrip :show-label="true" size="sm" :show-e-wallets="true" />
            <span class="text-xs text-gray-600">Secured by ABA PayWay</span>
          </div>
        </div>

        <!-- 6. Footer: Action Buttons -->
        <div class="px-5 py-3 border-t border-gray-200 flex items-center gap-3 bg-gray-50 flex-shrink-0">
          <button
            type="button"
            class="h-12 px-4 rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-100 text-sm font-semibold transition-colors cursor-pointer"
            @click="$emit('update:modelValue', false)"
          >
            Back <span class="text-gray-600 font-normal">(Esc)</span>
          </button>

          <!-- ABA Payment Trigger -->
          <button
            v-if="!isSplitMode && isAbaPaymentSelected"
            type="button"
            class="h-12 flex-1 bg-pay text-white rounded-lg text-base font-bold hover:bg-pay-hover disabled:bg-gray-200 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2"
            :disabled="processingSale || isCheckoutDisabled || isAbaModalActive"
            @click="$emit('startAbaCheckout', currentAbaOption)"
          >
            <UIcon
              :name="isAbaModalActive || processingSale ? 'i-heroicons-arrow-path' : 'i-heroicons-building-library'"
              class="w-5 h-5"
              :class="{ 'animate-spin': isAbaModalActive || processingSale }"
            />
            <span>
              {{ isAbaModalActive
                ? 'Waiting for ABA payment…'
                : (processingSale ? 'Opening ABA PayWay…' : `Pay with ABA (${selectedAbaOptionLabel}) · $${grandTotal.toFixed(2)}`)
              }}
            </span>
          </button>

          <!-- Cash / Split Sale Finalize -->
          <button
            v-else
            type="button"
            class="h-12 flex-1 bg-pay text-white rounded-lg text-base font-bold hover:bg-pay-hover disabled:bg-gray-200 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2"
            :disabled="processingSale || isCheckoutDisabled"
            :aria-busy="processingSale"
            @click="$emit('finalizeSale')"
          >
            <UIcon :name="processingSale ? 'i-heroicons-arrow-path' : 'i-heroicons-check'" class="w-5 h-5" :class="{ 'animate-spin': processingSale }" />
            <span>{{ processingSale ? t('common.loading', 'Processing payment…') : `${t('pos.complete_payment', 'Complete sale')} · $${grandTotal.toFixed(2)}` }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, toRef, watch } from 'vue'
import { useDialogFocus } from '~/composables/useDialogFocus'
import { KHR_EXCHANGE_RATE } from '~/composables/useCustomerDisplaySync'
import { useAppTranslation } from '~/composables/useAppTranslation'

const { t } = useAppTranslation()

export interface AbaOptionItem {
  value: 'bakong' | 'abapay' | 'cards' | 'alipay' | 'wechat' | 'google_pay'
  label: string
  subtitle: string
  icon: string
  badge?: string
}

const abaOptions: AbaOptionItem[] = [
  {
    value: 'bakong',
    label: 'KHQR (Bakong)',
    subtitle: 'Scan with Bakong or any bank',
    icon: 'i-heroicons-qr-code',
    badge: 'Popular',
  },
  {
    value: 'abapay',
    label: 'ABA PAY',
    subtitle: 'Scan with ABA Mobile app',
    icon: 'i-heroicons-device-phone-mobile',
    badge: 'ABA Mobile',
  },
  {
    value: 'cards',
    label: 'Credit / Debit Cards',
    subtitle: 'Visa, Mastercard, JCB, UPI',
    icon: 'i-heroicons-credit-card',
  },
  {
    value: 'alipay',
    label: 'Alipay',
    subtitle: 'Scan to pay with Alipay',
    icon: 'i-heroicons-qr-code',
  },
  {
    value: 'wechat',
    label: 'WeChat Pay',
    subtitle: 'Scan to pay with WeChat',
    icon: 'i-heroicons-qr-code',
  },
  {
    value: 'google_pay',
    label: 'Google Pay',
    subtitle: 'Pay with Google Wallet',
    icon: 'i-heroicons-wallet',
  },
]

const primaryPaymentMethods = [
  {
    value: 'CASH',
    label: 'Cash',
    subtitle: 'USD & Khmer Riel cash drawer',
    icon: 'i-heroicons-banknotes',
  },
  {
    value: 'ABA_PAYWAY',
    label: 'ABA Payment',
    subtitle: 'Cards, ABA PAY, KHQR, Alipay, WeChat',
    icon: 'i-heroicons-building-library',
  },
]

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    grandTotal: number
    formatRiel: (amount: number) => string
    isSplitMode: boolean
    paymentMethods?: Array<{ value: string; label: string; subtitle?: string; icon?: string }>
    selectedPaymentMethod: string
    selectedAbaOption?: 'bakong' | 'abapay' | 'cards' | 'alipay' | 'wechat' | 'google_pay'
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
    isAbaModalActive?: boolean
    // Context shown in the header
    itemCount?: number
    customerName?: string | null
    customerDisplayOnline?: boolean
    terminalLabel?: string
  }>(),
  {
    paymentMethods: () => [
      { value: 'CASH', label: 'Cash', subtitle: 'USD & Khmer Riel cash drawer', icon: 'i-heroicons-banknotes' },
      { value: 'ABA_PAYWAY', label: 'ABA Payment', subtitle: 'Cards, ABA PAY, KHQR, Alipay, WeChat', icon: 'i-heroicons-building-library' },
    ],
    selectedAbaOption: 'bakong',
    isAbaModalActive: false,
    itemCount: 0,
    customerName: null,
    customerDisplayOnline: false,
    terminalLabel: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'update:selectedPaymentMethod': [val: string]
  'update:selectedAbaOption': [val: 'bakong' | 'abapay' | 'cards' | 'alipay' | 'wechat' | 'google_pay']
  'update:tenderAmount': [val: number]
  'update:paymentReferenceNumber': [val: string]
  'update:orderNotes': [val: string]
  'enableSplitMode': []
  'disableSplitMode': []
  'addSplitRow': []
  'removeSplitRow': [index: number]
  'finalizeSale': []
  'startAbaCheckout': [option: 'bakong' | 'abapay' | 'cards' | 'alipay' | 'wechat' | 'google_pay']
  'abaCancel': []
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

const isAbaPaymentSelected = computed(() => {
  return props.selectedPaymentMethod === 'ABA_PAYWAY' ||
    props.selectedPaymentMethod === 'ABA_KHQR' ||
    props.selectedPaymentMethod === 'CARD'
})

const currentAbaOption = computed(() => props.selectedAbaOption || 'bakong')

const selectedAbaOptionLabel = computed(() => {
  const match = abaOptions.find((o) => o.value === currentAbaOption.value)
  return match?.label || 'KHQR (Bakong)'
})

function onSelectAbaOption(opt: 'bakong' | 'abapay' | 'cards' | 'alipay' | 'wechat' | 'google_pay') {
  emit('update:selectedAbaOption', opt)
}

function handleMethodSelect(methodValue: string) {
  emit('update:selectedPaymentMethod', methodValue)
}

/**
 * Prevent long IEEE-754 floating-point numbers from appearing in tender input
 */
const formattedTenderValue = computed(() => {
  const val = Number(props.tenderAmount)
  if (!val || Number.isNaN(val)) return ''
  return Number.isInteger(val) ? String(val) : String(Number(val.toFixed(2)))
})

const cashShortfall = computed(() => {
  const due = Number(props.grandTotal.toFixed(2))
  const tender = Number((Number(props.tenderAmount) || 0).toFixed(2))
  const diff = due - tender
  return diff > 0 ? Number(diff.toFixed(2)) : 0
})

const cashTenderState = computed<'exact' | 'sufficient' | 'insufficient'>(() => {
  const due = Number(props.grandTotal.toFixed(2))
  const tender = Number((Number(props.tenderAmount) || 0).toFixed(2))
  if (tender === due) return 'exact'
  if (tender > due) return 'sufficient'
  return 'insufficient'
})

function onTenderInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const num = parseFloat(raw)
  emit('update:tenderAmount', Number.isNaN(num) ? 0 : num)
}

function onTenderEnter() {
  if (cashTenderState.value === 'insufficient') return
  emit('finalizeSale')
}

function onMethodKeydown(e: KeyboardEvent) {
  const methods = primaryPaymentMethods
  const currentIdx = methods.findIndex((m) => m.value === props.selectedPaymentMethod)
  if (currentIdx === -1) return

  let nextIdx = currentIdx
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    nextIdx = (currentIdx + 1) % methods.length
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    nextIdx = (currentIdx - 1 + methods.length) % methods.length
  } else {
    return
  }

  e.preventDefault()
  const nextMethod = methods[nextIdx]
  if (nextMethod) {
    handleMethodSelect(nextMethod.value)
  }
}

function fillRemainingBalance(index: number) {
  const row = props.splitPayments[index]
  if (!row) return
  const currentTotalWithoutThis = props.splitPayments.reduce((acc, s, idx) => {
    return idx === index ? acc : acc + (Number(s.amount) || 0)
  }, 0)
  const remaining = Math.max(0, props.grandTotal - currentTotalWithoutThis)
  row.amount = Number(remaining.toFixed(2))
}
</script>
