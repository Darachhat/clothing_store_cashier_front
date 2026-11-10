<!-- AppInput — flat input field, 8px grid, pure Tailwind -->
<template>
  <div :class="[block && 'w-full']">
    <div
      class="flex items-center h-9 border rounded-md bg-surface-card overflow-hidden transition-colors focus-within:border-border-default"
      :class="[
        error ? 'border-border-default bg-status-red-bg/20' : 'border-border-default hover:border-border-default',
        disabled && 'bg-surface-bg opacity-50 pointer-events-none'
      ]"
    >
      <slot name="prefix" />
      <input
        v-bind="$attrs"
        class="flex-1 h-full px-2.5 text-xs sm:text-sm text-ink placeholder:text-ink-tertiary bg-transparent border-none outline-none min-w-0"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :autocomplete="autocomplete"
        :autofocus="autofocus"
        :min="min"
        :max="max"
        :step="step"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keydown.enter="$emit('enter')"
      />
      <slot name="suffix" />
    </div>
    <p v-if="error" class="text-[11px] text-status-red mt-1 m-0">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  modelValue?: string | number
  type?:       string
  placeholder?: string
  disabled?:   boolean
  required?:   boolean
  autocomplete?: string
  autofocus?:  boolean
  block?:      boolean
  error?:      string
  min?:        string | number
  max?:        string | number
  step?:       string | number
}>(), {
  type: 'text',
})

defineEmits<{
  'update:modelValue': [value: string]
  'enter': []
}>()
</script>
