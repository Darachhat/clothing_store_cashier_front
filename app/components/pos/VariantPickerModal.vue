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
        aria-labelledby="pos-variant-title"
        class="pos-focus bg-white rounded-xl border border-gray-200 w-full max-w-xl max-h-[calc(100dvh-32px)] flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <div class="px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-3 flex-shrink-0">
          <div class="flex flex-col leading-tight min-w-0">
            <span class="text-xs font-semibold text-gray-600 truncate">
              {{ modelValue.brand?.name || modelValue.category?.name || 'Catalogue' }}
            </span>
            <h3 id="pos-variant-title" class="text-base font-semibold text-gray-900 truncate">
              {{ modelValue.name }}
            </h3>
          </div>
          <button
            type="button"
            class="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close (Esc)"
            title="Close (Esc)"
            @click="$emit('update:modelValue', null)"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <!-- Variant list -->
        <div class="p-4 overflow-y-auto pos-scroll flex-1 flex flex-col gap-2">
          <p class="text-sm text-gray-600">Choose the colour and size to add to the order.</p>

          <ul class="flex flex-col gap-1.5">
            <li
              v-for="v in modelValue.variants"
              :key="v.id"
              class="flex items-stretch gap-1.5"
            >
              <button
                type="button"
                class="flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-left transition-colors"
                :class="getVariantStock(v.id) > 0
                  ? 'hover:bg-gray-50 hover:border-gray-400 cursor-pointer'
                  : 'bg-gray-50 cursor-not-allowed'"
                :disabled="getVariantStock(v.id) <= 0"
                :data-variant-option="v.id"
                :aria-label="`${v.color?.name || 'Standard'}, size ${v.size?.name || 'free'}, ${stockText(v.id)}, $${Number(v.selling_price).toFixed(2)}. Add to order`"
                @click="$emit('selectVariant', v)"
              >
                <!-- Colour + size -->
                <span class="flex items-center gap-2 min-w-[110px]">
                  <span
                    class="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                    :style="{ background: v.color?.hex_code || '#6B7280' }"
                  />
                  <span class="text-sm font-semibold text-gray-900 truncate">{{ v.color?.name || 'Standard' }}</span>
                </span>
                <span class="px-2 h-7 leading-7 rounded text-sm font-bold bg-gray-100 text-gray-900 min-w-[40px] text-center">
                  {{ v.size?.name || 'Free' }}
                </span>

                <!-- SKU / barcode -->
                <span class="hidden sm:flex flex-col text-xs font-mono text-gray-600 min-w-0 flex-1">
                  <span class="truncate">{{ v.sku }}</span>
                  <span v-if="v.barcode" class="truncate">{{ v.barcode }}</span>
                </span>

                <!-- Stock: text first, colour second -->
                <span
                  class="px-2 h-6 leading-6 rounded text-xs font-bold whitespace-nowrap"
                  :class="getVariantStock(v.id) <= 0
                    ? 'bg-red-50 text-red-800'
                    : getVariantStock(v.id) <= 10
                      ? 'bg-amber-50 text-amber-900'
                      : 'bg-emerald-50 text-emerald-900'"
                >
                  {{ stockText(v.id) }}
                </span>

                <span class="font-mono tabular-nums text-base font-bold text-gray-900 ml-auto">
                  ${{ Number(v.selling_price).toFixed(2) }}
                </span>
              </button>

              <button
                type="button"
                class="w-11 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                title="Print sticker for this variant"
                aria-label="Print sticker for this variant"
                @click="$emit('printSticker', { ...v, product: modelValue })"
              >
                <UIcon name="i-heroicons-tag" class="w-4 h-4" />
              </button>
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
import type { Product, ProductVariant } from '~/types/index'

const props = defineProps<{
  modelValue: Product | null
  getVariantStock: (variantId: string) => number
}>()

defineEmits<{
  'update:modelValue': [val: Product | null]
  'selectVariant': [variant: ProductVariant]
  'printSticker': [variant: ProductVariant]
}>()

const dialogEl = ref<HTMLElement | null>(null)

// Land on the first sellable variant so Enter adds it immediately.
useDialogFocus(
  toRef(() => Boolean(props.modelValue)),
  dialogEl,
  { initialFocus: () => dialogEl.value?.querySelector<HTMLElement>('[data-variant-option]:not([disabled])') },
)

function stockText(variantId: string): string {
  const s = props.getVariantStock(variantId)
  return s <= 0 ? 'Out of stock' : s <= 10 ? `${s} left` : `${s} in stock`
}
</script>
