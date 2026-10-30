<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 h-dvh w-screen bg-[#0B1120] text-white flex flex-col justify-between overflow-hidden select-none font-sans"
        tabindex="-1"
      >
        <!-- ── 1. Compact Top Header (52px) ────────────────────────── -->
        <header class="h-[52px] min-h-[52px] bg-slate-900/95 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 flex-shrink-0 whitespace-nowrap">
          <!-- Left: Store Logo, Store Name, Branch, Cashier & ABA PayWay Identification -->
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-7 h-7 rounded-md bg-white text-slate-950 flex items-center justify-center font-bold flex-shrink-0">
              <UIcon name="i-heroicons-building-storefront" class="w-4 h-4" />
            </div>
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-xs font-bold text-white truncate">{{ storeName }}</span>
              <span class="text-slate-600">&bull;</span>
              <span class="text-xs text-slate-300 truncate">{{ branchName }}</span>
              <span class="hidden md:inline text-slate-600">&bull;</span>
              <span class="hidden md:inline text-xs text-slate-400 truncate">Cashier: {{ cashierName }}</span>
            </div>
            <div class="hidden lg:flex items-center gap-1.5 pl-3 ml-1 border-l border-slate-800 flex-shrink-0">
              <img src="/images/payments/aba.svg" alt="ABA Bank" class="h-4 max-h-4 w-auto object-contain rounded-xs" />
              <img src="/images/payments/khqr.svg" alt="KHQR" class="h-4 max-h-4 w-auto object-contain rounded-xs" />
              <span class="text-[11px] text-slate-300 font-semibold">ABA PayWay KHQR</span>
            </div>
          </div>

          <!-- Right: Payment Status + Countdown & Cancel Action -->
          <div class="flex items-center gap-2.5 flex-shrink-0">
            <!-- Status & Countdown Indicator -->
            <div
              class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-800/90 border border-slate-700 text-xs font-semibold"
              :class="headerStatusTextClass"
            >
              <UIcon
                v-if="verifying || status === 'PROCESSING'"
                name="i-heroicons-arrow-path"
                class="w-3.5 h-3.5 text-slate-300 animate-spin"
              />
              <span v-else class="w-2 h-2 rounded-full" :class="statusDotClass" />
              <span>{{ statusLabel }}</span>
              <span
                v-if="status === 'PENDING' && secondsLeft > 0"
                class="font-mono text-slate-200 pl-1.5 ml-0.5 border-l border-slate-700"
              >
                {{ formatMmSs(secondsLeft) }}
              </span>
            </div>

            <!-- Cancel & Back Action -->
            <button
              type="button"
              class="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              :disabled="cancelling"
              @click="handleCancel"
            >
              <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5 text-slate-300" />
              <span>{{ cancelling ? 'Cancelling…' : 'Cancel & Back' }}</span>
              <kbd class="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400 leading-none">
                Esc
              </kbd>
            </button>
          </div>
        </header>

        <!-- ── 2. Centered Main Payment Panel ──────────────────────── -->
        <main class="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-scrollbar">
          <div class="w-full max-w-[420px] bg-white text-slate-900 rounded-xl border border-gray-200 overflow-hidden flex flex-col">
            <!-- A. Official ABA PayWay / KHQR Branding Header -->
            <div class="w-full px-4 py-2.5 bg-[#E1232E] text-white flex items-center justify-between">
              <div class="flex items-center gap-2">
                <img
                  src="/images/payments/khqr.svg"
                  alt="KHQR"
                  class="h-5 w-auto object-contain"
                />
                <span class="text-xs font-bold tracking-wide uppercase text-white">
                  KHQR Payment
                </span>
              </div>
              <div class="flex items-center gap-1.5">
                <img
                  src="/images/payments/aba.svg"
                  alt="ABA PayWay"
                  class="h-5 w-auto object-contain rounded-xs bg-white/10 p-0.5"
                />
                <span class="text-[11px] font-semibold text-white/95">
                  ABA PayWay
                </span>
              </div>
            </div>

            <!-- Card Content Body -->
            <div class="px-5 py-3.5 flex flex-col items-center text-center">
              <!-- B. Store & Order Information -->
              <div class="w-full flex items-center justify-between text-xs text-gray-500 pb-2 border-b border-gray-100">
                <span class="font-semibold text-gray-700 truncate">
                  {{ storeName }} &bull; {{ branchName }}
                </span>
                <span class="font-mono text-gray-500 flex-shrink-0 pl-2">
                  {{ cartItemsCount }} item{{ Number(cartItemsCount) === 1 ? '' : 's' }}
                </span>
              </div>

              <!-- C. Prominent Payment Amount -->
              <div class="mt-2.5 mb-2.5 flex flex-col items-center">
                <div class="flex items-baseline gap-1.5">
                  <span class="text-[30px] sm:text-[32px] leading-none font-extrabold font-mono text-gray-900 tracking-tight">
                    ${{ formatUsd(amount) }}
                  </span>
                  <span class="text-sm font-bold text-gray-500 font-mono">USD</span>
                </div>
                <span class="mt-1 text-xs font-semibold font-mono text-gray-500">
                  KHR equivalent: {{ formatKhrNumber(amount) }} ៛
                </span>
              </div>

              <!-- D. Compact Payment Status Row (Directly Above QR Code) -->
              <div
                class="w-full py-1.5 px-3 rounded-lg border border-gray-200 text-xs font-semibold flex items-center justify-between mb-2.5"
                :class="cardStatusBannerClass"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <UIcon
                    v-if="verifying || status === 'PROCESSING'"
                    name="i-heroicons-arrow-path"
                    class="w-3.5 h-3.5 text-slate-600 animate-spin flex-shrink-0"
                  />
                  <span v-else class="w-2 h-2 rounded-full flex-shrink-0" :class="statusDotClass" />
                  <span class="truncate">{{ statusLabel }}</span>
                </div>
                <span
                  v-if="status === 'PENDING' && secondsLeft > 0"
                  class="font-mono text-xs font-bold flex-shrink-0 pl-2"
                >
                  {{ formatMmSs(secondsLeft) }}
                </span>
                <span
                  v-else-if="status === 'APPROVED' && apv"
                  class="font-mono text-[11px] flex-shrink-0 pl-2"
                >
                  APV {{ apv }}
                </span>
              </div>

              <!-- E. Primary QR Code Display Area (256-268px) -->
              <div class="w-[252px] h-[252px] sm:w-[268px] sm:h-[268px] bg-white rounded-lg flex items-center justify-center relative">
                <!-- Loading State -->
                <div v-if="loading" class="flex flex-col items-center justify-center gap-2.5 text-gray-500 p-4">
                  <div class="w-9 h-9 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                  <span class="text-xs font-semibold text-gray-700">Generating KHQR code…</span>
                </div>

                <!-- Confirmed Success State -->
                <div
                  v-else-if="status === 'APPROVED'"
                  class="w-full h-full rounded-lg bg-emerald-50/60 border border-gray-200 flex flex-col items-center justify-center gap-2.5 p-4"
                >
                  <div class="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <UIcon name="i-heroicons-check" class="w-8 h-8" />
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <span class="text-sm font-bold text-gray-900">Payment successful</span>
                    <span class="text-xs text-gray-600">Verified by ABA PayWay</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-[11px] text-gray-500 pt-1">
                    <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5 text-gray-400" />
                    <span>Preparing receipt…</span>
                  </div>
                </div>

                <!-- Failed or Expired State (Never leave expired QR active) -->
                <div
                  v-else-if="error || isExpiredOrFailed"
                  class="w-full h-full rounded-lg bg-gray-50 border border-gray-200 flex flex-col items-center justify-center gap-2 p-4 text-center"
                >
                  <div class="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-gray-200">
                    <UIcon
                      :name="status === 'EXPIRED' ? 'i-heroicons-clock' : 'i-heroicons-exclamation-circle'"
                      class="w-6 h-6"
                    />
                  </div>
                  <span class="text-xs font-bold text-gray-900">
                    {{ status === 'EXPIRED' ? 'Payment expired' : 'Payment failed' }}
                  </span>
                  <p class="text-[11px] text-gray-500 max-w-[200px] leading-snug">
                    {{ error || (status === 'EXPIRED' ? 'This QR code has expired and can no longer be scanned.' : 'The transaction was declined or could not be completed.') }}
                  </p>
                  <button
                    type="button"
                    class="mt-1 h-8 px-4 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
                    @click="$emit('retry')"
                  >
                    Regenerate QR
                  </button>
                </div>

                <!-- Active Scannable QR Code (Exact Payload & Quiet Zone Preserved) -->
                <img
                  v-else-if="qrImage"
                  :src="qrImage"
                  alt="ABA PayWay KHQR Code"
                  class="w-full h-full object-contain [image-rendering:crisp-edges]"
                />

                <!-- Waiting for QR Image -->
                <div v-else class="flex flex-col items-center justify-center gap-2 text-gray-400">
                  <UIcon name="i-heroicons-qr-code" class="w-10 h-10" />
                  <span class="text-xs font-medium">Awaiting QR payload…</span>
                </div>
              </div>

              <!-- F. Scanning Instructions & Supported Methods -->
              <div class="mt-2.5 flex flex-col items-center gap-1.5 w-full">
                <p class="text-xs font-medium text-gray-700">
                  Scan with <strong>ABA Mobile</strong> or any KHQR-supported banking app.
                </p>
                <div class="flex items-center justify-center gap-2 text-[11px] text-gray-500">
                  <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 border border-gray-200">
                    <img src="/images/payments/aba.svg" alt="ABA" class="h-3.5 w-auto object-contain rounded-2xs" />
                    <span class="font-semibold text-gray-700">ABA Mobile</span>
                  </div>
                  <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 border border-gray-200">
                    <img src="/images/payments/khqr.svg" alt="KHQR" class="h-3.5 w-auto object-contain rounded-2xs" />
                    <span class="font-semibold text-gray-700">Bakong &amp; KHQR Banks</span>
                  </div>
                  <a
                    v-if="checkoutUrl && status === 'PENDING' && !isExpiredOrFailed"
                    :href="checkoutUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold border border-gray-200 transition-colors"
                    title="Open ABA Mobile Deep Link"
                  >
                    <span>ABA App</span>
                  </a>
                </div>
              </div>

              <!-- G. Compact Transaction Reference & Expiration Footer -->
              <div class="mt-3 pt-2.5 border-t border-gray-100 w-full flex items-center justify-between gap-2 text-[11px] text-gray-400 font-mono">
                <span class="truncate" :title="tranId || ''">
                  Ref: <strong class="font-semibold text-gray-600">{{ tranId || '—' }}</strong>
                </span>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span v-if="apv">
                    APV: <strong class="text-gray-600">{{ apv }}</strong>
                  </span>
                  <span v-else-if="status === 'PENDING' && secondsLeft > 0">
                    Expires in {{ formatMmSs(secondsLeft) }}
                  </span>
                  <span v-else-if="status === 'EXPIRED'" class="text-rose-600 font-semibold">
                    Expired
                  </span>
                  <button
                    v-if="status === 'PENDING' && !loading"
                    type="button"
                    class="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-sans text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    :disabled="verifying"
                    title="Check payment status with ABA PayWay now"
                    @click="$emit('verify')"
                  >
                    {{ verifying ? 'Checking…' : 'Verify' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <!-- ── 3. Slim Bottom Order Summary (46px) ─────────────────── -->
        <footer class="h-[46px] min-h-[46px] bg-slate-900/95 border-t border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 text-xs text-slate-300 flex-shrink-0 whitespace-nowrap">
          <div class="flex items-center gap-3 min-w-0">
            <span class="truncate">
              <template v-if="tranId">
                Order Ref: <strong class="font-mono text-white">{{ tranId }}</strong>
                <span class="text-slate-600 mx-1.5">&bull;</span>
              </template>
              <strong>{{ cartItemsCount }} item{{ Number(cartItemsCount) === 1 ? '' : 's' }}</strong>
            </span>
            <span class="text-slate-600">&bull;</span>
            <span class="font-mono">
              Total Due: <strong class="text-white">${{ formatUsd(amount) }} USD</strong>
              <span class="hidden sm:inline text-slate-400"> ({{ formatKhrNumber(amount) }} ៛)</span>
            </span>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              v-if="error || isExpiredOrFailed"
              type="button"
              class="h-7 px-3 rounded-md bg-white text-slate-950 font-semibold text-xs hover:bg-gray-100 transition-colors cursor-pointer"
              @click="$emit('retry')"
            >
              Regenerate QR
            </button>
            <button
              type="button"
              class="h-7 px-3 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs hover:bg-slate-700 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              :disabled="cancelling"
              @click="handleCancel"
            >
              <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
              <span>{{ cancelling ? 'Cancelling…' : 'Cancel & Return to POS' }}</span>
            </button>
          </div>
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    loading?: boolean
    verifying?: boolean
    error?: string | null
    status?: string
    qrImage?: string | null
    qrString?: string | null
    checkoutUrl?: string | null
    amount?: number
    apv?: string | null
    tranId?: string | null
    secondsLeft?: number
    cancelling?: boolean
    storeName?: string
    branchName?: string
    cashierName?: string
    cartItemsCount?: number | string | null
    formatRiel?: (amount: number) => string
  }>(),
  {
    modelValue: false,
    loading: false,
    verifying: false,
    error: null,
    status: 'PENDING',
    qrImage: null,
    qrString: null,
    checkoutUrl: null,
    amount: 0,
    apv: null,
    tranId: null,
    secondsLeft: 0,
    cancelling: false,
    storeName: 'Clothing Store',
    branchName: 'Main Store',
    cashierName: 'Cashier',
    cartItemsCount: 0,
    formatRiel: (amount: number) => `៛${Math.round(amount * 4100).toLocaleString()}`,
  }
)

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'cancel': []
  'retry': []
  'verify': []
}>()

