<!-- AppCard — flat white surface, 8px grid, 1px border, pure Tailwind -->
<template>
  <div
    class="bg-surface-card border border-border-subtle overflow-hidden"
    :class="flush ? 'rounded-none border-x-0' : 'rounded-lg'"
  >
    <div v-if="$slots.header" class="px-5 pt-4 pb-3 text-xs sm:text-sm font-semibold text-ink tracking-tight border-b border-border-subtle">
      <slot name="header" />
    </div>
    <div :class="noPad ? 'p-0' : 'p-4 sm:p-5'">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-5 py-3 border-t border-border-subtle bg-surface-bg">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  noPad?: boolean
  flush?: boolean  // no border-radius, edge-to-edge
}>()
</script>
