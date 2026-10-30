<!-- AppModal — flat modal overlay, no shadows, structured borders -->
<template>
  <Teleport to="body">
    <Transition name="a-modal">
      <div
        v-if="modelValue"
        class="a-modal-overlay"
        @click.self="$emit('update:modelValue', false)"
      >
        <div
          class="a-modal"
          :class="`a-modal--${size}`"
          role="dialog"
          :aria-modal="true"
          :aria-label="title"
        >
          <!-- Header -->
          <div v-if="title || $slots.header" class="a-modal__header">
            <slot name="header">
              <span class="a-modal__title">{{ title }}</span>
            </slot>
            <button
              class="a-modal__close"
              aria-label="Close"
              @click="$emit('update:modelValue', false)"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="a-modal__body">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="a-modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md',
  title: '',
})

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style scoped>
.a-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.38);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.a-modal {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: calc(100dvh - 48px);
}

.a-modal--sm { width: 100%; max-width: 360px; }
.a-modal--md { width: 100%; max-width: 480px; }
.a-modal--lg { width: 100%; max-width: 640px; }

.a-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.a-modal__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.a-modal__close {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  cursor: pointer;
}

.a-modal__close:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.a-modal__body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.a-modal__footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
  background: var(--surface-bg);
}

/* Transition */
.a-modal-enter-active,
.a-modal-leave-active { transition: opacity 0.12s; }
.a-modal-enter-from,
.a-modal-leave-to { opacity: 0; }
.a-modal-enter-active .a-modal,
.a-modal-leave-active .a-modal { transition: transform 0.12s; }
.a-modal-enter-from .a-modal { transform: scale(0.97); }
.a-modal-leave-to .a-modal { transform: scale(0.97); }
</style>
