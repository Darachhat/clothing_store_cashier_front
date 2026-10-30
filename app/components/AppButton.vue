<!-- AppButton — flat structural button, 8px grid -->
<template>
  <component
    :is="to ? (external ? 'a' : resolveComponent('NuxtLink')) : 'button'"
    class="a-btn"
    :class="[
      `a-btn--${variant}`,
      `a-btn--${size}`,
      block && 'a-btn--block',
      loading && 'a-btn--loading',
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
      class="a-btn__spinner w-3.5 h-3.5"
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

<style scoped>
.a-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  text-decoration: none;
  border: 1px solid var(--border-default);
  transition: background 0.1s, border-color 0.1s, opacity 0.1s;
  position: relative;
}

/* Sizes */
.a-btn--sm  { height: 28px; padding: 0 10px; font-size: 12px; }
.a-btn--md  { height: 32px; padding: 0 14px; font-size: 13px; }
.a-btn--lg  { height: 40px; padding: 0 18px; font-size: 14px; }

/* Variants */
.a-btn--default {
  background: var(--surface-card);
  color: var(--text-primary);
  border-color: var(--border-default);
}
.a-btn--default:hover:not(:disabled) {
  background: var(--surface-hover);
  border-color: var(--border-strong);
}

.a-btn--primary {
  background: var(--accent);
  color: var(--accent-fg);
  border-color: var(--accent);
}
.a-btn--primary:hover:not(:disabled) { opacity: 0.88; }

.a-btn--danger {
  background: var(--surface-card);
  color: var(--status-red);
  border-color: var(--border-default);
}
.a-btn--danger:hover:not(:disabled) {
  background: var(--status-red-bg);
  border-color: var(--status-red);
}

.a-btn--ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: transparent;
}
.a-btn--ghost:hover:not(:disabled) {
  background: var(--surface-hover);
  color: var(--text-primary);
}

/* Modifiers */
.a-btn--block { width: 100%; }
.a-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Spinner */
.a-btn__spinner { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
