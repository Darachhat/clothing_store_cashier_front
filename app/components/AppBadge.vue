<!-- AppBadge — compact status chip, muted semantic colors, pure Tailwind -->
<template>
  <span
    class="inline-flex items-center h-5 px-1.5 rounded text-[11px] font-semibold tracking-wide border border-border-subtle"
    :class="[
      (color === 'green' || color === 'emerald') ? 'bg-status-green-bg text-status-green' :
      (color === 'amber' || color === 'orange')  ? 'bg-status-amber-bg text-status-amber' :
      (color === 'red')                          ? 'bg-status-red-bg text-status-red' :
      (color === 'blue' || color === 'cyan' || color === 'purple' || color === 'primary') ? 'bg-status-blue-bg text-status-blue' :
      'bg-surface-active text-ink-secondary'
    ]"
  >
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  color?: 'default' | 'green' | 'emerald' | 'amber' | 'orange' | 'red' | 'blue' | 'cyan' | 'purple' | 'gray' | 'primary' | string
}>(), {
  color: 'default',
})
</script>
