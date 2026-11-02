<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4"
      @click.self="$emit('update:modelValue', null)"
    >
      <div
        ref="dialogEl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-linedisc-title"
        class="pos-focus bg-white rounded-xl border border-gray-200 w-full max-w-sm overflow-hidden"
      >
        <div class="px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
          <div class="flex flex-col leading-tight min-w-0">
            <h3 id="pos-linedisc-title" class="text-base font-semibold text-gray-900">Line discount</h3>
            <p class="text-sm text-gray-600 truncate">
              {{ modelValue.variant?.product?.name || 'Selected item' }} &bull; line value ${{ lineValue.toFixed(2) }}
            </p>
          </div>
          <button
            type="button"
            class="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close"
            @click="$emit('update:modelValue', null)"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <div class="px-5 py-4 flex flex-col gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="pos-linedisc-input" class="text-sm font-semibold text-gray-900">Discount amount ($)</label>
            <div class="relative flex items-center">
              <span class="absolute left-3 text-lg font-bold font-mono text-gray-600 pointer-events-none">$</span>
              <input
                id="pos-linedisc-input"
                ref="inputEl"
                :value="discountInput"
                type="number"
                step="0.5"
                min="0"
                inputmode="decimal"
                :aria-invalid="tooLarge"
                aria-describedby="pos-linedisc-help"
                class="w-full h-12 bg-white border border-gray-300 rounded-lg pl-8 pr-3 text-xl font-bold font-mono tabular-nums text-gray-900 focus:border-gray-500"
                @input="$emit('update:discountInput', Number(($event.target as HTMLInputElement).value))"
                @focus="(e: FocusEvent) => (e.target as HTMLInputElement).select()"
                @keydown.enter.prevent="submit"
              >
            </div>
            <p id="pos-linedisc-help" class="text-sm" :class="tooLarge ? 'text-red-700 font-semibold' : 'text-gray-600'">
              {{ tooLarge ? `Cannot exceed the line value ($${lineValue.toFixed(2)})` : 'Applies to this line only.' }}
            </p>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button
              v-for="amt in [1, 2, 5, 10]"
              :key="amt"
              type="button"
              class="h-9 px-3 rounded-md text-sm font-semibold bg-white hover:bg-gray-100 text-gray-900 transition-colors cursor-pointer border border-gray-300 tabular-nums"
              @click="$emit('update:discountInput', amt)"
            >
              ${{ amt }} off
            </button>
            <button
              type="button"
              class="h-9 px-3 rounded-md text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors cursor-pointer border border-gray-300"
              @click="$emit('update:discountInput', 0)"
            >
              Remove discount
            </button>
          </div>
        </div>

        <div class="px-5 py-3 border-t border-gray-200 flex items-center gap-2.5 bg-gray-50">
          <button
            type="button"
            class="h-11 px-4 rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-100 text-sm font-semibold transition-colors cursor-pointer"
            @click="$emit('update:modelValue', null)"
          >
            Cancel
          </button>
          <button
            type="button"
            class="h-11 flex-1 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
            :disabled="tooLarge"
            @click="submit"
          >
            Apply discount
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useDialogFocus } from '~/composables/useDialogFocus'
import type { CartItem } from '~/types/pos'

const props = defineProps<{
  modelValue: CartItem | null
  discountInput: number
}>()

const emit = defineEmits<{
  'update:modelValue': [val: CartItem | null]
  'update:discountInput': [val: number]
  'apply': []
}>()

const dialogEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)

useDialogFocus(toRef(() => Boolean(props.modelValue)), dialogEl, { initialFocus: () => inputEl.value })

const lineValue = computed(() =>
  props.modelValue ? Number(props.modelValue.unit_price) * Number(props.modelValue.quantity) : 0,
)
const tooLarge = computed(() => Number(props.discountInput) > Number(lineValue.value.toFixed(2)))

function submit() {
  if (!tooLarge.value) emit('apply')
}
</script>
