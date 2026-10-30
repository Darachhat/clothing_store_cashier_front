<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      @click.self="$emit('update:modelValue', null)"
    >
      <div class="bg-white rounded-xl border border-gray-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <!-- Header -->
        <div class="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
          <div class="flex flex-col leading-tight">
            <h3 class="text-sm font-bold text-gray-900">Line Item Discount</h3>
            <p class="text-xs text-gray-400 truncate max-w-[240px]">
              {{ modelValue.variant?.product?.name || 'Selected item' }}
            </p>
          </div>
          <button
            type="button"
            class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            @click="$emit('update:modelValue', null)"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-4 flex flex-col gap-2.5">
          <label class="text-[11px] font-semibold text-gray-700">Discount Amount ($)</label>
          <div class="relative flex items-center">
            <span class="absolute left-3 text-sm font-bold font-mono text-gray-400 pointer-events-none">$</span>
            <input
              :value="discountInput"
              type="number"
              step="0.5"
              min="0"
              class="w-full h-9 bg-white border border-gray-200 rounded-lg pl-7 pr-3 text-sm font-bold font-mono outline-none focus:border-gray-400"
              @input="$emit('update:discountInput', Number(($event.target as HTMLInputElement).value))"
              @keydown.enter="$emit('apply')"
            />
          </div>

          <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
            <button
              v-for="amt in [1, 2, 5, 10]"
              :key="amt"
              type="button"
              class="h-7 px-2.5 rounded-md text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors cursor-pointer border border-gray-200"
              @click="$emit('update:discountInput', amt)"
            >
              ${{ amt }} Off
            </button>
            <button
              type="button"
              class="h-7 px-2.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer border border-gray-200"
              @click="$emit('update:discountInput', 0)"
            >
              Clear
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-2.5 border-t border-gray-200 flex items-center gap-2 bg-gray-50">
          <button
            type="button"
            class="h-8 px-3 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-colors cursor-pointer"
            @click="$emit('update:modelValue', null)"
          >
            Cancel
          </button>
          <button
            type="button"
            class="h-8 flex-1 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer border border-transparent"
            @click="$emit('apply')"
          >
            Apply Discount
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: any
  discountInput: number
}>()

defineEmits<{
  'update:modelValue': [val: any]
  'update:discountInput': [val: number]
  'apply': []
}>()
</script>
