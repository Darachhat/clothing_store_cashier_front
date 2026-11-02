<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4"
      @click.self="$emit('update:modelValue', false)"
    >
      <div
        ref="dialogEl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="pos-clear-title"
        aria-describedby="pos-clear-desc"
        class="pos-focus bg-white rounded-xl border border-gray-200 w-full max-w-sm overflow-hidden"
      >
        <div class="px-5 pt-4 pb-3 flex items-start gap-3">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-700 flex-shrink-0 mt-0.5" />
          <div class="flex flex-col">
            <h3 id="pos-clear-title" class="text-base font-semibold text-gray-900">Clear this order?</h3>
            <p id="pos-clear-desc" class="text-sm text-gray-600 mt-1">
              All {{ itemCount }} item{{ itemCount !== 1 ? 's' : '' }} will be removed, together with the customer, promo code and discounts.
              Use <strong class="text-gray-900">Park</strong> instead if you want to come back to it.
            </p>
          </div>
        </div>

        <div class="px-5 py-3 flex items-center gap-2.5 bg-gray-50">
          <!-- Safe action is first and is the default focus -->
          <button
            ref="keepEl"
            type="button"
            class="flex-1 h-11 rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 text-sm font-semibold transition-colors cursor-pointer"
            @click="$emit('update:modelValue', false)"
          >
            Keep order
          </button>
          <button
            type="button"
            class="flex-1 h-11 bg-red-700 text-white rounded-lg text-sm font-bold hover:bg-red-800 transition-colors cursor-pointer"
            @click="$emit('confirm')"
          >
            Clear all items
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useDialogFocus } from '~/composables/useDialogFocus'

const props = defineProps<{
  modelValue: boolean
  itemCount: number
}>()

defineEmits<{
  'update:modelValue': [val: boolean]
  'confirm': []
}>()

const dialogEl = ref<HTMLElement | null>(null)
const keepEl = ref<HTMLElement | null>(null)

// Default focus lands on the non-destructive choice.
useDialogFocus(toRef(props, 'modelValue'), dialogEl, { initialFocus: () => keepEl.value })
</script>
