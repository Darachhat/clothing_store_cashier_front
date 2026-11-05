<template>
  <div class="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-slate-100 text-slate-900 font-sans">
    <!-- Main Content -->
    <div class="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
      <!-- Top Bar -->
      <header class="h-14 bg-white border-b border-gray-200/80 px-6 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/pos"
            class="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Back to POS"
          >
            <UIcon name="i-heroicons-arrow-left" class="w-5 h-5" />
          </NuxtLink>
          <div>
            <h1 class="text-base font-bold text-gray-900">POS Terminal Settings</h1>
            <p class="text-xs text-gray-500">Configure local register preferences, printer, and customer display</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <NuxtLink
            to="/pos"
            class="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <UIcon name="i-heroicons-computer-desktop" class="w-4 h-4" />
            <span>Open POS Terminal</span>
          </NuxtLink>
        </div>
      </header>

      <!-- Settings Content Body -->
      <main class="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-4xl mx-auto w-full">
        <!-- Section: Language & Regional Preferences -->
        <div class="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
              <UIcon name="i-heroicons-globe-alt" class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-gray-900">{{ t('pos.settings.language_pref', 'Language & Regional Preferences') }}</h2>
              <p class="text-xs text-gray-500">{{ t('pos.settings.language_desc', 'Select the active display language for POS terminal and customer-facing interfaces.') }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
            <button
              v-for="loc in supportedLocales"
              :key="loc.code"
              type="button"
              class="flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer"
              :class="currentLocale === loc.code
                ? 'border-gray-900 bg-gray-900 text-white shadow-xs'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'"
              @click="setLocale(loc.code)"
            >
              <span class="text-2xl mb-1">{{ loc.flag }}</span>
              <span class="font-semibold">{{ loc.native }}</span>
              <span class="text-[10px] opacity-75">({{ loc.name }})</span>
              <span v-if="currentLocale === loc.code" class="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium">
                <UIcon name="i-heroicons-check-circle" class="w-3.5 h-3.5" />
                Active
              </span>
            </button>
          </div>
        </div>

        <!-- Section: Secondary Customer Display -->
        <div class="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                <UIcon name="i-heroicons-tv" class="w-5 h-5" />
              </div>
              <div>
                <h2 class="text-sm font-bold text-gray-900">Customer-Facing Display</h2>
                <p class="text-xs text-gray-500">Launch a secondary screen facing the customer for cart live-sync &amp; KHQR scanning</p>
              </div>
            </div>

            <button
              type="button"
              class="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              @click="openCustomerDisplay"
            >
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
              <span>Launch Customer Display Window</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-gray-700">Register / Terminal Identifier</label>
              <input
                v-model="settings.terminalId"
                type="text"
                class="h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs font-mono uppercase outline-none focus:border-gray-900 transition-colors"
                placeholder="POS-01"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-gray-700">Bound Customer Display Route</label>
              <div class="h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-mono text-gray-600 flex items-center truncate">
                /pos/customer-display?terminal={{ normalizedTerminalId }}
              </div>
            </div>
          </div>

          <div class="p-3 bg-gray-50 rounded-xl border border-gray-200/70 text-xs text-gray-600 flex items-start gap-2">
            <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <span>Drag the launched window to your secondary customer-facing monitor and press F11 for full-screen. Each display window binds to its assigned Register ID ({{ normalizedTerminalId }}) so multiple registers never cross-talk.</span>
          </div>
        </div>

        <!-- Section: Receipt & Printing -->
        <div class="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
              <UIcon name="i-heroicons-printer" class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-gray-900">Receipt Printing</h2>
              <p class="text-xs text-gray-500">Configure thermal slip printer behavior and custom receipt texts</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-gray-700">Store Name Header</label>
              <input
                v-model="settings.receiptStoreName"
                type="text"
                class="h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs outline-none focus:border-gray-900 transition-colors"
                placeholder="Clothing Store Phnom Penh"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-gray-700">Thermal Paper Width</label>
              <select
                v-model="settings.paperWidth"
                class="h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs outline-none focus:border-gray-900 transition-colors"
              >
                <option value="80mm">80mm Standard Thermal</option>
                <option value="58mm">58mm Compact Thermal</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5 md:col-span-2">
              <label class="text-xs font-semibold text-gray-700">Receipt Footer Note</label>
              <input
                v-model="settings.receiptFooterNote"
                type="text"
                class="h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs outline-none focus:border-gray-900 transition-colors"
                placeholder="Thank you for shopping with us! Items can be exchanged within 7 days."
              />
            </div>
          </div>

          <!-- Print Mode Info -->
          <div class="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <span class="text-xs font-semibold text-gray-800">Print Mode</span>
              <p class="text-[11px] text-gray-500">Manual Print on Demand (Cashier reviews receipt and prints with 1-click or Enter; no auto-pop)</p>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-medium">Manual Print</span>
          </div>

          <!-- Test Print Button -->
          <div class="pt-1">
            <button
              type="button"
              class="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer"
              @click="testPrint"
            >
              <UIcon name="i-heroicons-printer" class="w-4 h-4" />
              <span>Test Print (opens browser dialog)</span>
            </button>
          </div>
        </div>

        <!-- Section: Sound & Feedback -->
        <div class="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
              <UIcon name="i-heroicons-speaker-wave" class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-gray-900">Audio Feedback</h2>
              <p class="text-xs text-gray-500">Chimes and beeps for scan events and payment confirmations</p>
            </div>
          </div>

          <div class="flex flex-col gap-3 pt-2">
            <!-- Barcode Beep Toggle -->
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-semibold text-gray-800">Barcode Scan Beep</span>
                <p class="text-[11px] text-gray-500">Play a subtle beep sound when an item barcode is recognized</p>
              </div>
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  @click="testBeep"
                >
                  <UIcon name="i-heroicons-speaker-wave" class="w-3.5 h-3.5 text-gray-500" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  role="switch"
                  :aria-checked="settings.soundBeep"
                  class="relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer flex-shrink-0"
                  :class="settings.soundBeep ? 'bg-gray-900' : 'bg-gray-300'"
                  @click="settings.soundBeep = !settings.soundBeep"
                >
                  <span
                    class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200"
                    :class="settings.soundBeep ? 'translate-x-4' : 'translate-x-0'"
                  />
                </button>
              </div>
            </div>

            <!-- ABA Success Chime Toggle -->
            <div class="flex items-center justify-between border-t border-gray-100 pt-3">
              <div>
                <span class="text-xs font-semibold text-gray-800">ABA Payment Success Chime</span>
                <p class="text-[11px] text-gray-500">Play an uplifting celebration chime when ABA KHQR is approved</p>
              </div>
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  @click="testAbaChime"
                >
                  <UIcon name="i-heroicons-speaker-wave" class="w-3.5 h-3.5 text-gray-500" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  role="switch"
                  :aria-checked="settings.soundSuccess"
                  class="relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer flex-shrink-0"
                  :class="settings.soundSuccess ? 'bg-gray-900' : 'bg-gray-300'"
                  @click="settings.soundSuccess = !settings.soundSuccess"
                >
                  <span
                    class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200"
                    :class="settings.soundSuccess ? 'translate-x-4' : 'translate-x-0'"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Cashier Account & Session -->
        <div class="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col gap-4">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gray-900 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                {{ userInitials }}
              </div>
              <div class="flex flex-col">
                <h2 class="text-sm font-bold text-gray-900">{{ userName }}</h2>
                <p class="text-xs text-gray-500">{{ userRole }} &bull; {{ userEmail || 'Active session' }}</p>
              </div>
            </div>

            <button
              type="button"
              class="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-900 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              @click="handleLogout"
            >
              <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4 text-gray-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <!-- Save Button -->
        <div class="flex justify-end gap-3 pb-8">
          <button
            type="button"
            class="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors shadow-xs cursor-pointer flex items-center gap-2"
            @click="handleSave"
          >
            <UIcon name="i-heroicons-check" class="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </main>
    </div>

    <!-- Sample Receipt Modal for Test Print -->
    <PosReceiptModal
      v-model="showSampleReceipt"
      :receipt="sampleReceipt"
      branch-name="Main Flagship Store"
      cashier-name="POS Cashier"
      :format-riel="formatRiel"
      @print="triggerBrowserPrint"
      @new-sale="showSampleReceipt = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { usePosSettings } from '~/composables/usePosSettings'
import { usePosAudio } from '~/composables/usePosAudio'
import { useAppTranslation } from '~/composables/useAppTranslation'
import { CUSTOMER_DISPLAY_CHANNEL, normalizeTerminalId } from '~/composables/useCustomerDisplaySync'

const toast = useAppToast()
const authStore = useAuthStore()
const { t, currentLocale, supportedLocales, setLocale } = useAppTranslation()
const { settings, loadSettings, saveSettings } = usePosSettings()
const { playBeep, playAbaChime } = usePosAudio()

const userName = computed(() => {
  const u = authStore.currentUser as any
  if (!u) return 'Cashier'
  return `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'Cashier'
})

const userInitials = computed(() => {
  const name = userName.value
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || 'CA'
})

const userEmail = computed(() => authStore.currentUser?.email || '')
const userRole = computed(() => authStore.currentUser?.roles?.[0]?.name || 'Cashier')

async function handleLogout() {
  await authStore.logout()
  await navigateTo('/login')
}

const normalizedTerminalId = computed(() => normalizeTerminalId(settings.value.terminalId))
const showSampleReceipt = ref(false)

const sampleReceipt = computed(() => ({
  isSample: true,
  invoice_number: `TEST-${normalizedTerminalId.value}-001`,
  date: new Date().toLocaleString(),
  customerName: 'Sample Customer',
  items: [
    {
      variant_id: 'sample-1',
      sku: 'TEE-OVS-BLK-L',
      name: 'Oversized Heavyweight Cotton Tee',
      variantInfo: 'Black / L',
      quantity: 2,
      price: 15.0,
      discount: 0,
      total: 30.0,
    },
    {
      variant_id: 'sample-2',
      sku: 'DNM-CRG-BLU-M',
      name: 'Relaxed Fit Cargo Denim',
      variantInfo: 'Washed Blue / M',
      quantity: 1,
      price: 28.5,
      discount: 2.5,
      total: 26.0,
    },
  ],
  subtotal: 56.0,
  discount: 2.5,
  tax: 0,
  grandTotal: 53.5,
  tenderedAmount: 60.0,
  payments: [{ payment_method: 'CASH', amount: 53.5 }],
  change: 6.5,
}))

function formatRiel(usd: number): string {
  return `${Math.round(usd * 4100).toLocaleString()} ៛`
}

onMounted(() => {
  loadSettings()
})

function handleSave() {
  saveSettings()
  if (import.meta.client && typeof BroadcastChannel !== 'undefined') {
    try {
      const ch = new BroadcastChannel(CUSTOMER_DISPLAY_CHANNEL)
      ch.postMessage({
        type: 'SETTINGS_UPDATED',
        terminalId: normalizedTerminalId.value,
        payload: {
          terminalId: normalizedTerminalId.value,
          storeName: settings.value.receiptStoreName,
          receiptFooterNote: settings.value.receiptFooterNote,
        },
        timestamp: Date.now(),
      })
      ch.close()
    } catch {
      // Ignore broadcast errors
    }
  }
  toast.add({
    title: 'Settings Saved',
    description: `POS Terminal (${normalizedTerminalId.value}) preferences updated`,
    color: 'green',
  })
}

function openCustomerDisplay() {
  if (import.meta.client) {
    saveSettings()
    const term = encodeURIComponent(normalizedTerminalId.value)
    window.open(
      `/pos/customer-display?terminal=${term}`,
      `pos_customer_display_${normalizedTerminalId.value}`,
      'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no',
    )
  }
}

function testPrint() {
  if (import.meta.client) {
    saveSettings()
    showSampleReceipt.value = true
    setTimeout(() => {
      window.print()
    }, 250)
  }
}

function triggerBrowserPrint() {
  if (import.meta.client) {
    window.print()
  }
}

function testBeep() {
  playBeep(true)
}

function testAbaChime() {
  playAbaChime(true)
}
</script>
