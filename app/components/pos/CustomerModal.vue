<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      @click.self="$emit('update:modelValue', false)"
    >
      <div class="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <!-- Header -->
        <div class="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
          <div class="flex flex-col">
            <h3 class="text-sm font-bold text-gray-900">Assign Customer</h3>
            <p class="text-[11px] text-gray-500">Search loyalty accounts or register a new customer</p>
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
        <div class="p-4 overflow-y-auto flex-1 flex flex-col gap-3 no-scrollbar">
          <!-- Search Bar & New Customer Toggle -->
          <div class="flex items-center gap-2">
            <div class="relative flex-1 flex items-center">
              <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-400 absolute left-2.5 pointer-events-none" />
              <input
                :value="searchQuery"
                class="w-full h-8 bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 text-xs outline-none transition-colors focus:bg-white focus:border-gray-900"
                placeholder="Search by name, phone, or customer code..."
                @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value); $emit('search')"
              />
            </div>
            <button
              type="button"
              class="px-3 h-8 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
              @click="$emit('toggleNewDrawer')"
            >
              {{ showNewDrawer ? 'Cancel' : '+ New Customer' }}
            </button>
          </div>

          <!-- Quick Add Customer Form Drawer -->
          <div
            v-if="showNewDrawer"
            class="p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-2.5"
          >
            <div class="text-xs font-bold text-gray-800">Quick Register Customer</div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                v-model="newCustomerForm.name"
                class="h-8 bg-white border border-gray-200 rounded-lg px-2.5 text-xs outline-none focus:border-gray-900"
                placeholder="Customer Name *"
              />
              <input
                v-model="newCustomerForm.phone"
                class="h-8 bg-white border border-gray-200 rounded-lg px-2.5 text-xs outline-none focus:border-gray-900"
                placeholder="Phone (+855...)"
              />
              <input
                v-model="newCustomerForm.email"
                class="h-8 bg-white border border-gray-200 rounded-lg px-2.5 text-xs outline-none focus:border-gray-900"
                placeholder="Email Address"
              />
            </div>
            <div class="flex justify-end">
              <button
                type="button"
                class="px-3.5 h-8 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors cursor-pointer border border-transparent shadow-xs"
                :disabled="!newCustomerForm.name.trim()"
                @click="$emit('createCustomer')"
              >
                Save &amp; Select Customer
              </button>
            </div>
          </div>

          <!-- Results List -->
          <div class="flex flex-col gap-1.5">
            <!-- Walk-in option -->
            <div
              class="flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer"
              :class="!selectedCustomerId
                ? 'bg-gray-50 border-gray-900/50 shadow-xs'
                : 'bg-white border-gray-200 hover:border-gray-300'"
              @click="$emit('selectCustomer', null)"
            >
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                  <UIcon name="i-heroicons-user" class="w-4 h-4" />
                </div>
                <div class="flex flex-col">
                  <span class="text-xs font-semibold text-gray-900">Walk-in Customer</span>
                  <span class="text-[11px] text-gray-500">Default anonymous sale, no loyalty points linked</span>
                </div>
              </div>
              <button
                type="button"
                class="px-2.5 h-7 rounded-md text-xs font-medium border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Select
              </button>
            </div>

            <!-- Customers loop -->
            <div
              v-for="c in searchResults"
              :key="c.id"
              class="flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer"
              :class="selectedCustomerId === c.id
                ? 'bg-gray-50 border-gray-900/50 shadow-xs'
                : 'bg-white border-gray-200 hover:border-gray-300'"
              @click="$emit('selectCustomer', c)"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-full bg-gray-900 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                  {{ c.name.slice(0, 2).toUpperCase() }}
                </div>
                <div class="flex flex-col min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-semibold text-gray-900 truncate">{{ c.name }}</span>
                    <span v-if="c.customer_code" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-gray-600">
                      {{ c.customer_code }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2 text-[11px] text-gray-500 truncate">
                    <span class="flex items-center gap-0.5">
                      <UIcon name="i-heroicons-phone" class="w-3 h-3 text-gray-400" />
                      {{ c.phone || 'No phone' }}
                    </span>
                    <span
                      v-if="c.loyalty_account"
                      class="flex items-center gap-0.5 text-amber-700 font-medium"
                    >
                      <UIcon name="i-heroicons-star" class="w-3 h-3 text-amber-500" />
                      {{ c.loyalty_account.tier }} ({{ c.loyalty_account.points_balance }} pts)
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                class="px-2.5 h-7 bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-gray-800 transition-colors cursor-pointer border border-transparent shadow-xs"
              >
                Select
              </button>
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
  searchQuery: string
  searchResults: any[]
  selectedCustomerId?: string | null
  showNewDrawer: boolean
  newCustomerForm: { name: string; phone: string; email: string }
}>()

defineEmits<{
  'update:modelValue': [val: boolean]
  'update:searchQuery': [val: string]
  'search': []
  'toggleNewDrawer': []
  'createCustomer': []
  'selectCustomer': [customer: any | null]
}>()
</script>
