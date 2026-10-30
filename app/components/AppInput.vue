<!-- AppInput — flat input field, 8px grid -->
<template>
  <div class="a-input-wrap" :class="[block && 'a-input-wrap--block']">
    <div class="a-input-inner" :class="[disabled && 'is-disabled', modelValue && 'has-value']">
      <slot name="prefix" />
      <input
        v-bind="$attrs"
        class="a-input"
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
    <p v-if="error" class="a-input-error">{{ error }}</p>
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

<style scoped>
.a-input-wrap--block { width: 100%; }

.a-input-inner {
  display: flex;
  align-items: center;
  height: 36px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  overflow: hidden;
  transition: border-color 0.1s;
}

.a-input-inner:focus-within {
  border-color: var(--border-strong);
}

.a-input-inner.is-disabled {
  background: var(--surface-bg);
  opacity: 0.5;
}

.a-input {
  flex: 1;
  height: 100%;
  padding: 0 10px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;
  min-width: 0;
}

.a-input::placeholder { color: var(--text-tertiary); }

.a-input-error {
  font-size: 11px;
  color: var(--status-red);
  margin-top: 4px;
  max-width: none;
}
</style>
