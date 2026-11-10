<!-- AppToast — flat toast notification stack, pure Tailwind -->
<template>
  <Teleport to="body">
    <div
      class="fixed top-3 right-3 left-3 sm:left-auto sm:top-5 sm:right-5 z-[99999] flex flex-col gap-2.5 pointer-events-none"
      aria-live="polite"
    >
      <TransitionGroup name="a-toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-start gap-2.5 w-full sm:w-auto sm:min-w-[290px] sm:max-w-[380px] p-3 sm:px-3.5 bg-surface-card border border-border-subtle rounded-md shadow-lg pointer-events-auto backdrop-blur-sm"
        >
          <div
            class="shrink-0 mt-0.5"
            :class="[
              toast.color === 'green' ? 'text-status-green' :
              toast.color === 'red' ? 'text-status-red' :
              toast.color === 'amber' ? 'text-status-amber' :
              'text-ink-secondary'
            ]"
          >
            <UIcon v-if="toast.color === 'green'" name="i-heroicons-check-circle" class="w-4 h-4" />
            <UIcon v-else-if="toast.color === 'red'" name="i-heroicons-x-circle" class="w-4 h-4" />
            <UIcon v-else-if="toast.color === 'amber'" name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
            <UIcon v-else name="i-heroicons-information-circle" class="w-4 h-4" />
          </div>

          <div class="flex-1 min-w-0 flex flex-col gap-0.5">
            <span class="text-xs sm:text-sm font-semibold text-ink leading-tight">{{ toast.title }}</span>
            <span v-if="toast.description" class="text-xs text-ink-secondary leading-snug">{{ toast.description }}</span>
          </div>

          <button
            class="shrink-0 text-ink-tertiary hover:text-ink hover:bg-surface-hover p-1 rounded transition-colors cursor-pointer"
            aria-label="Dismiss toast"
            @click="dismiss(toast.id)"
          >
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
