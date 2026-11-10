<!-- AppButton — flat structural button, 8px grid, pure Tailwind -->
<template>
  <component
    :is="to ? (external ? 'a' : resolveComponent('NuxtLink')) : 'button'"
    class="inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap no-underline transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none"
    :class="[
      // Sizes
      size === 'sm' ? 'h-8 px-2.5 text-xs' :
      size === 'lg' ? 'h-11 px-5 text-sm sm:text-base' :
      'h-9 px-3.5 text-xs sm:text-sm',

      // Variants (No colorful borders)
      variant === 'primary' ? 'bg-ink text-white border border-ink hover:opacity-90' :
      variant === 'danger'  ? 'bg-surface-card text-status-red border border-border-default hover:bg-status-red-bg' :
      variant === 'ghost'   ? 'bg-transparent text-ink-secondary border border-transparent hover:bg-surface-hover hover:text-ink' :
      'bg-surface-card text-ink border border-border-default hover:bg-surface-hover hover:border-border-default',

      // Modifiers
      block && 'w-full',
      loading && 'opacity-70 pointer-events-none',
    ]"
    :href="external ? to : undefined"
    :to="!external ? to : undefined"
    :target="external ? '_blank' : undefined"
    :disabled="disabled || loading"
    :type="!to ? (type || 'button') : undefined"
    v-bind="$attrs"
  >
    <UIcon
      v-if="loading"
      name="i-heroicons-arrow-path"
      class="w-3.5 h-3.5 animate-spin"
    />
    <slot v-if="!loading" name="icon-left" />
    <slot>{{ label }}</slot>
    <slot name="icon-right" />
  </component>
</template>

<script setup lang="ts">
import { resolveComponent } from 'vue'

withDefaults(defineProps<{
  label?:    string
  to?:       string
  external?: boolean
  variant?:  'default' | 'primary' | 'danger' | 'ghost'
  size?:     'sm' | 'md' | 'lg'
  block?:    boolean
  loading?:  boolean
  disabled?: boolean
  type?:     'button' | 'submit' | 'reset'
}>(), {
  variant: 'default',
  size:    'md',
})
</script>
