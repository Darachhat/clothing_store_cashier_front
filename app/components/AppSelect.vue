<!-- AppSelect — flat native select with UIcon, pure Tailwind -->
<template>
  <div class="relative" :class="[block && 'w-full']">
    <select
      v-bind="$attrs"
      class="w-full h-9 pl-2.5 pr-8 text-xs sm:text-sm font-medium text-ink bg-surface-card border border-border-default rounded-md appearance-none outline-none cursor-pointer hover:border-border-default focus:border-border-default transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      :value="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled :selected="!modelValue">{{ placeholder }}</option>
      <option
        v-for="opt in options"
        :key="String(typeof opt === 'object' ? opt.value : opt)"
        :value="typeof opt === 'object' ? opt.value : opt"
      >
        {{ typeof opt === 'object' ? opt.label : opt }}
      </option>
    </select>
    <UIcon
      name="i-heroicons-chevron-down"
      class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary pointer-events-none"
    />
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  modelValue?: string | number | boolean | null
  options: Array<{ label: string; value: string | number | boolean } | string>
  placeholder?: string
  disabled?: boolean
  block?: boolean
}>(), {
  block: false,
})

defineEmits<{
  'update:modelValue': [value: any]
}>()
</script>
