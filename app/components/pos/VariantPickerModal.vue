<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      @click.self="$emit('update:modelValue', null)"
    >
      <div class="bg-white rounded-xl border border-gray-200 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <!-- Header -->
        <div class="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between gap-2">
          <div class="flex flex-col leading-tight">
            <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {{ modelValue.brand?.name || 'Catalog' }}
            </span>
            <h3 class="text-sm font-bold text-gray-900 leading-tight">
              {{ modelValue.name }}
            </h3>
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
        <div class="p-3.5 overflow-y-auto flex-1 flex flex-col gap-2 no-scrollbar">
          <p class="text-xs text-gray-500 font-medium">
            Select a Color &amp; Size variant to add to the order:
          </p>

          <div class="flex flex-col gap-1.5">
            <div
              v-for="v in modelValue.variants"
              :key="v.id"
              class="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50/70 transition-colors cursor-pointer group"
              :class="{ 'opacity-50 cursor-not-allowed bg-gray-50 hover:border-gray-200': getVariantStock(v.id) <= 0 }"
              @click="getVariantStock(v.id) > 0 && $emit('selectVariant', v)"
            >
              <!-- Color & Size -->
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2 min-w-[90px]">
                  <span
                    class="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                    :style="{ background: v.color?.hex_code || '#777' }"
                  />
                  <span class="text-xs font-semibold text-gray-800">
                    {{ v.color?.name || 'Standard' }}
                  </span>
                </div>

                <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200/50">
                  {{ v.size?.name || 'Free Size' }}
                </span>
              </div>

              <!-- SKU & Barcode -->
              <div class="hidden sm:flex flex-col text-[11px] font-mono text-gray-400">
                <span>{{ v.sku }}</span>
                <span v-if="v.barcode" class="text-[10px] text-gray-300">{{ v.barcode }}</span>
              </div>

              <!-- Stock Pill -->
              <div class="flex items-center">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold border border-transparent"
                  :class="getVariantStock(v.id) <= 0
                    ? 'bg-rose-50 text-rose-700'
                    : getVariantStock(v.id) <= 10
                      ? 'bg-amber-50 text-amber-800'
                      : 'bg-emerald-50 text-emerald-800'"
                >
                  {{ getVariantStock(v.id) > 0 ? `${getVariantStock(v.id)} in stock` : 'Out of stock' }}
                </span>
              </div>

              <!-- Price, Print Sticker & Add Button -->
              <div class="flex items-center gap-2">
                <span class="font-mono text-sm font-bold text-gray-900">
                  ${{ Number(v.selling_price).toFixed(2) }}
                </span>
                <button
                  type="button"
                  class="w-7 h-7 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
                  title="Print Product Sticker for this Variant"
                  @click.stop="$emit('printSticker', { ...v, product: modelValue })"
                >
                  <UIcon name="i-heroicons-tag" class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer border border-transparent shadow-xs"
                  :disabled="getVariantStock(v.id) <= 0"
                  @click.stop="getVariantStock(v.id) > 0 && $emit('selectVariant', v)"
                >
                  <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: any
  getVariantStock: (variantId: string) => number
}>()

defineEmits<{
  'update:modelValue': [val: any]
  'selectVariant': [variant: any]
  'printSticker': [variant: any]
}>()
</script>
