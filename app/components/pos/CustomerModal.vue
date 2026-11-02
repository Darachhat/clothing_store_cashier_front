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
        aria-labelledby="pos-customer-title"
        class="pos-focus bg-white rounded-xl border border-gray-200 w-full max-w-xl max-h-[calc(100dvh-32px)] flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <div class="px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-3 flex-shrink-0">
          <div class="flex flex-col leading-tight">
            <h3 id="pos-customer-title" class="text-base font-semibold text-gray-900">Customer</h3>
            <p class="text-sm text-gray-600">Find a loyalty customer or register a new one</p>
          </div>
          <button
            type="button"
            class="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close customer dialog"
            @click="$emit('update:modelValue', false)"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <div class="p-4 overflow-y-auto pos-scroll flex-1 flex flex-col gap-3">
          <!-- Search + new customer -->
          <div class="flex items-center gap-2">
            <div class="relative flex-1 flex items-center">
              <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none" />
              <input
                ref="searchEl"
                :value="searchQuery"
                type="text"
                autocomplete="off"
                aria-label="Search customers by name, phone or code"
                class="w-full h-10 bg-gray-50 focus:bg-white border border-gray-200 focus:border-gray-400 rounded-lg pl-9 pr-3 text-sm placeholder-gray-500 transition-colors"
                placeholder="Name, phone or customer code"
                @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value); $emit('search')"
                @keydown.enter.prevent="selectOnlyResult"
              >
            </div>
            <button
              type="button"
              class="px-3 h-10 rounded-lg text-sm font-semibold border border-gray-300 text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              :aria-expanded="showNewDrawer"
              @click="$emit('toggleNewDrawer')"
            >
              <UIcon :name="showNewDrawer ? 'i-heroicons-x-mark' : 'i-heroicons-plus'" class="w-4 h-4" />
              {{ showNewDrawer ? 'Cancel' : 'New customer' }}
            </button>
          </div>

          <!-- Quick register -->
          <form
            v-if="showNewDrawer"
            class="p-3.5 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-3"
            @submit.prevent="newCustomerForm.name.trim() && $emit('createCustomer')"
          >
            <div class="text-sm font-semibold text-gray-900">Register customer</div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div class="flex flex-col gap-1">
                <label for="pos-newcust-name" class="text-sm font-medium text-gray-800">Name <span class="text-red-700">*</span></label>
                <input
                  id="pos-newcust-name"
                  :value="newCustomerForm.name"
                  required
                  class="h-10 bg-white border border-gray-300 rounded-lg px-3 text-sm focus:border-gray-500"
                  @input="$emit('update:newCustomerForm', { ...newCustomerForm, name: ($event.target as HTMLInputElement).value })"
                >
              </div>
              <div class="flex flex-col gap-1">
                <label for="pos-newcust-phone" class="text-sm font-medium text-gray-800">Phone</label>
                <input
                  id="pos-newcust-phone"
                  :value="newCustomerForm.phone"
                  inputmode="tel"
                  placeholder="+855…"
                  class="h-10 bg-white border border-gray-300 rounded-lg px-3 text-sm placeholder-gray-500 focus:border-gray-500"
                  @input="$emit('update:newCustomerForm', { ...newCustomerForm, phone: ($event.target as HTMLInputElement).value })"
                >
              </div>
              <div class="flex flex-col gap-1">
                <label for="pos-newcust-email" class="text-sm font-medium text-gray-800">Email</label>
                <input
                  id="pos-newcust-email"
                  :value="newCustomerForm.email"
                  type="email"
                  class="h-10 bg-white border border-gray-300 rounded-lg px-3 text-sm focus:border-gray-500"
                  @input="$emit('update:newCustomerForm', { ...newCustomerForm, email: ($event.target as HTMLInputElement).value })"
                >
              </div>
            </div>
            <div class="flex justify-end">
              <button
                type="submit"
                class="px-4 h-10 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
                :disabled="!newCustomerForm.name.trim()"
              >
                Save &amp; attach to order
              </button>
            </div>
          </form>

          <!-- Results -->
          <ul class="flex flex-col gap-1.5" aria-label="Customers">
            <li>
              <button
                type="button"
                class="w-full flex items-center justify-between gap-3 p-3 rounded-lg border text-left transition-colors cursor-pointer"
                :class="!selectedCustomerId ? 'bg-gray-100 border-gray-400' : 'bg-white border-gray-200 hover:bg-gray-50'"
                :aria-current="!selectedCustomerId"
                @click="$emit('selectCustomer', null)"
              >
                <span class="flex items-center gap-3">
                  <span class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 flex-shrink-0">
                    <UIcon name="i-heroicons-user" class="w-4 h-4" />
                  </span>
                  <span class="flex flex-col">
                    <span class="text-sm font-semibold text-gray-900">Walk-in customer</span>
                    <span class="text-sm text-gray-600">No customer attached, no loyalty points</span>
                  </span>
                </span>
                <span v-if="!selectedCustomerId" class="text-sm font-semibold text-gray-900 flex items-center gap-1">
                  <UIcon name="i-heroicons-check" class="w-4 h-4" /> Current
                </span>
              </button>
            </li>

            <li v-for="c in searchResults" :key="c.id">
              <button
                type="button"
                class="w-full flex items-center justify-between gap-3 p-3 rounded-lg border text-left transition-colors cursor-pointer"
                :class="selectedCustomerId === c.id ? 'bg-gray-100 border-gray-400' : 'bg-white border-gray-200 hover:bg-gray-50'"
                :aria-current="selectedCustomerId === c.id"
                @click="$emit('selectCustomer', c)"
              >
                <span class="flex items-center gap-3 min-w-0">
                  <span class="w-9 h-9 rounded-full bg-gray-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {{ c.name.slice(0, 2).toUpperCase() }}
                  </span>
                  <span class="flex flex-col min-w-0">
                    <span class="flex items-center gap-2 min-w-0">
                      <span class="text-sm font-semibold text-gray-900 truncate">{{ c.name }}</span>
                      <span v-if="c.customer_code" class="px-1.5 h-5 leading-5 rounded text-xs font-mono bg-gray-100 text-gray-700">
                        {{ c.customer_code }}
                      </span>
                    </span>
                    <span class="flex items-center gap-3 text-sm text-gray-600 truncate">
                      <span class="flex items-center gap-1">
                        <UIcon name="i-heroicons-phone" class="w-3.5 h-3.5" />
                        {{ c.phone || 'No phone' }}
                      </span>
                      <span v-if="c.loyalty_account" class="flex items-center gap-1 text-amber-800 font-medium">
                        <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5" />
                        {{ c.loyalty_account.tier }} &bull; {{ c.loyalty_account.points_balance }} pts
                      </span>
                    </span>
                  </span>
                </span>
                <span class="text-sm font-semibold text-gray-900 flex items-center gap-1 flex-shrink-0">
                  <template v-if="selectedCustomerId === c.id"><UIcon name="i-heroicons-check" class="w-4 h-4" /> Current</template>
                  <template v-else>Select</template>
                </span>
              </button>
            </li>

            <li v-if="searchQuery.trim() && searchResults.length === 0" class="text-sm text-gray-600 px-1 py-2">
              No customer matches &ldquo;{{ searchQuery }}&rdquo;. Use <strong class="text-gray-900">New customer</strong> to register them.
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
import type { CustomerSummary } from '~/types/pos'

const props = defineProps<{
  modelValue: boolean
  searchQuery: string
  searchResults: CustomerSummary[]
  selectedCustomerId?: string | null
  showNewDrawer: boolean
  newCustomerForm: { name: string; phone: string; email: string }
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'update:searchQuery': [val: string]
  'update:newCustomerForm': [val: { name: string; phone: string; email: string }]
  'search': []
  'toggleNewDrawer': []
  'createCustomer': []
  'selectCustomer': [customer: CustomerSummary | null]
}>()

const dialogEl = ref<HTMLElement | null>(null)
const searchEl = ref<HTMLInputElement | null>(null)

useDialogFocus(toRef(props, 'modelValue'), dialogEl, { initialFocus: () => searchEl.value })

/** Enter in the search box attaches the customer when the search narrowed it down to exactly one. */
function selectOnlyResult() {
  if (props.searchResults.length === 1 && props.searchResults[0]) {
    emit('selectCustomer', props.searchResults[0])
  }
}
</script>
