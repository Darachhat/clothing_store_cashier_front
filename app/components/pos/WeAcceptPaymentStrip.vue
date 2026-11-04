<template>
  <div class="inline-flex items-center gap-2 flex-wrap justify-center" :class="containerClass">
    <span
      v-if="showLabel"
      class="text-[11px] font-medium leading-none whitespace-nowrap"
      :class="isDark ? 'text-slate-400' : 'text-gray-500'"
    >
      {{ labelText }}
    </span>

    <div class="inline-flex items-center gap-1.5 flex-wrap justify-center">
      <!-- ABA Bank -->
      <div
        class="inline-flex items-center justify-center rounded border bg-white overflow-hidden shadow-2xs transition-transform hover:scale-105"
        :class="[badgeBorderClass, badgeSizeClassWide]"
        title="ABA Bank"
      >
        <img
          src="/images/payments/aba.svg"
          alt="ABA Bank"
          class="object-contain"
          :class="imgSizeClassWide"
        >
      </div>

      <!-- NBC KHQR -->
      <div
        class="inline-flex items-center justify-center rounded border bg-white overflow-hidden shadow-2xs transition-transform hover:scale-105"
        :class="[badgeBorderClass, badgeSizeClassWide]"
        title="KHQR (Bakong & Member Banks)"
      >
        <img
          src="/images/payments/khqr.svg"
          alt="KHQR"
          class="object-contain"
          :class="imgSizeClassWide"
        >
      </div>

      <!-- VISA -->
      <div
        class="inline-flex items-center justify-center rounded border bg-white overflow-hidden shadow-2xs transition-transform hover:scale-105"
        :class="[badgeBorderClass, badgeSizeClassSquare]"
        title="Visa"
      >
        <img
          src="/images/payments/visa.svg"
          alt="Visa"
          class="object-contain"
          :class="imgSizeClassSquare"
        >
      </div>

      <!-- Mastercard -->
      <div
        class="inline-flex items-center justify-center rounded border bg-white overflow-hidden shadow-2xs transition-transform hover:scale-105"
        :class="[badgeBorderClass, badgeSizeClassSquare]"
        title="Mastercard"
      >
        <img
          src="/images/payments/mastercard.svg"
          alt="Mastercard"
          class="object-contain"
          :class="imgSizeClassSquare"
        >
      </div>

      <!-- UnionPay -->
      <div
        class="inline-flex items-center justify-center rounded border bg-white overflow-hidden shadow-2xs transition-transform hover:scale-105"
        :class="[badgeBorderClass, badgeSizeClassSquare]"
        title="UnionPay"
      >
        <img
          src="/images/payments/unionpay.svg"
          alt="UnionPay"
          class="object-contain"
          :class="imgSizeClassSquare"
        >
      </div>

      <!-- JCB -->
      <div
        class="inline-flex items-center justify-center rounded border bg-white overflow-hidden shadow-2xs transition-transform hover:scale-105"
        :class="[badgeBorderClass, badgeSizeClassSquare]"
        title="JCB"
      >
        <img
          src="/images/payments/jcb.svg"
          alt="JCB"
          class="object-contain"
          :class="imgSizeClassSquare"
        >
      </div>

      <!-- Alipay -->
      <div
        v-if="showEWallets"
        class="inline-flex items-center justify-center rounded border bg-white overflow-hidden shadow-2xs transition-transform hover:scale-105"
        :class="[badgeBorderClass, badgeSizeClassSquare]"
        title="Alipay"
      >
        <img
          src="/images/payments/alipay.svg"
          alt="Alipay"
          class="object-contain"
          :class="imgSizeClassSquare"
        >
      </div>

      <!-- WeChat -->
      <div
        v-if="showEWallets"
        class="inline-flex items-center justify-center rounded border bg-white overflow-hidden shadow-2xs transition-transform hover:scale-105"
        :class="[badgeBorderClass, badgeSizeClassSquare]"
        title="WeChat Pay"
      >
        <img
          src="/images/payments/wechat.svg"
          alt="WeChat Pay"
          class="object-contain"
          :class="imgSizeClassSquare"
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
    theme?: 'light' | 'dark'
    size?: 'sm' | 'md'
    showEWallets?: boolean
  }>(),
  {
    showLabel: true,
    labelText: 'We accept:',
    variant: 'light',
    theme: undefined,
    size: 'sm',
    showEWallets: true,
  }
)

const isDark = computed(() => props.variant === 'dark' || props.theme === 'dark')

const badgeBorderClass = computed(() =>
  isDark.value ? 'border-slate-800' : 'border-gray-200/90'
)

const containerClass = computed(() => (isDark.value ? 'text-white' : 'text-gray-900'))

const badgeSizeClassSquare = computed(() =>
  props.size === 'md' ? 'h-6 w-6 p-0.5' : 'h-5 w-5 p-0.5'
)

const badgeSizeClassWide = computed(() =>
  props.size === 'md' ? 'h-6 w-10 p-0.5' : 'h-5 w-8 p-0.5'
)

const imgSizeClassSquare = computed(() =>
  props.size === 'md' ? 'h-5 w-5' : 'h-4 w-4'
)

const imgSizeClassWide = computed(() =>
  props.size === 'md' ? 'h-5 w-9' : 'h-4 w-7'
)
</script>
