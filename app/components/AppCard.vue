<!-- AppCard — flat white surface, 8px grid, 1px border -->
<template>
  <div class="a-card" :class="[noPad && 'a-card--no-pad', flush && 'a-card--flush']">
    <div v-if="$slots.header" class="a-card__header">
      <slot name="header" />
    </div>
    <div class="a-card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="a-card__footer">
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

<style scoped>
.a-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.a-card--flush {
  border-radius: 0;
  border-left: none;
  border-right: none;
}
.a-card--no-pad .a-card__body {
  padding: 0;
}
.a-card__header {
  padding: 16px 20px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 12px;
}
.a-card__body {
  padding: 20px;
}
.a-card__footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-bg);
}
</style>
