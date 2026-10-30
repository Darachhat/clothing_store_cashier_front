<!-- AppSelect — flat native select, custom chevron -->
<template>
  <div class="a-select-wrap" :class="[block && 'a-select-wrap--block']">
    <select
      v-bind="$attrs"
      class="a-select"
      :value="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled :selected="!modelValue">{{ placeholder }}</option>
      <option
        v-for="opt in options"
        :key="typeof opt === 'object' ? opt.value : opt"
        :value="typeof opt === 'object' ? opt.value : opt"
      >
        {{ typeof opt === 'object' ? opt.label : opt }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  modelValue?: string | number | null
  options: Array<{ label: string; value: string | number } | string>
  placeholder?: string
  disabled?: boolean
  block?: boolean
}>(), {
  block: false,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
.a-select-wrap--block { width: 100%; }

.a-select {
  display: block;
  height: 36px;
  width: 100%;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 0 32px 0 10px;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  background: var(--surface-card);
  cursor: pointer;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%239E9E9E' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  transition: border-color 0.1s;
}

.a-select:focus { border-color: var(--border-strong); }
.a-select:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