const isExpiredOrFailed = computed(() => {
  return (
    props.status === 'EXPIRED' ||
    props.status === 'DECLINED' ||
    props.status === 'FAILED'
  )
})

const statusLabel = computed(() => {
  if (props.loading) return 'Generating QR code…'
  if (props.verifying || props.status === 'PROCESSING') return 'Verifying payment'
  if (props.error) return 'Payment failed'
  switch (props.status) {
    case 'APPROVED':
      return 'Payment successful'
    case 'DECLINED':
    case 'FAILED':
      return 'Payment failed'
    case 'EXPIRED':
      return 'Payment expired'
    case 'PENDING':
    default:
      return 'Awaiting customer scan'
  }
})

const statusDotClass = computed(() => {
  if (props.error || isExpiredOrFailed.value) return 'bg-rose-500'
  if (props.status === 'APPROVED') return 'bg-emerald-500'
  if (props.verifying || props.status === 'PROCESSING') return 'bg-sky-500 animate-pulse'
  return 'bg-amber-500 animate-pulse'
})

const headerStatusTextClass = computed(() => {
  if (props.error || isExpiredOrFailed.value) return 'text-rose-400'
  if (props.status === 'APPROVED') return 'text-emerald-400'
  if (props.verifying || props.status === 'PROCESSING') return 'text-slate-200'
  return 'text-amber-300'
})

const cardStatusBannerClass = computed(() => {
  if (props.error || isExpiredOrFailed.value) return 'bg-rose-50 text-rose-800'
  if (props.status === 'APPROVED') return 'bg-emerald-50 text-emerald-800'
  if (props.verifying || props.status === 'PROCESSING') return 'bg-slate-100 text-slate-700'
  return 'bg-amber-50/90 text-amber-900'
})

function formatUsd(val?: number): string {
  const num = Number(val) || 0
  return num.toFixed(2)
}

function formatKhrNumber(val?: number): string {
  const num = Number(val) || 0
  const formatted = props.formatRiel ? props.formatRiel(num) : `${Math.round(num * 4100).toLocaleString()}`
  return formatted.replace(/៛/g, '').trim()
}

function formatMmSs(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function handleCancel() {
  emit('cancel')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue && !props.cancelling && props.status !== 'APPROVED') {
    handleCancel()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>
