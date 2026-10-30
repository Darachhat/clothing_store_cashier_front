<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      @click.self="$emit('update:modelValue', false)"
    >
      <div class="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <!-- Header -->
        <div class="px-4 py-3 border-b border-gray-200 flex items-start justify-between">
          <div class="flex flex-col">
            <h3 class="text-sm font-bold text-gray-900">Clear Current Order?</h3>
            <p class="text-xs text-gray-500 mt-0.5">
              This will remove all {{ itemCount }} item{{ itemCount !== 1 ? 's' : '' }} from the order.
            </p>
          </div>
          <button
            type="button"
            class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            @click="$emit('update:modelValue', false)"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          </button>
        </div>

        <!-- Footer -->
        <div class="px-4 py-2.5 flex items-center gap-2 bg-gray-50">
          <button
            type="button"
            class="flex-1 h-8 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-colors cursor-pointer"
            @click="$emit('update:modelValue', false)"
          >
            Keep Order
          </button>
          <button
            type="button"
            class="flex-1 h-8 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 active:scale-[0.99] transition-all cursor-pointer border border-transparent shadow-xs"
            @click="$emit('confirm')"
          >
            Clear All Items
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  itemCount: number
}>()

defineEmits<{
  'update:modelValue': [val: boolean]
  'confirm': []
}>()
</script>
