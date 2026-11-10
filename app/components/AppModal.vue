<!-- AppModal — flat modal overlay, pure Tailwind -->
<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-ink/40 z-[200] flex items-center justify-center p-3 sm:p-6 backdrop-blur-[1px]"
        @click.self="$emit('update:modelValue', false)"
      >
        <div
          class="bg-surface-card border border-border-subtle rounded-xl flex flex-col overflow-hidden max-h-[calc(100dvh-48px)] shadow-xl w-full"
          :class="[
            size === 'sm' ? 'max-w-[360px]' :
            size === 'lg' ? 'max-w-[640px]' :
            'max-w-[480px]'
          ]"
          role="dialog"
          :aria-modal="true"
          :aria-label="title"
        >
          <!-- Header -->
          <div v-if="title || $slots.header" class="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-border-subtle shrink-0">
            <slot name="header">
              <span class="text-sm font-semibold text-ink tracking-tight">{{ title }}</span>
            </slot>
            <button
              type="button"
              class="w-7 h-7 rounded flex items-center justify-center text-ink-tertiary hover:bg-surface-hover hover:text-ink cursor-pointer transition-colors"
              aria-label="Close"
              @click="$emit('update:modelValue', false)"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="p-4 sm:p-5 overflow-y-auto flex-1">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-4 sm:px-5 py-3 border-t border-border-subtle flex items-center justify-end gap-2 shrink-0 bg-surface-bg">
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
