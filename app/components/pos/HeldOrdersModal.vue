<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      @click.self="$emit('update:modelValue', false)"
    >
      <div class="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <!-- Header -->
        <div class="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
          <div class="flex flex-col">
            <h3 class="text-sm font-bold text-gray-900">Parked Orders</h3>
            <p class="text-[11px] text-gray-500">Hold or resume transactions paused for customers</p>
          </div>
          <button
            type="button"
            class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            @click="$emit('update:modelValue', false)"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-4 overflow-y-auto flex-1 flex flex-col gap-2.5 no-scrollbar">
          <!-- Empty State -->
          <div
            v-if="heldCarts.length === 0"
            class="flex flex-col items-center justify-center text-center py-10 text-gray-400"
          >
            <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2 border border-gray-200">
              <UIcon name="i-heroicons-pause-circle" class="w-5 h-5 text-gray-400" />
            </div>
            <h4 class="text-xs font-semibold text-gray-800 mb-0.5">No parked orders</h4>
            <p class="text-[11px] text-gray-500 max-w-xs">
              When a customer steps away, click &ldquo;Hold [F9]&rdquo; in the cart to park their order here.
            </p>
          </div>

          <!-- Held List -->
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="held in heldCarts"
              :key="held.id"
              class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all shadow-2xs"
            >
              <div class="flex flex-col min-w-0 pr-3">
                <span class="text-xs font-bold text-gray-900 truncate">{{ held.name }}</span>
                <div class="flex items-center gap-1.5 text-[11px] text-gray-500 flex-wrap">
                  <span class="font-medium text-gray-700">{{ held.cart?.length || 0 }} items</span>
                  <span>&bull;</span>
                  <span>Held {{ formatTimeAgo(held.heldAt) }}</span>
                  <span v-if="held.customerName" class="text-gray-600 font-medium">&bull; {{ held.customerName }}</span>
                </div>
              </div>

              <div class="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  class="px-3 h-7 bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-gray-800 transition-colors cursor-pointer border border-transparent shadow-2xs"
                  @click="$emit('resume', held.id)"
                >
                  Resume
                </button>
                <button
                  type="button"
                  class="px-2.5 h-7 rounded-md text-xs font-medium border border-gray-200 text-gray-600 hover:text-rose-600 hover:bg-rose-50 hover:border-gray-300 transition-colors cursor-pointer"
                  @click="$emit('discard', held.id)"
                >
                  Discard
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
  modelValue: boolean
  heldCarts: any[]
  formatTimeAgo: (isoString: string) => string
}>()

defineEmits<{
  'update:modelValue': [val: boolean]
  'resume': [id: string]
  'discard': [id: string]
}>()
</script>
