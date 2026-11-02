<template>
  <!-- ABA KHQR Payment Panel — shown inside PaymentModal when ABA_KHQR is selected -->
  <div class="flex flex-col gap-3 p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center justify-center gap-2.5 py-6">
      <div class="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      <span class="text-xs text-gray-600 font-semibold">Generating KHQR code…</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center gap-2 py-4 text-center">
      <UIcon name="i-heroicons-exclamation-circle" class="w-8 h-8 text-rose-500" />
      <p class="text-xs text-gray-700 font-medium">{{ error }}</p>
      <button
        type="button"
        class="mt-1 h-8 px-3.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
        @click="$emit('retry')"
      >
        Try Again
      </button>
    </div>

    <!-- QR ready -->
    <template v-else-if="qrImage || qrString">
      <!-- Single Coherent White KHQR Card -->
      <div class="w-full bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col items-center text-center">
        <!-- Official Branding Header -->
        <div class="w-full py-2 px-3.5 bg-[#E1232E] text-white flex items-center justify-between">
          <img src="/images/payments/khqr.svg" alt="KHQR" class="h-4 max-h-4 w-auto object-contain">
          <div class="flex items-center gap-1.5">
            <img src="/images/payments/aba.svg" alt="ABA" class="h-4 max-h-4 w-auto object-contain rounded-2xs">
            <span class="text-[10px] font-bold uppercase tracking-wider">ABA PayWay</span>
          </div>
        </div>

        <div class="p-3.5 w-full flex flex-col items-center">
          <!-- Prominent Amount -->
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-extrabold font-mono text-gray-900">${{ amount.toFixed(2) }}</span>
            <span class="text-xs font-bold text-gray-500 font-mono">USD</span>
          </div>
          <span class="text-[11px] font-mono text-gray-500 mb-2">
            KHR equivalent: {{ Math.round(amount * 4100).toLocaleString() }} ៛
          </span>

          <!-- Status Row Directly Above QR -->
          <div
            class="w-full py-1.5 px-2.5 rounded-lg border border-gray-200 text-xs font-semibold flex items-center justify-between mb-2"
            :class="statusClass"
          >
            <span class="inline-flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" :class="statusDot" />
              {{ statusLabel }}
            </span>
            <span v-if="status === 'PENDING' && secondsLeft > 0" class="font-mono text-xs font-bold">
              {{ mmss(secondsLeft) }}
            </span>
          </div>

          <!-- QR Code Display (220x220px) -->
          <div class="w-[220px] h-[220px] bg-white rounded-lg p-1.5 flex items-center justify-center relative">
            <div
              v-if="status === 'EXPIRED' || status === 'DECLINED' || status === 'FAILED'"
              class="flex flex-col items-center justify-center gap-1.5 text-center p-3"
            >
              <UIcon name="i-heroicons-clock" class="w-7 h-7 text-rose-500" />
              <span class="text-xs font-bold text-gray-800">
                {{ status === 'EXPIRED' ? 'Payment expired' : 'Payment failed' }}
              </span>
              <button
                type="button"
                class="mt-1 h-7 px-3 rounded-md bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
                @click="$emit('retry')"
              >
                Regenerate QR
              </button>
            </div>
            <img
              v-else-if="qrImage"
              :src="qrImage"
              alt="ABA KHQR Code"
              class="w-full h-full object-contain [image-rendering:crisp-edges]"
            >
          </div>

          <span class="mt-2 text-[11px] text-gray-600 text-center leading-snug">
            Scan with <strong>ABA Mobile</strong> or any KHQR-supported banking app.
          </span>

          <span v-if="apv" class="text-[10px] font-mono text-gray-500 mt-1">
            APV: <strong>{{ apv }}</strong>
          </span>
        </div>
      </div>

      <!-- Action buttons -->
      <div v-if="status === 'PENDING'" class="flex gap-2">
        <button
          type="button"
          class="flex-1 h-8 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
          :disabled="cancelling"
          @click="$emit('cancel')"
        >
          {{ cancelling ? 'Cancelling…' : 'Cancel QR' }}
        </button>
        <button
          type="button"
          class="px-3 h-8 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
          title="Regenerate QR Code"
          @click="$emit('retry')"
        >
          Regenerate
        </button>
      </div>
    </template>

    <!-- Initial / idle state -->
    <div v-else class="flex flex-col items-center gap-2.5 py-5 text-center">
      <div class="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700">
        <UIcon name="i-heroicons-qr-code" class="w-5 h-5 text-gray-900" />
      </div>
      <div class="flex flex-col gap-0.5">
        <span class="text-xs font-bold text-gray-900">Dynamic ABA KHQR Payment</span>
        <p class="text-xs text-gray-500 max-w-[280px]">
          Generates a scannable KHQR code for ${{ amount.toFixed(2) }} USD ({{ Math.round(amount * 4100).toLocaleString() }} ៛)
        </p>
      </div>
      <button
        type="button"
        class="mt-1 h-9 px-4 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer flex items-center gap-2"
        @click="$emit('generate')"
      >
        <UIcon name="i-heroicons-qr-code" class="w-4 h-4 text-white" />
        <span>Generate KHQR Code</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  loading: boolean
  error: string | null
  status: string   // PENDING | APPROVED | DECLINED | CANCELLED | EXPIRED | ''
  qrImage: string | null
  qrString: string | null
  amount: number
  apv: string | null
  secondsLeft: number
  cancelling: boolean
}>()

defineEmits<{
  retry: []
  cancel: []
  generate: []
}>()

function mmss(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    PENDING: 'Awaiting customer scan',
    PROCESSING: 'Verifying payment',
    APPROVED: 'Payment successful',
    DECLINED: 'Payment failed',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Payment expired',
    FAILED: 'Payment failed',
  }
  return map[props.status] ?? props.status
})

const statusClass = computed(() => {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-900',
    PROCESSING: 'bg-slate-100 text-slate-700',
    APPROVED: 'bg-emerald-50 text-emerald-800',
    DECLINED: 'bg-rose-50 text-rose-800',
    FAILED: 'bg-rose-50 text-rose-800',
    EXPIRED: 'bg-rose-50 text-rose-800',
    CANCELLED: 'bg-gray-100 text-gray-600',
  }
  return map[props.status] ?? 'bg-gray-100 text-gray-700'
})

const statusDot = computed(() => {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-500 animate-pulse',
    PROCESSING: 'bg-sky-500 animate-pulse',
    APPROVED: 'bg-emerald-500',
    DECLINED: 'bg-rose-500',
    FAILED: 'bg-rose-500',
    EXPIRED: 'bg-rose-500',
    CANCELLED: 'bg-gray-400',
  }
  return map[props.status] ?? 'bg-gray-400'
})
</script>
