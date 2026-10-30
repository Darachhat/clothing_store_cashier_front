<!-- AppBadge — compact status chip, muted semantic colors -->
<template>
  <span class="a-badge" :class="`a-badge--${color}`">
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  color?: 'default' | 'green' | 'amber' | 'red' | 'blue'
}>(), {
  color: 'default',
})
</script>

<style scoped>
.a-badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.a-badge--default {
  background: var(--surface-active);
  color: var(--text-secondary);
}
.a-badge--green {
  background: var(--status-green-bg);
  color: var(--status-green);
}
.a-badge--amber {
  background: var(--status-amber-bg);
  color: var(--status-amber);
}
.a-badge--red {
  background: var(--status-red-bg);
  color: var(--status-red);
}
.a-badge--blue {
  background: var(--status-blue-bg);
  color: var(--status-blue);
}
</style>
