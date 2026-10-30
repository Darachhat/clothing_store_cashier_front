<template>
  <div class="flex items-center gap-2 flex-wrap" :class="containerClass">
    <span
      v-if="showLabel"
      class="text-[11px] font-medium leading-none"
      :class="isDark ? 'text-slate-400' : 'text-gray-500'"
    >
      {{ labelText }}
    </span>

    <div class="flex items-center gap-1.5 flex-wrap">
      <!-- ABA Bank -->
      <div
        class="flex items-center justify-center rounded-md border bg-white p-0.5 shadow-2xs transition-transform hover:scale-105"
        :class="badgeBorderClass"
        title="ABA Bank"
      >
        <img
          src="/images/payments/aba.svg"
          alt="ABA Bank"
          class="object-contain"
          :class="sizeClassWide"
        >
      </div>

      <!-- NBC KHQR -->
      <div
        class="flex items-center justify-center rounded-md border bg-white p-0.5 shadow-2xs transition-transform hover:scale-105"
        :class="badgeBorderClass"
        title="KHQR (Bakong & Member Banks)"
      >
        <img
          src="/images/payments/khqr.svg"
          alt="KHQR"
          class="object-contain"
          :class="sizeClassWide"
        >
      </div>

      <!-- VISA -->
      <div
        class="flex items-center justify-center rounded-md border bg-white p-0.5 shadow-2xs transition-transform hover:scale-105"
        :class="badgeBorderClass"
        title="Visa"
      >
        <img
          src="/images/payments/visa.svg"
          alt="Visa"
          class="object-contain"
          :class="sizeClassSquare"
        >
      </div>

      <!-- Mastercard -->
      <div
        class="flex items-center justify-center rounded-md border bg-white p-0.5 shadow-2xs transition-transform hover:scale-105"
        :class="badgeBorderClass"
        title="Mastercard"
      >
        <img
          src="/images/payments/mastercard.svg"
          alt="Mastercard"
          class="object-contain"
          :class="sizeClassSquare"
        >
      </div>

      <!-- UnionPay -->
      <div
        class="flex items-center justify-center rounded-md border bg-white p-0.5 shadow-2xs transition-transform hover:scale-105"
        :class="badgeBorderClass"
        title="UnionPay"
      >
        <img
          src="/images/payments/unionpay.svg"
          alt="UnionPay"
          class="object-contain"
          :class="sizeClassSquare"
        >
      </div>

      <!-- JCB -->
      <div
        class="flex items-center justify-center rounded-md border bg-white p-0.5 shadow-2xs transition-transform hover:scale-105"
        :class="badgeBorderClass"
        title="JCB"
      >
        <img
          src="/images/payments/jcb.svg"
          alt="JCB"
          class="object-contain"
          :class="sizeClassSquare"
        >
      </div>

      <!-- Alipay -->
      <div
        v-if="showEWallets"
        class="flex items-center justify-center rounded-md border bg-white p-0.5 shadow-2xs transition-transform hover:scale-105"
        :class="badgeBorderClass"
        title="Alipay"
      >
        <img
          src="/images/payments/alipay.svg"
          alt="Alipay"
          class="object-contain"
          :class="sizeClassSquare"
        >
      </div>

      <!-- WeChat -->
      <div
        v-if="showEWallets"
        class="flex items-center justify-center rounded-md border bg-white p-0.5 shadow-2xs transition-transform hover:scale-105"
        :class="badgeBorderClass"
        title="WeChat Pay"
      >
        <img
          src="/images/payments/wechat.svg"
          alt="WeChat Pay"
          class="object-contain"
          :class="sizeClassSquare"
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    showLabel?: boolean
    labelText?: string
    variant?: 'light' | 'dark'
    size?: 'sm' | 'md'
    showEWallets?: boolean
  }>(),
  {
    showLabel: true,
    labelText: 'We accept:',
    variant: 'light',
    size: 'sm',
    showEWallets: true,
  }
)

const isDark = computed(() => props.variant === 'dark')

const badgeBorderClass = computed(() =>
  isDark.value ? 'border-slate-800' : 'border-gray-200/90'
)

const containerClass = computed(() => (isDark.value ? 'text-white' : 'text-gray-900'))

const sizeClassSquare = computed(() =>
  props.size === 'md' ? 'h-6 w-6' : 'h-4.5 w-4.5'
)

const sizeClassWide = computed(() =>
  props.size === 'md' ? 'h-6 w-10' : 'h-4.5 w-7.5'
)
</script>
