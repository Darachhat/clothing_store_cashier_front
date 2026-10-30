<!-- AppToast — flat toast notification stack, no Nuxt UI -->
<template>
  <Teleport to="body">
    <div class="a-toast-stack" aria-live="polite">
      <TransitionGroup name="a-toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="a-toast"
          :class="`a-toast--${toast.color || 'default'}`"
        >
          <div class="a-toast__icon">
            <UIcon v-if="toast.color === 'green'" name="i-heroicons-check-circle" class="w-4 h-4" />
            <UIcon v-else-if="toast.color === 'red'" name="i-heroicons-x-circle" class="w-4 h-4" />
            <UIcon v-else-if="toast.color === 'amber'" name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
            <UIcon v-else name="i-heroicons-information-circle" class="w-4 h-4" />
          </div>
          <div class="a-toast__content">
            <span class="a-toast__title">{{ toast.title }}</span>
            <span v-if="toast.description" class="a-toast__desc">{{ toast.description }}</span>
          </div>
          <button class="a-toast__dismiss" @click="dismiss(toast.id)">
            <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useAppToast } from '~/composables/useAppToast'

const { toasts, dismiss } = useAppToast()
</script>

<style scoped>
.a-toast-stack {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.a-toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 290px;
  max-width: 380px;
  padding: 12px 14px;
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 8px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
  pointer-events: all;
  backdrop-filter: blur(8px);
}

.a-toast--green   .a-toast__icon { color: var(--status-green, #10b981); }
.a-toast--red     .a-toast__icon { color: var(--status-red, #ef4444); }
.a-toast--amber   .a-toast__icon { color: var(--status-amber, #f59e0b); }
.a-toast--default .a-toast__icon { color: var(--text-secondary, #6b7280); }

.a-toast__icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.a-toast__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.a-toast__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.a-toast__desc {
  font-size: 12px;
  color: var(--text-secondary, #4b5563);
  line-height: 1.4;
}

.a-toast__dismiss {
  flex-shrink: 0;
  color: var(--text-tertiary, #9ca3af);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm, 4px);
  transition: all 0.15s;
}

.a-toast__dismiss:hover {
  color: var(--text-primary, #111827);
  background: var(--surface-hover, #f3f4f6);
}

/* Transitions */
.a-toast-enter-active,
.a-toast-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.a-toast-enter-from {
  opacity: 0;
  transform: translateY(-12px) scale(0.96);
}
.a-toast-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.96);
}
.a-toast-move {
  transition: transform 0.2s ease;
}
</style>
