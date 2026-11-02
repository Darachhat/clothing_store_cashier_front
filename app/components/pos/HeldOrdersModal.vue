<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4"
      @click.self="$emit('update:modelValue', false)"
    >
      <div
        ref="dialogEl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-held-title"
        class="pos-focus bg-white rounded-xl border border-gray-200 w-full max-w-lg max-h-[calc(100dvh-32px)] flex flex-col overflow-hidden"
      >
        <div class="px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-3 flex-shrink-0">
          <div class="flex flex-col leading-tight">
            <h3 id="pos-held-title" class="text-base font-semibold text-gray-900">Parked orders</h3>
            <p class="text-sm text-gray-600">Resume an order that was set aside</p>
          </div>
          <button
            type="button"
            class="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close parked orders"
            @click="$emit('update:modelValue', false)"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <div class="p-4 overflow-y-auto pos-scroll flex-1 flex flex-col gap-2.5">
          <!-- Empty -->
          <div
            v-if="heldCarts.length === 0"
            class="flex flex-col items-center justify-center text-center py-10 text-gray-600"
          >
            <UIcon name="i-heroicons-pause-circle" class="w-10 h-10 text-gray-400 mb-2" />
            <h4 class="text-base font-semibold text-gray-900 mb-1">No parked orders</h4>
            <p class="text-sm max-w-xs">
              Use <strong class="text-gray-900">Park</strong> (F9) in the order panel when a customer steps away. The order will wait here.
            </p>
          </div>

          <!-- List -->
          <ul v-else class="flex flex-col gap-2">
            <li
              v-for="held in heldCarts"
              :key="held.id"
              class="flex items-center justify-between gap-3 p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-semibold text-gray-900 truncate">{{ held.name }}</span>
                <span class="flex items-center gap-1.5 text-sm text-gray-600 flex-wrap">
                  <span class="font-medium text-gray-800">{{ held.cart?.length || 0 }} lines</span>
                  <span aria-hidden="true">&bull;</span>
                  <span>{{ formatTimeAgo(held.heldAt) }}</span>
                  <template v-if="held.customerName">
                    <span aria-hidden="true">&bull;</span>
                    <span class="truncate">{{ held.customerName }}</span>
                  </template>
                </span>
              </div>

              <div class="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  class="h-10 px-4 bg-gray-900 text-white rounded-md text-sm font-semibold hover:bg-gray-700 transition-colors cursor-pointer"
                  @click="$emit('resume', held.id)"
                >
                  Resume
                </button>
                <!-- Discarding is irreversible: two-step, inline (no extra dialog) -->
                <button
                  v-if="confirmDiscardId !== held.id"
                  type="button"
                  class="h-10 px-3 rounded-md text-sm font-semibold border border-gray-300 text-gray-700 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  @click="confirmDiscardId = held.id"
                >
                  Discard
                </button>
                <button
                  v-else
                  type="button"
                  class="h-10 px-3 rounded-md text-sm font-bold bg-red-700 text-white hover:bg-red-800 transition-colors cursor-pointer"
                  @click="confirmDiscardId = null; $emit('discard', held.id)"
                  @blur="confirmDiscardId = null"
                >
                  Confirm discard
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useDialogFocus } from '~/composables/useDialogFocus'
import type { HeldCart } from '~/types/pos'

const props = defineProps<{
  modelValue: boolean
  heldCarts: HeldCart[]
  formatTimeAgo: (isoString: string) => string
}>()

defineEmits<{
  'update:modelValue': [val: boolean]
  'resume': [id: string]
  'discard': [id: string]
}>()

const dialogEl = ref<HTMLElement | null>(null)
const confirmDiscardId = ref<string | null>(null)

useDialogFocus(toRef(props, 'modelValue'), dialogEl)
</script>
