<template>
  <div class="pos-focus flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-slate-100 text-slate-900 font-sans">
    <!-- ─── Main Content Area ──────────────────────────────────────── -->
    <div class="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
      <!-- ─── PosHeader component (Tailwind) ──────────────────────── -->
      <PosHeader
        ref="searchOmnibarRef"
        v-model="searchQuery"
        :branch-name="activeBranchName"
        :terminal-id="activeTerminalId"
        :cashier-name="cashierName"
        :cashier-initials="cashierInitials"
        :cart-count="posStore.cart.length"
        :held-count="posStore.heldCarts.length"
        :has-last-receipt="Boolean(lastCompletedReceipt)"
        :shift-active="Boolean(activeShift)"
        :customer-display-online="customerDisplayOnline"
        :time-str="currentTimeStr"
        :date-str="currentDateStr"
        @search="handleBarcodeOrSkuSearch"
        @scan="showScannerModal = true"
        @select-terminal="showTerminalSelectModal = true"
        @open-parked="showHeldOrdersModal = true"
        @open-shortcuts="showShortcutsModal = true"
        @open-stickers="openStickerModal()"
        @open-history="showShiftOrdersModal = true"
        @open-shift-modal="handleOpenShiftModalClick"
        @reprint-last="reprintLastReceipt"
        @toggle-cart="showMobileCart = !showMobileCart"
        @open-customer-display="openCustomerDisplayWindow"
      />

      <!-- ─── Body: Products Catalog (Left) + Cart Sidebar (Right) ───── -->
      <div class="flex-1 min-w-0 min-h-0 flex overflow-hidden relative">
        <!-- ─── Product Selection Section ────────────────────────────── -->
        <main
          class="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden p-2.5 sm:p-3 gap-2.5 no-print"
          :class="{ 'pb-20 lg:pb-2.5': posStore.itemCount > 0 }"
          aria-label="Products"
        >
          <!-- ─── PosProductFilterBar (Tailwind) ────────────────────── -->
          <PosProductFilterBar
            :active-category="productFilters.category"
            :active-brand="productFilters.brand"
            :categories="categoryList"
            :brands="brandList"
            :product-count="pagination?.total || paginatedProducts.length"
            :search-query="searchQuery"
            @update:active-category="setCategory"
            @update:active-brand="setBrand"
            @clear-search="clearSearch"
          />

          <!-- ─── PosProductGrid (Tailwind) ───────────────────────── -->
          <PosProductGrid
            :loading="loadingProducts"
            :error="catalogError"
            :error-message="catalogErrorMessage"
            :products="paginatedProducts"
            :pagination="pagination"
            :showing-label="showingLabel"
            :get-product-stock="getProductStock"
            :get-resolved-price="getResolvedPrice"
            :get-product-colors="getProductColors"
            :get-product-sizes="getProductSizes"
            :get-selected-color="getSelectedColor"
            :get-selected-size="getSelectedSize"
            @click-product="handleProductCardClick"
            @select-color="({ productId, color }) => setSelectedColor(productId, color)"
            @select-size="({ productId, size }) => setSelectedSize(productId, size)"
            @quick-add="quickAddProduct"
            @reset-filters="handleResetAllFilters"
            @retry="fetchProducts"
            @go-to-page="goToPage"
            @next-page="nextPage"
            @previous-page="previousPage"
          />
        </main>

        <!-- ─── Mobile Sticky Bottom Cart Summary Pill (< lg screens) ── -->
        <div
          v-if="posStore.itemCount > 0"
          class="lg:hidden fixed bottom-3 left-3 right-3 z-30 flex items-center justify-between p-2.5 bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-800 select-none cursor-pointer"
          @click="showMobileCart = true"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <UIcon name="i-heroicons-shopping-bag" class="w-4 h-4 text-white" />
            </div>
            <div class="flex flex-col min-w-0 leading-tight">
              <span class="text-xs text-gray-300 font-medium truncate">
                {{ posStore.itemCount }} item{{ posStore.itemCount === 1 ? '' : 's' }} in order
              </span>
              <span class="text-sm font-bold font-mono tabular-nums text-white">
                ${{ posStore.grandTotal.toFixed(2) }}
              </span>
            </div>
          </div>
          <button
            type="button"
            class="h-8 px-3 rounded-lg bg-white text-gray-900 text-xs font-bold flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
          >
            <span>Review & Pay</span>
            <UIcon name="i-heroicons-chevron-right" class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- ─── PosCartPanel & Checkout Sidebar (Tailwind) ───────────── -->
        <PosCartPanel
          v-model:is-open-mobile="showMobileCart"
          v-model:coupon-code="couponCodeInput"
          :cart="posStore.cart"
          :selected-customer="posStore.selectedCustomer"
          :item-count="posStore.itemCount"
          :applied-coupon="posStore.appliedCoupon"
          :cart-subtotal="posStore.cartSubtotal"
          :total-discount="posStore.totalDiscount"
          :tax-rate="posStore.taxRate"
          :tax-amount="posStore.taxAmount"
          :grand-total="posStore.grandTotal"
          :format-riel="formatRiel"
          :validating-coupon="validatingCoupon"
          :processing-sale="processingSale"
          :get-line-stock="getLineStock"
          :last-updated-variant-id="posStore.lastUpdatedVariantId"
          @select-customer="showCustomerModal = true"
          @remove-customer="posStore.setCustomer(null)"
          @hold-cart="handleHoldCart"
          @clear-cart="confirmClearCart"
          @discount-item="openItemDiscountModal"
          @update-item-qty="updateCartQuantity"
          @change-item-qty="onQtyInputChange"
          @remove-item="posStore.removeItem"
          @apply-coupon="applyCouponCode"
          @remove-coupon="posStore.removeCoupon"
          @checkout="openCheckoutModal"
          @quick-aba="startAbaFullScreenCheckout"
        />
      </div>
    </div>

    <!-- ─── Modal 1: Variant Selection Sheet (Tailwind) ───────────── -->
    <PosVariantPickerModal
      v-model="variantPickerProduct"
      :get-variant-stock="getVariantStock"
      @select-variant="addSpecificVariant"
      @print-sticker="openStickerModalForVariant"
    />

    <!-- ─── Modal 2: Customer Selection & Quick Add (Tailwind) ──────── -->
    <PosCustomerModal
      v-model="showCustomerModal"
      v-model:search-query="customerSearchQuery"
      v-model:new-customer-form="newCustomerForm"
      :search-results="customerSearchResults"
      :selected-customer-id="posStore.selectedCustomerId"
      :show-new-drawer="showNewCustomerDrawer"
      @search="debouncedSearchCustomers"
      @toggle-new-drawer="showNewCustomerDrawer = !showNewCustomerDrawer"
      @create-customer="createNewCustomer"
      @select-customer="selectCustomer"
    />

    <!-- ─── Modal 3: Parked / Held Carts Drawer (Tailwind) ────────── -->
    <PosHeldOrdersModal
      v-model="showHeldOrdersModal"
      :held-carts="posStore.heldCarts"
      :format-time-ago="formatTimeAgo"
      @resume="resumeHeldCart"
      @discard="posStore.removeHeldCart"
    />

    <!-- ─── Modal 4: Payment & Checkout Flow (Tailwind) ───────────── -->
    <PosPaymentModal
      v-model="showPaymentModal"
      v-model:selected-payment-method="selectedPaymentMethod"
      v-model:tender-amount="tenderAmount"
      v-model:payment-reference-number="paymentReferenceNumber"
      v-model:order-notes="orderNotes"
      :grand-total="posStore.grandTotal"
      :format-riel="formatRiel"
      :is-split-mode="isSplitPaymentMode"
      :payment-methods="paymentMethods"
      :change-due="changeDue"
      :fast-cash-presets="fastCashPresets"
      :split-payments="splitPayments"
      :total-split-amount="totalSplitAmount"
      :remaining-split-balance="remainingSplitBalance"
      :processing-sale="processingSale"
      :is-checkout-disabled="isCheckoutDisabled"
      :aba-loading="abaLoading"
      :aba-error="abaError"
      :aba-status="abaStatus"
      :aba-qr-image="abaQrImage"
      :aba-qr-string="abaQrString"
      :aba-apv="abaApv"
      :aba-seconds-left="abaSecondsLeft"
      :aba-cancelling="abaCancelling"
      :is-aba-modal-active="isAbaModalActive"
      :item-count="posStore.itemCount"
      :customer-name="posStore.selectedCustomer?.name || null"
      :customer-display-online="customerDisplayOnline"
      :terminal-label="activeTerminalId"
      @enable-split-mode="enableSplitPaymentMode"
      @disable-split-mode="isSplitPaymentMode = false"
      @add-split-row="addSplitRow"
      @remove-split-row="removeSplitRow"
      @finalize-sale="handleFinalizeSale"
      @aba-retry="handleAbaRetry"
      @aba-cancel="handleAbaCancel"
      @select-aba-khqr="startAbaFullScreenCheckout"
      @select-aba-card="startAbaModalCheckout('cards')"
    />

    <!-- ─── Modal 4B: Dedicated Full-Screen ABA KHQR Overlay (Option B - Single Screen Takeover) ── -->
    <PosAbaKhqrFullScreenOverlay
      v-model="showAbaFullScreen"
      :loading="abaLoading"
      :verifying="abaVerifying"
      :error="abaError"
      :status="abaStatus"
      :qr-image="abaQrImage"
      :qr-string="abaQrString"
      :checkout-url="abaCheckoutUrl"
      :amount="Number(posStore.grandTotal) || 0"
      :apv="abaApv"
      :tran-id="abaTranId"
      :seconds-left="abaSecondsLeft"
      :cancelling="abaCancelling"
      :store-name="posSettings.receiptStoreName || 'Clothing Store Phnom Penh'"
      :branch-name="activeBranchName"
      :cashier-name="cashierName"
      :cart-items-count="Number(posStore.itemCount) || 0"
      :format-riel="formatRiel"
      @retry="handleAbaRetry"
      @cancel="handleAbaCancel"
      @verify="verifyAbaPaymentNow"
    />

    <!-- ─── Modal 5: Post-Sale Receipt & Thermal Print View (Tailwind) ─ -->
    <PosReceiptModal
      v-model="showReceiptModal"
      :receipt="completedReceipt"
      :branch-name="activeBranchName"
      :cashier-name="cashierName"
      :format-riel="formatRiel"
      @print="handlePrintReceipt"
      @new-sale="startNewSale"
    />

    <!-- ─── Modal 6: Barcode Scanner Modal ──────────────────────────── -->
    <BarcodeScannerModal
      v-model="showScannerModal"
      @scanned="handleBarcodeScanned"
    />

    <!-- ─── Modal 8: Line Item Discount Sheet (Tailwind) ────────────── -->
    <PosLineDiscountModal
      v-model="lineDiscountItem"
      v-model:discount-input="lineDiscountInput"
      @apply="applyLineDiscount"
    />

    <!-- ─── Modal 9: Clear Cart Confirmation (Tailwind) ─────────────── -->
    <PosClearCartConfirmModal
      v-model="showClearCartConfirm"
      :item-count="posStore.itemCount"
      @confirm="executeClearCart"
    />

    <!-- ─── Modal 10: Product Sticker & Price Tag Printer ───────────── -->
    <PosProductStickerModal
      v-model="showStickerModal"
      :initial-variants="stickerInitialVariants"
      :catalog-variants="allVariants"
      :format-riel="formatRiel"
    />

    <!-- ─── Modal 10B: Shift Sales & Order History ──────────────────── -->
    <PosShiftOrdersModal
      v-model="showShiftOrdersModal"
      :active-terminal-code="activeTerminalId"
      :format-riel="formatRiel"
      @view-receipt="viewOrderReceipt"
      @reprint-receipt="reprintOrderReceipt"
    />

    <!-- ─── Modal 10C: Cashier Shift Open Modal ────────────────────── -->
    <PosShiftOpenModal
      :is-open="showShiftOpenModal"
      :terminal-code="activeTerminalId"
      :loading="openingShift"
      :error-message="shiftOpenError"
      :allow-dismiss="Boolean(activeShift)"
      @close="showShiftOpenModal = false"
      @open-shift="handleOpenShift"
    />

    <!-- ─── Modal 10D: Cashier Shift Close & Reconciliation Modal ─── -->
    <PosShiftCloseModal
      :is-open="showShiftCloseModal"
      :summary="activeShiftSummary"
      :loading="closingShift"
      :error-message="shiftCloseError"
      @close="showShiftCloseModal = false"
      @confirm-close="handleCloseShift"
    />

    <!-- ─── Modal 10E: End of Shift Z-Report Receipt Slip ──────────── -->
    <PosShiftZReportModal
      :is-open="showShiftZReportModal"
      :summary="shiftZReportData"
      :store-name="activeBranchName"
      @close="showShiftZReportModal = false"
    />

    <!-- ─── Modal 11: POS Terminal / Register Station Switcher ────────── -->
    <div
      v-if="showTerminalSelectModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
              <UIcon name="i-heroicons-computer-desktop" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900">Select POS Terminal</h3>
              <p class="text-xs text-gray-500">Switch station register &amp; cart context</p>
            </div>
          </div>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 p-1 rounded-md"
            @click="showTerminalSelectModal = false"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <!-- Station Enrollment & Device Lock Banner (Task 1.4) -->
        <div class="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <UIcon
              :name="posSettings.deviceLockEnabled ? 'i-heroicons-lock-closed' : 'i-heroicons-lock-open'"
              class="w-4 h-4"
              :class="posSettings.deviceLockEnabled ? 'text-amber-600' : 'text-gray-400'"
            />
            <div>
              <span class="font-semibold text-gray-800">
                {{ posSettings.deviceLockEnabled ? `Station Enrolled: ${posSettings.enrolledTerminalId}` : 'Workstation Unlocked' }}
              </span>
              <p class="text-[11px] text-gray-500">
                {{ posSettings.deviceLockEnabled ? 'Switching registers requires Manager PIN' : 'Cashiers can switch registers freely' }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="px-2.5 py-1 rounded border text-[11px] font-semibold transition-colors"
            :class="posSettings.deviceLockEnabled
              ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
              : 'border-gray-300 bg-gray-900 text-white hover:bg-gray-800'"
            @click="handleToggleEnrollmentLock"
          >
            {{ posSettings.deviceLockEnabled ? 'Unlock Device' : 'Lock to Station' }}
          </button>
        </div>

        <div class="p-5 space-y-2.5 max-h-[60vh] overflow-y-auto">
          <div
            v-for="term in activeTerminalsList"
            :key="term.id"
            class="p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between"
            :class="posSettings.terminalId === term.code
              ? 'border-gray-400 bg-gray-50'
              : 'border-gray-200 hover:border-gray-300'"
            @click="switchTerminal(term)"
          >
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center font-mono font-bold text-xs text-gray-700 border border-gray-200">
                {{ term.code }}
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ term.name }}</p>
                <p class="text-xs text-gray-500 font-mono">{{ term.warehouse?.name || 'Assigned Warehouse' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span
                v-if="posSettings.terminalId === term.code"
                class="px-2 py-0.5 rounded text-xs font-semibold bg-gray-900 text-white"
              >
                Current
              </span>
              <UIcon
                v-if="posSettings.terminalId === term.code"
                name="i-heroicons-check-circle"
                class="w-5 h-5 text-gray-900"
              />
            </div>
          </div>

          <div v-if="activeTerminalsList.length === 0" class="text-center py-6 text-sm text-gray-500">
            No active terminals configured. Using default station {{ posSettings.terminalId }}.
          </div>
        </div>

        <div class="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            type="button"
            class="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            @click="showTerminalSelectModal = false"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Modal 12: Manager PIN Authorization (Task 1.4) ─────────────── -->
    <div
      v-if="showPinModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-700">
              <UIcon name="i-heroicons-shield-check" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900">Manager Authorization</h3>
              <p class="text-xs text-gray-500">Restricted POS action</p>
            </div>
          </div>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 p-1 rounded-md"
            @click="showPinModal = false"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form class="p-5 space-y-4" @submit.prevent="submitManagerPin">
          <p class="text-xs text-gray-600">
            <template v-if="pinActionType === 'SWITCH_TERMINAL'">
              This station is enrolled to register <span class="font-bold text-gray-900 font-mono">{{ posSettings.enrolledTerminalId }}</span>.
              Enter Manager PIN to switch to <span class="font-bold text-gray-900 font-mono">{{ pendingSwitchTerminal?.code }}</span>:
            </template>
            <template v-else>
              Enter Manager PIN to unlock device registration on this workstation:
            </template>
          </p>

          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Manager PIN</label>
            <input
              v-model="managerPinInput"
              type="password"
              maxlength="10"
              autofocus
              required
              placeholder="••••"
              class="w-full text-center tracking-widest text-lg font-mono rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-gray-500"
            />
            <p v-if="pinErrorMessage" class="text-xs text-red-600 mt-1 font-medium">
              {{ pinErrorMessage }}
            </p>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              @click="showPinModal = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-1.5 text-xs font-bold rounded-lg bg-gray-900 text-white hover:bg-gray-800"
            >
              Authorize
            </button>
          </div>
        </form>
      </div>
    </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductVariant, CustomerSummary, CartItem, PaymentEntry } from '~/types/pos'
import { usePosProducts } from '~/composables/usePosProducts'
import { usePosSettings } from '~/composables/usePosSettings'
import { useSidebar } from '~/composables/useSidebar'
import {
  CUSTOMER_DISPLAY_CHANNEL,
  CUSTOMER_DISPLAY_HEARTBEAT_KEY,
  HEARTBEAT_INTERVAL_MS,
  KHR_EXCHANGE_RATE,
  PAYMENT_SUCCESS_DURATION_MS,
  getHeartbeatStorageKey,
  getDisplayPresenceStorageKey,
  isDisplayPresenceFresh,
  buildCustomerDisplayUrl,
  mapCartItemToDisplayItem,
  normalizeTerminalId,
  roundCurrency,
  saveDisplaySnapshotToStorage,
  toKhrAmount,
  type CustomerDisplayCheckoutPhase,
  type CustomerDisplayKhqrData,
  type CustomerDisplayKhqrStatus,
  type CustomerDisplayScreenState,
  type CustomerDisplaySnapshot,
  type CustomerDisplaySuccessData,
  type CustomerDisplayTransitionReason,
} from '~/composables/useCustomerDisplaySync'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'POS Terminal — Antigravity Apparel' })

// ── Composables & Stores ──────────────────────────────────────────
const posStore = usePosStore()
const { apiFetch } = useApi()
const { listCategories, listBrands } = useCatalogApi()
const { listStocks } = useInventoryApi()
const { listCustomers, createCustomer, adjustPoints } = useCustomerApi()
const { listProducts, searchByBarcode, searchBySku, searchByQr } = useProductApi()
const { validateCoupon } = usePromotionApi()
const { createSale, completeSale, cancelSale, getSale } = useSaleApi()
const { createKhqr, createPurchaseForm, getStatus: getPaymentStatus, cancel: cancelPayment } = usePaymentApi()
const {
  isModalOpen: isAbaModalActive,
  checkoutError: abaModalError,
  launchCheckout: launchAbaCheckoutModal,
  dismissCheckout: dismissAbaCheckoutModal,
} = useAbaCheckout()
const { listBranches } = useBranchApi()
const { listTerminals, heartbeat: sendTerminalHeartbeat } = useTerminalApi()
const { getActiveShift, openShift, getShiftSummary, closeShift } = useShiftApi()

// ── Cashier Shift & Drawer Float State ─────────────────────────────
const activeShift = ref<any | null>(null)
const activeShiftSummary = ref<any | null>(null)
const shiftZReportData = ref<any | null>(null)
const loadingShift = ref(false)
const openingShift = ref(false)
const closingShift = ref(false)
const shiftOpenError = ref<string | null>(null)
const shiftCloseError = ref<string | null>(null)
const showShiftOpenModal = ref(false)
const showShiftCloseModal = ref(false)
const showShiftZReportModal = ref(false)
const authStore = useAuthStore()
const router = useRouter()
const toast = useAppToast()
const { playBeep, playAbaChime, playSuccess, playError } = usePosAudio()
// ── POS Terminal Settings (auto-print, audio gates, station enrollment) ─
const {
  settings: posSettings,
  loadSettings,
  saveSettings,
  fetchRemoteSettings,
  verifyManagerPin,
  enrollDevice,
  unlockDevice,
} = usePosSettings()

// ── Server-side Paginated Product Composable ──────────────────────
const posProducts = usePosProducts()
const {
  products: paginatedProducts,
  loading: loadingProducts,
  error: catalogError,
  errorMessage: catalogErrorMessage,
  pagination,
  filters: productFilters,
  showingLabel,
  fetchProducts,
  goToPage,
  nextPage,
  previousPage,
  resetPage,
  setCategory,
  setBrand,
  setStatus,
  setSort,
  setSearch,
  applySearch,
  resetFilters,
  offlineCatalog,
} = posProducts

// ── State ─────────────────────────────────────────────────────────
/**
 * allVariants: kept as an in-memory index for fast barcode/SKU lookup
 * on the current page without additional API calls.
 * Populated from the products returned by posProducts.
 */
const allVariants = computed(() => {
  const variants: ProductVariant[] = []
  for (const prod of paginatedProducts.value) {
    for (const v of (prod as any).variants || []) {
      variants.push({ ...v, product: prod })
    }
  }
  return variants
})

const searchQuery = ref('')
const searchOmnibarRef = ref<any>(null)

const categoryList = ref<Array<{ id: string; name: string }>>([])
const brandList = ref<Array<{ id: string; name: string; logo_url?: string }>>([])

const inventoryMap = ref<Record<string, number>>({})
const branches = ref<any[]>([])

// Card selection trackers
const selectedCardColors = ref<Record<string, string>>({})
const selectedCardSizes = ref<Record<string, string>>({})

// Modals
const showScannerModal = ref(false)
const showCustomerModal = ref(false)
const showNewCustomerDrawer = ref(false)
const showHeldOrdersModal = ref(false)
const showPaymentModal = ref(false)
const showAbaFullScreen = ref(false)
const showMobileCart = ref(false)
const showReceiptModal = ref(false)
const showStickerModal = ref(false)
const showShiftOrdersModal = ref(false)
const showTerminalSelectModal = ref(false)
const showPinModal = ref(false)
const managerPinInput = ref('')
const pendingSwitchTerminal = ref<any | null>(null)
const pinActionType = ref<'SWITCH_TERMINAL' | 'TOGGLE_LOCK'>('SWITCH_TERMINAL')
const pinErrorMessage = ref('')
const activeTerminalsList = ref<any[]>([])
let terminalHeartbeatTimer: ReturnType<typeof setInterval> | null = null
const stickerInitialVariants = ref<Array<{ variant: ProductVariant; quantity: number }>>([])
const lastCompletedReceipt = ref<any | null>(null)
const { isShortcutsOpen: showShortcutsModal } = useSidebar()

// Line Item Discount Modal
const lineDiscountItem = ref<CartItem | null>(null)
const lineDiscountInput = ref<number>(0)

// Variant Selection Sheet
const variantPickerProduct = ref<any | null>(null)

// Customer Search & Creation
const customerSearchQuery = ref('')
const customerSearchResults = ref<CustomerSummary[]>([])
const newCustomerForm = ref({ name: '', phone: '', email: '' })

// Promotions & Discounts
const couponCodeInput = ref('')
const validatingCoupon = ref(false)

// Payment & Checkout
export type PosPaymentMethod = 'CASH' | 'ABA_KHQR' | 'CARD' | 'BANK_TRANSFER'

const selectedPaymentMethod = ref<PosPaymentMethod>('CASH')
const paymentMethods = [
  { value: 'CASH', label: 'Cash', subtitle: 'USD & Khmer Riel', icon: 'i-heroicons-banknotes' },
  { value: 'ABA_KHQR', label: 'ABA KHQR', subtitle: 'Bakong & All Banks', icon: 'i-heroicons-qr-code' },
  { value: 'CARD', label: 'Credit Card', subtitle: 'Visa, Mastercard, JCB', icon: 'i-heroicons-credit-card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', subtitle: 'Direct Wire Ref', icon: 'i-heroicons-building-library' },
]
const tenderAmount = ref<number>(0)
const paymentReferenceNumber = ref('')
const orderNotes = ref('')
const processingSale = ref(false)

// ABA KHQR state
const abaLoading = ref(false)
const abaVerifying = ref(false)
const abaError = ref<string | null>(null)
const abaStatus = ref('')
const abaQrImage = ref<string | null>(null)
const abaQrString = ref<string | null>(null)
const abaCheckoutUrl = ref<string | null>(null)
const abaApv = ref<string | null>(null)
const abaTranId = ref<string | null>(null)
const abaSecondsLeft = ref(0)
const abaCancelling = ref(false)
const abaPaymentId = ref<string | null>(null)  // PaymentTransaction.id
const abaPollTimer = ref<ReturnType<typeof setInterval> | null>(null)
const abaCountdownTimer = ref<ReturnType<typeof setInterval> | null>(null)
const abaCurrentSaleId = ref<string | null>(null)

// Split Tender State
const isSplitPaymentMode = ref(false)
const splitPayments = ref<PaymentEntry[]>([])

// Completed Receipt
const completedReceipt = ref<any | null>(null)

// Live Time
const currentTimeStr = ref('')
const currentDateStr = ref('')

// ── Computed Properties ───────────────────────────────────────────
const cashierName = computed(() => authStore.currentUser?.full_name || 'Admin Cashier')
const cashierInitials = computed(() => {
  const parts = cashierName.value.split(' ')
  return parts.length > 1 ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase() : cashierName.value.slice(0, 2).toUpperCase()
})

const activeBranchName = computed(() => {
  if (branches.value.length > 0) return branches.value[0].name
  return 'Main Flagship Store'
})

const changeDue = computed(() => {
  const due = Number(posStore.grandTotal.toFixed(2))
  if (isSplitPaymentMode.value) {
    const cashSplit = splitPayments.value.find((p) => p.payment_method === 'CASH')
    if (cashSplit && totalSplitAmount.value > due) {
      return Number((totalSplitAmount.value - due).toFixed(2))
    }
    return 0
  }
  return Math.max(0, Number((tenderAmount.value - due).toFixed(2)))
})

const totalSplitAmount = computed(() => {
  const sum = splitPayments.value.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  return Number(sum.toFixed(2))
})

const remainingSplitBalance = computed(() => {
  const due = Number(posStore.grandTotal.toFixed(2))
  return Math.max(0, Number((due - totalSplitAmount.value).toFixed(2)))
})

const isCheckoutDisabled = computed(() => {
  if (posStore.cart.length === 0) return true
  const due = Number(posStore.grandTotal.toFixed(2))
  if (isSplitPaymentMode.value) {
    return totalSplitAmount.value < due
  }
  if (selectedPaymentMethod.value === 'CASH') {
    return Number(tenderAmount.value.toFixed(2)) < due
  }
  // ABA KHQR: disable the button once QR is shown / processing
  if (selectedPaymentMethod.value === 'ABA_KHQR') {
    return abaStatus.value === 'PENDING' || abaStatus.value === 'APPROVED'
  }
  return false
})

const fastCashPresets = computed(() => {
  const tot = posStore.grandTotal
  const bases = [5, 10, 20, 50, 100, 200]
  return bases.filter((b) => b >= tot).slice(0, 4)
})

// Filtered and grouped products — now server-side via posProducts composable.
// Products are returned from the API already filtered and paginated.
// We group them here only to normalize the shape for ProductCard
// (which expects a product with variants array).
const filteredVariants = computed(() => allVariants.value)

const groupedProducts = computed(() => {
  return paginatedProducts.value.map((prod: any) => ({
    ...prod,
    variants: prod.variants || [],
  }))
})

// ── Helpers ───────────────────────────────────────────────────────
function formatRiel(usd: number): string {
  const riel = Math.round(usd * KHR_EXCHANGE_RATE)
  return `${riel.toLocaleString()} ៛`
}

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins === 1) return '1 min ago'
  return `${mins} mins ago`
}

function getVariantStock(variantId: string): number {
  // Return 0 when stock is unknown — safer than a fake positive fallback
  return inventoryMap.value[variantId] ?? 0
}

/**
 * Stock for a cart line, or null when the stock list does not contain the variant.
 * Unknown ≠ zero: the cart only flags a line when stock is actually known.
 */
function getLineStock(variantId: string): number | null {
  const s = inventoryMap.value[variantId]
  return typeof s === 'number' ? s : null
}

function getProductStock(prod: any): number {
  if (!prod.variants || prod.variants.length === 0) return 0
  return prod.variants.reduce((sum: number, v: ProductVariant) => sum + getVariantStock(v.id), 0)
}

function getProductColors(prod: any) {
  const seen = new Set<string>()
  const result: Array<{ name: string; hex?: string }> = []
  for (const v of prod.variants || []) {
    if (v.color && !seen.has(v.color.name)) {
      seen.add(v.color.name)
      result.push({ name: v.color.name, hex: v.color.hex_code })
    }
  }
  return result
}

function getProductSizes(prod: any) {
  const seen = new Set<string>()
  const result: Array<{ name: string }> = []
  for (const v of prod.variants || []) {
    if (v.size && !seen.has(v.size.name)) {
      seen.add(v.size.name)
      result.push({ name: v.size.name })
    }
  }
  return result
}

function getSelectedColor(prodId: string): string | undefined {
  return selectedCardColors.value[prodId] || undefined
}

function setSelectedColor(prodId: string, colorName: string) {
  selectedCardColors.value[prodId] = colorName
}

function getSelectedSize(prodId: string): string | undefined {
  return selectedCardSizes.value[prodId] || undefined
}

function setSelectedSize(prodId: string, sizeName: string) {
  selectedCardSizes.value[prodId] = sizeName
}

function getResolvedPrice(prod: any): string {
  if (!prod.variants || prod.variants.length === 0) return '0.00'
  const selColor = getSelectedColor(prod.id)
  const selSize = getSelectedSize(prod.id)

  const match = prod.variants.find((v: ProductVariant) => {
    const cMatch = !selColor || v.color?.name === selColor
    const sMatch = !selSize || v.size?.name === selSize
    return cMatch && sMatch
  })

  const target = match || prod.variants[0]
  return Number(target.selling_price).toFixed(2)
}

function handleResetAllFilters() {
  searchQuery.value = ''
  resetFilters()
}

/**
 * Clear search input and tell the composable to re-fetch without a search term.
 * Called from the filter bar X button.
 */
function clearSearch() {
  searchQuery.value = ''
  applySearch('')
}

// ── Actions: Product & Variant Selection ──────────────────────────
function handleProductCardClick(prod: any) {
  // Clicking the card body always opens the variant picker for multi-variant products
  if (prod.variants.length > 1) {
    variantPickerProduct.value = prod
  } else if (prod.variants.length === 1) {
    addSpecificVariant({ ...prod.variants[0], product: prod.variants[0].product || prod })
  }
}

function quickAddProduct(prod: any) {
  // Single variant: add directly
  if (prod.variants.length === 1) {
    addSpecificVariant({ ...prod.variants[0], product: prod.variants[0].product || prod })
    return
  }

  const selColor = getSelectedColor(prod.id)
  const selSize = getSelectedSize(prod.id)

  // No color or size selected and multiple variants exist → open picker
  if (!selColor && !selSize) {
    variantPickerProduct.value = prod
    return
  }

  const matched = prod.variants.find((v: ProductVariant) => {
    const cMatch = !selColor || v.color?.name === selColor
    const sMatch = !selSize || v.size?.name === selSize
    return cMatch && sMatch
  })

  if (matched) {
    addSpecificVariant({ ...matched, product: matched.product || prod })
  } else {
    // Selection doesn't match any variant — open picker
    variantPickerProduct.value = prod
  }
}

function addSpecificVariant(variant: ProductVariant) {
  const enrichedVariant: ProductVariant = variant.product
    ? variant
    : variantPickerProduct.value
      ? { ...variant, product: variantPickerProduct.value }
      : variant

  const stock = getVariantStock(enrichedVariant.id)
  if (stock <= 0) {
    playError(true)
    toast.add({ title: 'Out of Stock', description: `Variant ${enrichedVariant.sku} is out of stock`, color: 'red' })
    return
  }

  const res = posStore.addVariant(enrichedVariant, 1, stock)
  playBeep(posSettings.value.soundBeep)
  if (res.reachedLimit) {
    toast.add({
      title: 'Max Stock Reached',
      description: `Only ${stock} units available for ${enrichedVariant.sku}`,
      color: 'amber',
    })
  } else {
    toast.add({
      title: 'Added to Order',
      description: `${enrichedVariant.product?.name} (${enrichedVariant.size?.name || ''} / ${enrichedVariant.color?.name || ''})`,
      color: 'green',
    })
  }
  variantPickerProduct.value = null
}

function updateCartQuantity(variantId: string, qty: number) {
  const stock = getVariantStock(variantId)
  const res = posStore.updateQuantity(variantId, qty, stock)
  if (res.reachedLimit) {
    playError(true)
    toast.add({
      title: 'Stock Limit Reached',
      description: `Maximum available inventory is ${stock}`,
      color: 'amber',
    })
  }
}

function onQtyInputChange(variantId: string, event: Event) {
  const input = event.target as HTMLInputElement
  const val = parseInt(input.value, 10)
  if (!isNaN(val)) {
    updateCartQuantity(variantId, val)
  }
}

// ── Line Item Discount ────────────────────────────────────────────
function openItemDiscountModal(item: CartItem) {
  lineDiscountItem.value = item
  lineDiscountInput.value = item.discount_amount || 0
}

function applyLineDiscount() {
  if (lineDiscountItem.value) {
    posStore.setItemDiscount(lineDiscountItem.value.variant_id, lineDiscountInput.value)
    toast.add({
      title: 'Item Discount Updated',
      description: `Discount set to $${lineDiscountInput.value.toFixed(2)}`,
      color: 'green',
    })
    lineDiscountItem.value = null
  }
}

// ── Unified Barcode & Hardware Scanner Integration ───────────────
const { processBarcode } = useBarcodeLookup({
  allVariants,
  getVariantStock,
  getLineStock,
  posStore,
  soundBeep: computed(() => posSettings.value.soundBeep),
  toast,
})

useHardwareScanner({
  onScan(scannedCode) {
    handleBarcodeScanned(scannedCode)
  },
})

// ── Actions: Barcode & Omnibar ────────────────────────────────────
async function handleBarcodeOrSkuSearch() {
  const q = searchQuery.value.trim()
  if (!q) return

  // 1. Try exact barcode/SKU/QR lookup via unified pipeline
  const added = await processBarcode(q)
  if (added) {
    searchQuery.value = ''
    return
  }

  // 2. Not an exact code → treat Enter as "select the product I searched for".
  //    One match is selected straight away (variant picker if it has several variants);
  //    several matches stay visible in the grid for the cashier to choose.
  try {
    await applySearch(q)
    const matches = paginatedProducts.value as any[]
    if (matches.length === 1) {
      const prod = matches[0]
      const single = (prod.variants?.length || 0) === 1
      handleProductCardClick(prod)
      if (single) searchQuery.value = ''
    } else if (matches.length > 1) {
      toast.add({
        title: `${matches.length} products match`,
        description: `Pick the right one from the grid for "${q}"`,
        color: 'default',
      })
    } else {
      playError(true)
      toast.add({
        title: 'Product Not Found',
        description: `No barcode, SKU or product name matches "${q}"`,
        color: 'amber',
      })
    }
  } catch {
    playError(true)
    toast.add({ title: 'Scan query failed', color: 'red' })
  }
}

async function handleBarcodeScanned(barcodeStr: string) {
  const code = barcodeStr.trim()
  if (!code) return

  // Direct addition via unified pipeline
  const added = await processBarcode(code)
  if (added) {
    searchQuery.value = ''
    return
  }

  // If not matched as exact variant, place in search query for manual review
  searchQuery.value = code
  await handleBarcodeOrSkuSearch()
}

// ── Actions: Customers ────────────────────────────────────────────
async function debouncedSearchCustomers() {
  try {
    const q = customerSearchQuery.value.trim()
    const res: any = await listCustomers({ q: q || undefined, limit: 15 })
    customerSearchResults.value = res.items || []
  } catch {
    customerSearchResults.value = []
  }
}

function selectCustomer(cust: CustomerSummary | null) {
  posStore.setCustomer(cust)
  showCustomerModal.value = false
  toast.add({
    title: cust ? 'Customer Assigned' : 'Set as Walk-in Customer',
    description: cust ? `${cust.name} (${cust.customer_code})` : 'Order reset to walk-in',
    color: 'green',
  })
}

async function createNewCustomer() {
  if (!newCustomerForm.value.name.trim()) return
  try {
    const created: any = await createCustomer({
      name: newCustomerForm.value.name.trim(),
      phone: newCustomerForm.value.phone.trim() || undefined,
      email: newCustomerForm.value.email.trim() || undefined,
    })
    selectCustomer(created)
    showNewCustomerDrawer.value = false
    newCustomerForm.value = { name: '', phone: '', email: '' }
    toast.add({ title: 'Customer registered successfully', color: 'green' })
  } catch (err: any) {
    playError(true)
    toast.add({
      title: 'Failed to create customer',
      description: err?.data?.detail || 'Please check the input',
      color: 'red',
    })
  }
}

// ── Actions: Hold & Park Orders ───────────────────────────────────
function handleHoldCart() {
  if (posStore.cart.length === 0) return
  // holdCart() in the store auto-generates a descriptive name with customer + time
  posStore.holdCart()
  broadcastCustomerDisplayState('ORDER_HELD')
  const count = posStore.heldCarts.length
  toast.add({
    title: 'Order Parked',
    description: `${count} parked order${count !== 1 ? 's' : ''} in queue.`,
    color: 'default',
  })
}

function resumeHeldCart(heldId: string) {
  posStore.resumeCart(heldId)
  showHeldOrdersModal.value = false
  broadcastCustomerDisplayState('ORDER_RESUMED')
  playBeep(posSettings.value.soundBeep)
  toast.add({
    title: 'Order Restored',
    description: 'Cart restored from parked orders.',
    color: 'green',
  })
}

// Replace native confirm() with in-UI confirmation modal
const showClearCartConfirm = ref(false)
function confirmClearCart() {
  if (posStore.cart.length === 0) return
  showClearCartConfirm.value = true
}
function executeClearCart() {
  posStore.clearCart()
  showClearCartConfirm.value = false
  notifyCustomerDisplayClear('MANUAL_CLEAR')
}

// ── Actions: Coupon & Promotions ──────────────────────────────────
async function applyCouponCode() {
  const code = couponCodeInput.value.trim()
  if (!code || posStore.cart.length === 0) return

  validatingCoupon.value = true
  try {
    const resp: any = await validateCoupon({
      code,
      cart_total: posStore.cartSubtotal,
    })

    if (resp.valid) {
      posStore.applyCoupon(code, Number(resp.discount_amount), resp.promotion?.name, resp.promotion?.id)
      couponCodeInput.value = ''
      playBeep(posSettings.value.soundBeep)
      toast.add({
        title: 'Promotion Applied!',
        description: resp.message || `Saved $${Number(resp.discount_amount).toFixed(2)}`,
        color: 'green',
      })
    } else {
      playError(true)
      toast.add({
        title: 'Invalid Coupon',
        description: resp.message || 'Coupon code is not valid for this order',
        color: 'amber',
      })
    }
  } catch (err: any) {
    playError(true)
    toast.add({
      title: 'Coupon Error',
      description: err?.data?.detail || 'Could not validate promo code',
      color: 'red',
    })
  } finally {
    validatingCoupon.value = false
  }
}

// ── Actions: Split Payment Management ─────────────────────────────
function enableSplitPaymentMode() {
  isSplitPaymentMode.value = true
  if (splitPayments.value.length === 0) {
    const half = Number((posStore.grandTotal / 2).toFixed(2))
    const remainder = Number((posStore.grandTotal - half).toFixed(2))
    splitPayments.value = [
      { payment_method: 'CASH', amount: half },
      { payment_method: 'KHQR', amount: remainder },
    ]
  }
}

function addSplitRow() {
  const rem = remainingSplitBalance.value > 0 ? remainingSplitBalance.value : 0
  splitPayments.value.push({
    payment_method: 'CASH',
    amount: rem,
  })
}

function removeSplitRow(index: number) {
  if (splitPayments.value.length > 1) {
    splitPayments.value.splice(index, 1)
  }
}

// ── Customer Facing Display BroadcastChannel & Snapshot Sync ──────
let customerDisplayChannel: BroadcastChannel | null = null
let customerDisplayHeartbeatTimer: ReturnType<typeof setInterval> | null = null
const customerDisplayOnline = ref(false)

function refreshCustomerDisplayPresence() {
  if (typeof localStorage === 'undefined') return
  try {
    customerDisplayOnline.value = isDisplayPresenceFresh(
      localStorage.getItem(getDisplayPresenceStorageKey(activeTerminalId.value)),
    )
  } catch {
    customerDisplayOnline.value = false
  }
}

/** Opens (or focuses) the Customer Display bound to this register. */
function openCustomerDisplayWindow() {
  const win = window.open(buildCustomerDisplayUrl(activeTerminalId.value), 'pos-customer-display')
  win?.focus?.()
  setTimeout(refreshCustomerDisplayPresence, 1500)
}
let displaySeqCounter = 1
const abaExpiresAtIso = ref<string | null>(null)
const activeSuccessDisplay = ref<CustomerDisplaySuccessData | null>(null)
let activeSuccessClearTimer: ReturnType<typeof setTimeout> | null = null
let isAutoClearingAfterPayment = false

function nextDisplaySeq(): number {
  displaySeqCounter = Math.max(displaySeqCounter + 1, (posStore.stateSeq || 1) + 1)
  posStore.stateSeq = displaySeqCounter
  return displaySeqCounter
}

function clearActiveSuccessDisplay() {
  activeSuccessDisplay.value = null
  if (activeSuccessClearTimer) {
    clearTimeout(activeSuccessClearTimer)
    activeSuccessClearTimer = null
  }
}

const activeTerminalId = computed(() => normalizeTerminalId(posSettings.value.terminalId))

async function syncTerminalContext() {
  try {
    const list = await listTerminals({ status_code: 'ACTIVE' })
    if (Array.isArray(list) && list.length > 0) {
      activeTerminalsList.value = list
      const currentCode = (posSettings.value.terminalId || 'POS-01').trim().toUpperCase()
      const matched = list.find((t: any) => t.code.toUpperCase() === currentCode) || list[0]
      if (matched) {
        posSettings.value.terminalId = matched.code
        posSettings.value.terminalDbId = matched.id
        if (matched.warehouse_id && !posStore.warehouseId) {
          posStore.warehouseId = matched.warehouse_id
        }
        if (matched.branch_id && !posStore.branchId) {
          posStore.branchId = matched.branch_id
        }
        saveSettings()
        posStore.setTerminal(matched.code, matched.id)
      }
    }
  } catch (err) {
    console.warn('[POS] Failed to sync terminal list:', err)
  }
}

async function pingTerminalHeartbeat() {
  if (!posSettings.value.terminalDbId) return
  try {
    await sendTerminalHeartbeat(posSettings.value.terminalDbId)
  } catch {
    // Non-blocking background heartbeat
  }
}

function switchTerminal(term: any) {
  if (!term) return
  if (posSettings.value.deviceLockEnabled && posSettings.value.terminalId !== term.code) {
    pendingSwitchTerminal.value = term
    pinActionType.value = 'SWITCH_TERMINAL'
    pinErrorMessage.value = ''
    managerPinInput.value = ''
    showPinModal.value = true
    return
  }
  executeSwitchTerminal(term)
}

function executeSwitchTerminal(term: any) {
  posSettings.value.terminalId = term.code
  posSettings.value.terminalDbId = term.id
  if (term.warehouse_id) {
    posStore.warehouseId = term.warehouse_id
  }
  if (term.branch_id) {
    posStore.branchId = term.branch_id
  }
  saveSettings()
  posStore.setTerminal(term.code, term.id)
  showTerminalSelectModal.value = false
  broadcastCustomerDisplayState('INITIAL_LOAD')
  pingTerminalHeartbeat()
  checkActiveShift()
  toast.add({
    title: 'POS Station Switched',
    description: `Active register changed to ${term.code} (${term.name}).`,
    color: 'green',
  })
}

function handleToggleEnrollmentLock() {
  if (posSettings.value.deviceLockEnabled) {
    pinActionType.value = 'TOGGLE_LOCK'
    pinErrorMessage.value = ''
    managerPinInput.value = ''
    showPinModal.value = true
  } else {
    enrollDevice(posSettings.value.terminalId)
    toast.add({
      title: 'Workstation Enrolled',
      description: `Physical register locked to ${posSettings.value.terminalId}.`,
      color: 'green',
    })
  }
}

function submitManagerPin() {
  if (!verifyManagerPin(managerPinInput.value)) {
    pinErrorMessage.value = 'Incorrect Manager PIN. Access denied.'
    playError(true)
    return
  }

  showPinModal.value = false
  if (pinActionType.value === 'SWITCH_TERMINAL' && pendingSwitchTerminal.value) {
    if (posSettings.value.deviceLockEnabled) {
      enrollDevice(pendingSwitchTerminal.value.code)
    }
    executeSwitchTerminal(pendingSwitchTerminal.value)
    pendingSwitchTerminal.value = null
  } else if (pinActionType.value === 'TOGGLE_LOCK') {
    unlockDevice(managerPinInput.value)
    toast.add({
      title: 'Station Unlocked',
      description: 'Device registration lock removed. Registers can now be switched freely.',
      color: 'default',
    })
  }
}

// ── Cashier Shift Actions & Drawer Reconciliation ───────────────────
async function checkActiveShift() {
  try {
    loadingShift.value = true
    const terminalDbId = posSettings.value.terminalDbId || undefined
    const res = await getActiveShift(terminalDbId)
    if (res && res.id) {
      activeShift.value = res
      showShiftOpenModal.value = false
    } else {
      activeShift.value = null
      showShiftOpenModal.value = true
    }
  } catch (err: any) {
    activeShift.value = null
    showShiftOpenModal.value = true
  } finally {
    loadingShift.value = false
  }
}

async function handleOpenShiftModalClick() {
  if (activeShift.value) {
    try {
      loadingShift.value = true
      activeShiftSummary.value = await getShiftSummary(activeShift.value.id)
      showShiftCloseModal.value = true
    } catch (err: any) {
      toast.add({
        title: 'Shift Details',
        description: err?.data?.detail || 'Failed to load shift summary',
        color: 'red',
      })
    } finally {
      loadingShift.value = false
    }
  } else {
    showShiftOpenModal.value = true
  }
}

async function handleOpenShift(payload: { openingFloatUsd: number; openingFloatKhr: number; notes: string }) {
  if (!posSettings.value.terminalDbId) {
    await syncTerminalContext()
  }
  if (!posSettings.value.terminalDbId) {
    shiftOpenError.value = 'No valid POS Terminal ID found. Please verify register station selection.'
    return
  }
  try {
    openingShift.value = true
    shiftOpenError.value = null
    const res = await openShift({
      terminal_id: posSettings.value.terminalDbId,
      opening_float_usd: payload.openingFloatUsd,
      opening_float_khr: payload.openingFloatKhr,
      notes: payload.notes,
    })
    activeShift.value = res
    showShiftOpenModal.value = false
    toast.add({
      title: 'Shift Opened',
      description: `Shift active on ${activeTerminalId.value}. Float: $${payload.openingFloatUsd.toFixed(2)}.`,
      color: 'green',
    })
  } catch (err: any) {
    shiftOpenError.value = err?.data?.detail || err?.message || 'Failed to open shift'
  } finally {
    openingShift.value = false
  }
}

async function handleCloseShift(payload: { closingCashUsd: number; closingCashKhr: number; notes: string }) {
  if (!activeShift.value) return
  try {
    closingShift.value = true
    shiftCloseError.value = null
    const summary = await closeShift(activeShift.value.id, {
      closing_cash_usd: payload.closingCashUsd,
      closing_cash_khr: payload.closingCashKhr,
      notes: payload.notes,
    })
    shiftZReportData.value = summary
    activeShift.value = null
    showShiftCloseModal.value = false
    showShiftZReportModal.value = true
    toast.add({
      title: 'Shift Closed & Settled',
      description: `Drawer discrepancy: ${Number(summary.discrepancy_usd || 0) >= 0 ? '+' : ''}$${Number(summary.discrepancy_usd || 0).toFixed(2)}.`,
      color: 'green',
    })
  } catch (err: any) {
    shiftCloseError.value = err?.data?.detail || err?.message || 'Failed to close shift'
  } finally {
    closingShift.value = false
  }
}

function getCustomerDisplayChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!customerDisplayChannel) {
    customerDisplayChannel = new BroadcastChannel(CUSTOMER_DISPLAY_CHANNEL)
    customerDisplayChannel.onmessage = (e) => {
      if (e.data?.type === 'REQUEST_INITIAL_STATE') {
        const reqTerm = e.data?.terminalId ? normalizeTerminalId(e.data.terminalId) : null
        if (!reqTerm || reqTerm === activeTerminalId.value) {
          broadcastCustomerDisplayState('INITIAL_LOAD')
        }
      }
    }
  }
  return customerDisplayChannel
}

function resolveCurrentKhqrDisplayState(): CustomerDisplayKhqrData | null {
  const isKhqrFlowActive =
    showAbaFullScreen.value ||
    (showPaymentModal.value &&
      selectedPaymentMethod.value === 'ABA_KHQR' &&
      Boolean(abaLoading.value || abaQrImage.value || abaError.value || abaStatus.value))

  if (!isKhqrFlowActive) return null

  let status: CustomerDisplayKhqrStatus = 'PENDING'
  if (abaLoading.value) status = 'LOADING'
  else if (abaError.value) status = 'FAILED'
  else if (abaStatus.value === 'APPROVED') status = 'APPROVED'
  else if (abaStatus.value === 'EXPIRED') status = 'EXPIRED'
  else if (abaStatus.value === 'DECLINED' || abaStatus.value === 'FAILED') status = 'DECLINED'
  else if (abaVerifying.value || abaStatus.value === 'PROCESSING') status = 'VERIFYING'
  else status = 'PENDING'

  const amount = roundCurrency(posStore.grandTotal)
  return {
    saleId: abaCurrentSaleId.value || '',
    paymentId: abaPaymentId.value || '',
    tranId: abaTranId.value || '',
    amount,
    khrAmount: toKhrAmount(amount, KHR_EXCHANGE_RATE),
    qrImage: abaQrImage.value || '',
    qrString: abaQrString.value || '',
    status,
    error: abaError.value || null,
    verifying: abaVerifying.value,
    apv: abaApv.value || null,
    expiresAt: abaExpiresAtIso.value || null,
    secondsLeft: Math.max(0, abaSecondsLeft.value || 0),
  }
}

function buildCurrentDisplaySnapshot(
  reason: CustomerDisplayTransitionReason = 'CART_UPDATED',
): CustomerDisplaySnapshot {
  const seq = nextDisplaySeq()
  const now = Date.now()
  const items = posStore.cart.map(mapCartItemToDisplayItem)
  const khqrData = resolveCurrentKhqrDisplayState()

  let screenState: CustomerDisplayScreenState = 'IDLE'
  if (activeSuccessDisplay.value && items.length === 0) {
    screenState = 'PAYMENT_SUCCESS'
  } else if (khqrData) {
    screenState = 'PAYMENT_QR'
  } else if (items.length > 0) {
    screenState = 'CART_ACTIVE'
  } else {
    screenState = 'IDLE'
  }

  let checkoutPhase: CustomerDisplayCheckoutPhase = 'SHOPPING'
  if (isAbaModalActive.value) {
    checkoutPhase = 'CARD_PROCESSING'
  } else if (showPaymentModal.value && items.length > 0) {
    checkoutPhase = 'PAYMENT_SELECTION'
  }

  const subtotal = roundCurrency(posStore.cartSubtotal)
  const itemDiscountsTotal = roundCurrency(posStore.itemDiscountsTotal)
  const orderDiscount = roundCurrency(posStore.discountAmount)
  const totalDiscount = roundCurrency(posStore.totalDiscount)
  const taxAmount = roundCurrency(posStore.taxAmount)
  const grandTotal = roundCurrency(posStore.grandTotal)

  return {
    version: 1,
    seq,
    timestamp: now,
    terminalId: activeTerminalId.value,
    orderSessionId:
      screenState === 'PAYMENT_SUCCESS' && activeSuccessDisplay.value
        ? activeSuccessDisplay.value.orderSessionId
        : posStore.orderSessionId,
    reason,
    storeName: posSettings.value.receiptStoreName || 'Clothing Store Phnom Penh',
    branchName: activeBranchName.value || 'Main Flagship Store',
    receiptFooterNote:
      posSettings.value.receiptFooterNote ||
      'Thank you for shopping with us! Items can be exchanged within 7 days.',
    exchangeRate: KHR_EXCHANGE_RATE,
    state: screenState,
    checkoutPhase,
    customerName: posStore.selectedCustomer?.name || null,
    customerTier: posStore.selectedCustomer?.loyalty_account?.tier || null,
    items,
    totalItemsCount: posStore.itemCount,
    uniqueItemsCount: posStore.uniqueItemCount,
    subtotal,
    itemDiscountsTotal,
    orderDiscount,
    totalDiscount,
    appliedCouponCode: posStore.appliedCoupon?.code || null,
    appliedCouponName: posStore.appliedCoupon?.name || null,
    taxRate: posStore.taxRate,
    taxAmount,
    grandTotal,
    khrGrandTotal: toKhrAmount(grandTotal, KHR_EXCHANGE_RATE),
    lastUpdatedVariantId: posStore.lastUpdatedVariantId || null,
    khqr: khqrData,
    success: screenState === 'PAYMENT_SUCCESS' ? activeSuccessDisplay.value : null,
    closedOrderSessions: [...posStore.closedOrderSessions],
  }
}

function broadcastCustomerDisplayState(
  reason: CustomerDisplayTransitionReason = 'CART_UPDATED',
): CustomerDisplaySnapshot {
  const snapshot = buildCurrentDisplaySnapshot(reason)
  saveDisplaySnapshotToStorage(snapshot)
  emitCustomerDisplayHeartbeat(snapshot)
  const ch = getCustomerDisplayChannel()
  if (ch) {
    ch.postMessage({
      type: 'SYNC_SNAPSHOT',
      terminalId: snapshot.terminalId,
      seq: snapshot.seq,
      timestamp: snapshot.timestamp,
      orderSessionId: snapshot.orderSessionId,
      snapshot,
    })
  }
  return snapshot
}

function emitCustomerDisplayHeartbeat(snapshot?: CustomerDisplaySnapshot) {
  const now = Date.now()
  const termId = snapshot ? snapshot.terminalId : activeTerminalId.value
  const hb = {
    terminalId: termId,
    seq: snapshot ? snapshot.seq : displaySeqCounter,
    timestamp: now,
    orderSessionId: posStore.orderSessionId,
    state: snapshot ? snapshot.state : (posStore.cart.length > 0 ? 'CART_ACTIVE' : 'IDLE'),
  }
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const serialized = JSON.stringify(hb)
      localStorage.setItem(getHeartbeatStorageKey(termId), serialized)
      localStorage.setItem(CUSTOMER_DISPLAY_HEARTBEAT_KEY, serialized)
    } catch { /* ignore */ }
  }
  const ch = getCustomerDisplayChannel()
  if (ch) {
    ch.postMessage({
      type: 'HEARTBEAT',
      ...hb,
    })
  }
}

function syncCustomerDisplayCart() {
  if (isAutoClearingAfterPayment) return
  if (posStore.cart.length > 0 && activeSuccessDisplay.value) {
    // Cashier started adding items for the next customer; dismiss previous payment success immediately
    clearActiveSuccessDisplay()
  }
  broadcastCustomerDisplayState(posStore.cart.length > 0 ? 'CART_UPDATED' : 'MANUAL_CLEAR')
}

function notifyCustomerDisplayKhqr(tx: any) {
  clearActiveSuccessDisplay()
  if (tx?.expires_at) {
    abaExpiresAtIso.value = tx.expires_at
  }
  broadcastCustomerDisplayState('KHQR_PENDING')
}

function notifyCustomerDisplayCountdown(secondsLeft: number) {
  abaSecondsLeft.value = Math.max(0, secondsLeft)
  broadcastCustomerDisplayState(secondsLeft <= 0 ? 'KHQR_EXPIRED' : 'KHQR_COUNTDOWN')
}

function notifyCustomerDisplaySuccess(opts?: {
  paymentId?: string
  orderSessionId?: string
  invoiceNumber?: string
  amount?: number
  paymentMethod?: string
  tenderedAmount?: number | null
  changeDue?: number
  itemCount?: number
}) {
  const confirmedAmount = roundCurrency(Number(opts?.amount ?? posStore.grandTotal))
  const completedSessionId = opts?.orderSessionId || posStore.orderSessionId
  const now = Date.now()
  const payId = String(
    opts?.paymentId || opts?.invoiceNumber || abaPaymentId.value || abaTranId.value || `${completedSessionId}_${now}`,
  )

  if (completedSessionId) {
    posStore.recordClosedSession(completedSessionId)
  }

  clearActiveSuccessDisplay()
  activeSuccessDisplay.value = {
    paymentId: payId,
    orderSessionId: completedSessionId,
    invoiceNumber: opts?.invoiceNumber || '',
    amount: confirmedAmount,
    khrAmount: toKhrAmount(confirmedAmount, KHR_EXCHANGE_RATE),
    paymentMethod: opts?.paymentMethod || 'ABA KHQR',
    tenderedAmount:
      opts?.tenderedAmount !== undefined && opts?.tenderedAmount !== null
        ? roundCurrency(Number(opts.tenderedAmount))
        : null,
    changeDue: roundCurrency(Math.max(0, Number(opts?.changeDue) || 0)),
    itemCount: Number(opts?.itemCount ?? posStore.itemCount ?? 0),
    completedAt: now,
  }

  broadcastCustomerDisplayState('PAYMENT_APPROVED')

  activeSuccessClearTimer = setTimeout(() => {
    if (activeSuccessDisplay.value?.paymentId === payId) {
      activeSuccessDisplay.value = null
      if (posStore.cart.length === 0) {
        broadcastCustomerDisplayState('POST_PAYMENT_CLEAR')
      }
    }
  }, PAYMENT_SUCCESS_DURATION_MS)
}

function notifyCustomerDisplayCancel() {
  broadcastCustomerDisplayState('PAYMENT_CANCELLED')
}

function notifyCustomerDisplayClear(reason: CustomerDisplayTransitionReason = 'MANUAL_CLEAR') {
  clearActiveSuccessDisplay()
  broadcastCustomerDisplayState(reason)
}

watch(
  () => [
    posStore.cart,
    posStore.totalDiscount,
    posStore.taxAmount,
    posStore.selectedCustomerId,
    posStore.appliedCoupon,
    activeBranchName.value,
  ],
  syncCustomerDisplayCart,
  { deep: true },
)

// ── Actions: Payment & Checkout ───────────────────────────────────
function openCheckoutModal() {
  if (posStore.cart.length === 0) return
  tenderAmount.value = Number(posStore.grandTotal.toFixed(2))
  isSplitPaymentMode.value = false
  splitPayments.value = []
  // Reset ABA state
  abaResetState()
  showPaymentModal.value = true
  broadcastCustomerDisplayState('CHECKOUT_OPENED')
}

function abaResetState() {
  dismissAbaCheckoutModal()
  abaLoading.value = false
  abaVerifying.value = false
  abaError.value = null
  abaStatus.value = ''
  abaQrImage.value = null
  abaQrString.value = null
  abaCheckoutUrl.value = null
  abaApv.value = null
  abaTranId.value = null
  abaSecondsLeft.value = 0
  abaExpiresAtIso.value = null
  abaCancelling.value = false
  abaPaymentId.value = null
  abaCurrentSaleId.value = null
  abaStopPolling()
}

function abaStopPolling() {
  if (abaPollTimer.value) { clearInterval(abaPollTimer.value); abaPollTimer.value = null }
  if (abaCountdownTimer.value) { clearInterval(abaCountdownTimer.value); abaCountdownTimer.value = null }
}

/**
 * Payment APPROVED by ABA. The backend has already completed the sale, so we
 * only fetch the final invoice number, show the receipt and reset the lane.
 */
async function abaHandleApproved() {
  abaStopPolling()
  dismissAbaCheckoutModal()
  abaStatus.value = 'APPROVED'
  playAbaChime(posSettings.value.soundSuccess)

  const saleId = abaCurrentSaleId.value
  const completedOrderSessionId = posStore.orderSessionId
  const confirmedTotal = posStore.grandTotal
  const confirmedItemsCount = posStore.itemCount
  const payId = abaPaymentId.value || abaTranId.value || saleId || `pay_${Date.now()}`
  const methodLabel = selectedPaymentMethod.value === 'CARD' ? 'Credit Card' : 'ABA KHQR'

  // Immediately broadcast payment confirmation to the customer display
  notifyCustomerDisplaySuccess({
    paymentId: payId,
    orderSessionId: completedOrderSessionId,
    invoiceNumber: '',
    amount: confirmedTotal,
    paymentMethod: methodLabel,
    tenderedAmount: null,
    changeDue: 0,
    itemCount: confirmedItemsCount,
  })

  let invoiceNumber = ''
  try {
    if (saleId) {
      const saleData: any = await getSale(saleId)
      invoiceNumber = saleData?.invoice_number || ''
      if (invoiceNumber && activeSuccessDisplay.value?.paymentId === payId) {
        activeSuccessDisplay.value.invoiceNumber = invoiceNumber
        broadcastCustomerDisplayState('PAYMENT_APPROVED')
      }
    }
  } catch { /* receipt still shown without invoice number */ }

  const methodDisplay = selectedPaymentMethod.value === 'CARD'
    ? `Credit Card (APV: ${abaApv.value || 'APPROVED'})`
    : 'ABA KHQR'

  completedReceipt.value = {
    invoice_number: invoiceNumber,
    date: new Date().toLocaleString(),
    customerName: posStore.selectedCustomer?.name || 'Walk-in Customer',
    couponCode: posStore.appliedCoupon?.code || null,
    items: posStore.cart.map((i) => ({
      variant_id: i.variant_id,
      sku: i.variant.sku || '',
      name: i.variant.product?.name || 'Product',
      variantInfo: `${i.variant.color?.name || ''} ${i.variant.size?.name || ''}`.trim(),
      quantity: i.quantity,
      price: i.unit_price,
      discount: i.discount_amount || 0,
      total: i.subtotal,
    })),
    subtotal: posStore.cartSubtotal,
    discount: posStore.totalDiscount,
    tax: posStore.taxAmount,
    grandTotal: posStore.grandTotal,
    tenderedAmount: posStore.grandTotal,
    payments: [{ payment_method: methodDisplay, amount: posStore.grandTotal, reference_number: abaApv.value || abaTranId.value || undefined }],
    change: 0,
  }
  lastCompletedReceipt.value = completedReceipt.value

  // Smooth celebration transition on full-screen kiosk before presenting receipt.
  // Wrap clearCart() with isAutoClearingAfterPayment so the deep cart watcher
  // does not wipe the customer display's 5-second PAYMENT_SUCCESS confirmation screen.
  setTimeout(() => {
    isAutoClearingAfterPayment = true
    try {
      posStore.clearCart()
    } finally {
      isAutoClearingAfterPayment = false
    }
    orderNotes.value = ''
    abaResetState()
    showPaymentModal.value = false
    showAbaFullScreen.value = false
    showReceiptModal.value = true
    loadStocks()
    toast.add({ title: 'Payment Confirmed', description: `${methodDisplay} approved`, color: 'green' })
  }, 1200)
}

async function verifyAbaPaymentNow() {
  if (!abaPaymentId.value || abaVerifying.value) return
  abaVerifying.value = true
  broadcastCustomerDisplayState('KHQR_VERIFYING')
  try {
    const status = await getPaymentStatus(abaPaymentId.value)
    abaStatus.value = status.status
    if (status.apv) abaApv.value = status.apv

    if (status.status === 'APPROVED') {
      await abaHandleApproved()
    } else if (status.status === 'DECLINED' || status.status === 'EXPIRED') {
      abaStopPolling()
      playError(true)
      broadcastCustomerDisplayState(status.status === 'EXPIRED' ? 'KHQR_EXPIRED' : 'KHQR_FAILED')
      toast.add({ title: 'Payment Failed', description: `Status: ${status.status}`, color: 'red' })
    }
  } catch {
    // Transient network error — keep current state and continue polling
  } finally {
    abaVerifying.value = false
    if (abaStatus.value === 'PENDING') {
      broadcastCustomerDisplayState('KHQR_COUNTDOWN')
    }
  }
}

async function abaStartKhqr(saleId: string) {
  abaLoading.value = true
  abaError.value = null
  abaStatus.value = ''
  abaStopPolling()
  broadcastCustomerDisplayState('KHQR_LOADING')
  try {
    const tx: any = await createKhqr(saleId)
    abaPaymentId.value = tx.id
    abaQrImage.value = tx.qr_image
    abaQrString.value = tx.qr_string
    abaCheckoutUrl.value = tx.checkout_url || null
    abaStatus.value = tx.status
    abaTranId.value = tx.tran_id || tx.id
    abaExpiresAtIso.value = tx.expires_at || null

    // Countdown
    if (tx.expires_at) {
      const expMs = new Date(tx.expires_at).getTime()
      abaSecondsLeft.value = Math.max(0, Math.round((expMs - Date.now()) / 1000))
      abaCountdownTimer.value = setInterval(async () => {
        abaSecondsLeft.value = Math.max(0, abaSecondsLeft.value - 1)
        notifyCustomerDisplayCountdown(abaSecondsLeft.value)
        if (abaSecondsLeft.value <= 0 && abaStatus.value === 'PENDING') {
          if (abaCountdownTimer.value) {
            clearInterval(abaCountdownTimer.value)
            abaCountdownTimer.value = null
          }
          await verifyAbaPaymentNow()
          if (abaStatus.value === 'PENDING') {
            abaStatus.value = 'EXPIRED'
            abaStopPolling()
            broadcastCustomerDisplayState('KHQR_EXPIRED')
          }
        }
      }, 1000)
    }

    notifyCustomerDisplayKhqr(tx)

    // Poll every 3 seconds
    abaPollTimer.value = setInterval(async () => {
      await verifyAbaPaymentNow()
    }, 3000)
  } catch (err: any) {
    abaError.value = err?.data?.detail || err?.message || 'Failed to generate QR'
    playError(true)
    broadcastCustomerDisplayState('KHQR_FAILED')
  } finally {
    abaLoading.value = false
  }
}

async function handleAbaCancel() {
  dismissAbaCheckoutModal()
  if (!abaPaymentId.value) {
    showAbaFullScreen.value = false
    abaResetState()
    notifyCustomerDisplayCancel()
    return
  }
  abaCancelling.value = true
  notifyCustomerDisplayCancel()
  try {
    await cancelPayment(abaPaymentId.value)
    abaStopPolling()
    abaStatus.value = 'CANCELLED'
    // Cancel the DRAFT sale
    if (abaCurrentSaleId.value) {
      try { await cancelSale(abaCurrentSaleId.value) } catch (e) { /* ignore */ }
    }
    abaResetState()
    showAbaFullScreen.value = false
    notifyCustomerDisplayCancel()
    toast.add({ title: 'Payment Cancelled', description: 'Order & cart preserved in POS', color: 'default' })
  } catch (err: any) {
    if (err?.status === 409 || err?.statusCode === 409) {
      // Customer paid just before cancel — keep polling, it will resolve to APPROVED.
      toast.add({ title: 'Payment already received', description: err?.data?.detail || 'Finalizing sale…', color: 'amber' })
    } else {
      toast.add({ title: 'Cancel Failed', description: err?.data?.detail || 'Error', color: 'red' })
    }
  } finally {
    abaCancelling.value = false
  }
}

async function startAbaFullScreenCheckout() {
  if (posStore.cart.length === 0) return
  showPaymentModal.value = false
  showAbaFullScreen.value = true
  selectedPaymentMethod.value = 'ABA_KHQR'
  await handleFinalizeSale()
}

async function startAbaModalCheckout(paymentOption: string = 'cards') {
  if (posStore.cart.length === 0) return
  if (abaLoading.value) return // already creating a card checkout — ignore repeat clicks
  abaLoading.value = true
  abaError.value = null
  abaStatus.value = ''
  abaStopPolling()

  try {
    selectedPaymentMethod.value = 'CARD'

    // 1. Create or re-use DRAFT sale
    let saleId = abaCurrentSaleId.value
    if (!saleId) {
      const salePayload = {
        branch_id: posStore.branchId || null,
        warehouse_id: posStore.warehouseId || null,
        terminal_id: posSettings.value.terminalDbId || undefined,
        shift_id: activeShift.value?.id || undefined,
        customer_id: posStore.selectedCustomerId,
        discount_amount: posStore.discountAmount + posStore.redeemedPointsDiscount, // order-level discount + redeemed loyalty points
        tax_amount: posStore.taxAmount,
        notes: orderNotes.value.trim() || undefined,
        promotion_id: posStore.appliedCoupon?.promotion_id || undefined,
        items: posStore.cart.map((i) => ({
          variant_id: i.variant_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount_amount: i.discount_amount || 0,
        })),
      }
      const saleRes: any = await createSale(salePayload)
      saleId = saleRes.id
      abaCurrentSaleId.value = saleId
    }

    // 2. Obtain form payload with HMAC-SHA512 hash
    const formResp = await createPurchaseForm(saleId!, paymentOption)
    abaPaymentId.value = formResp.payment_id
    abaTranId.value = formResp.tran_id
    abaStatus.value = 'PENDING'

    // 3. Launch ABA PayWay popup modal overlay
    const ok = await launchAbaCheckoutModal({
      action_url: formResp.action_url,
      form_data: formResp.form_data,
    })

    if (!ok) {
      throw new Error(abaModalError.value || 'Failed to initialize ABA checkout window')
    }

    // 4. Poll every 2.5s for completion
    abaPollTimer.value = setInterval(async () => {
      if (!abaPaymentId.value) return
      try {
        const status = await getPaymentStatus(abaPaymentId.value)
        abaStatus.value = status.status
        if (status.apv) abaApv.value = status.apv

        if (status.status === 'APPROVED') {
          dismissAbaCheckoutModal()
          await abaHandleApproved()
        } else if (status.status === 'DECLINED' || status.status === 'EXPIRED') {
          abaStopPolling()
          dismissAbaCheckoutModal()
          playError(true)
          toast.add({ title: 'Payment Failed', description: `Status: ${status.status}`, color: 'red' })
        }
      } catch (e) {
        // Network glitch — keep polling
      }
    }, 2500)
  } catch (err: any) {
    abaError.value = err?.data?.detail || err?.message || 'Failed to start card payment'
    playError(true)
    toast.add({
      title: 'Checkout Error',
      description: abaError.value || undefined,
      color: 'red',
    })
  } finally {
    abaLoading.value = false
  }
}

async function handleAbaRetry() {
  // Capture the sale id BEFORE abaResetState() clears it, otherwise a null id is sent.
  const saleId = abaCurrentSaleId.value
  if (!saleId) return
  abaResetState()
  abaCurrentSaleId.value = saleId
  await abaStartKhqr(saleId)
}

/**
 * Payment modal was closed (X / backdrop / Cancel) while an ABA QR or draft sale
 * was still open. Close the QR at ABA and cancel the DRAFT sale so a stale QR can
 * never be paid after the cashier has walked away.
 */
async function abaCleanupOnClose() {
  const payId = abaPaymentId.value
  const saleId = abaCurrentSaleId.value
  if (!payId && !saleId) {
    if (!activeSuccessDisplay.value) {
      broadcastCustomerDisplayState('CHECKOUT_CLOSED')
    }
    return
  }
  const wasPending = abaStatus.value === 'PENDING'
  abaStopPolling()
  dismissAbaCheckoutModal()
  if (payId && wasPending) {
    try {
      await cancelPayment(payId)
    } catch (err: any) {
      // 409 = customer paid right before close. Complete the sale instead of cancelling.
      try {
        const st = await getPaymentStatus(payId)
        if (st.status === 'APPROVED') {
          await abaHandleApproved()
          return
        }
      } catch { /* fall through to cleanup */ }
    }
  }
  if (saleId) {
    try { await cancelSale(saleId) } catch { /* ignore */ }
  }
  abaResetState()
  notifyCustomerDisplayCancel()
  if (wasPending) {
    toast.add({ title: 'QR Cancelled', description: 'Payment window closed', color: 'default' })
  }
}

watch(showPaymentModal, (open) => {
  if (!open) abaCleanupOnClose()
})

// Stop polling and reset pending status immediately when ABA modal closes
watch(isAbaModalActive, (active) => {
  if (!active) {
    abaStopPolling()
    if (abaStatus.value === 'PENDING') {
      abaStatus.value = ''
    }
  }
})

// Clean up pending ABA checkout when cashier switches payment tabs
watch(selectedPaymentMethod, (newMethod, oldMethod) => {
  if (newMethod !== oldMethod) {
    if (isAbaModalActive.value) {
      dismissAbaCheckoutModal()
    }
    abaStopPolling()
    if (abaStatus.value === 'PENDING') {
      abaStatus.value = ''
    }
    if (oldMethod === 'ABA_KHQR' && newMethod !== 'ABA_KHQR') {
      abaQrImage.value = null
      abaQrString.value = null
      abaSecondsLeft.value = 0
      abaExpiresAtIso.value = null
      notifyCustomerDisplayCancel()
    }
  }
})

async function handleFinalizeSale() {
  // Duplicate-submission guard: ignore Enter / double-click while a sale is already being created.
  if (processingSale.value) return
  if (posStore.cart.length === 0) return

  // ── ABA KHQR branch ──────────────────────────────────────────────
  if (selectedPaymentMethod.value === 'ABA_KHQR') {
    processingSale.value = true
    try {
      // Re-use the existing DRAFT sale (e.g. after EXPIRED/DECLINED) instead of
      // creating a duplicate draft on every re-charge.
      if (abaCurrentSaleId.value) {
        await abaStartKhqr(abaCurrentSaleId.value)
        return
      }

      // Create the DRAFT sale first
      const salePayload = {
        branch_id: posStore.branchId || null,
        warehouse_id: posStore.warehouseId || null,
        terminal_id: posSettings.value.terminalDbId || undefined,
        shift_id: activeShift.value?.id || undefined,
        customer_id: posStore.selectedCustomerId,
        discount_amount: posStore.discountAmount + posStore.redeemedPointsDiscount, // order-level discount + redeemed loyalty points
        tax_amount: posStore.taxAmount,
        notes: orderNotes.value.trim() || undefined,
        promotion_id: posStore.appliedCoupon?.promotion_id || undefined,
        items: posStore.cart.map((i) => ({
          variant_id: i.variant_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount_amount: i.discount_amount || 0,
        })),
      }
      const saleRes: any = await createSale(salePayload)
      abaCurrentSaleId.value = saleRes.id

      // Generate QR (starts polling internally)
      await abaStartKhqr(saleRes.id)
    } catch (err: any) {
      playError(true)
      broadcastCustomerDisplayState('KHQR_FAILED')
      toast.add({
        title: 'Checkout Failed',
        description: err?.data?.detail || 'Error creating sale',
        color: 'red',
      })
    } finally {
      processingSale.value = false
    }
    return
  }

  // ── ABA Card Modal branch (when no manual offline EDC authorization entered) ──
  if (selectedPaymentMethod.value === 'CARD' && !paymentReferenceNumber.value.trim()) {
    await startAbaModalCheckout('cards')
    return
  }

  // ── Standard payment branch (Cash, Card with EDC ref, Bank Transfer, Split) ──
  processingSale.value = true

  try {
    // 1. Prepare payments list
    let paymentsPayload: any[] = []
    if (isSplitPaymentMode.value) {
      paymentsPayload = splitPayments.value.map((p) => ({
        payment_method: p.payment_method,
        amount: Number(p.amount),
        reference_number: p.reference_number?.trim() || undefined,
        notes: orderNotes.value.trim() || undefined,
      }))
    } else {
      paymentsPayload = [
        {
          payment_method: selectedPaymentMethod.value,
          amount: posStore.grandTotal,
          reference_number: paymentReferenceNumber.value.trim() || undefined,
          notes: orderNotes.value.trim() || undefined,
        },
      ]
    }

    // 2. Create and complete the sale in a single atomic transaction
    const salePayload = {
      branch_id: posStore.branchId || null,
      warehouse_id: posStore.warehouseId || null,
      terminal_id: posSettings.value.terminalDbId || undefined,
      shift_id: activeShift.value?.id || undefined,
      customer_id: posStore.selectedCustomerId,
      discount_amount: posStore.discountAmount + posStore.redeemedPointsDiscount, // order-level discount + redeemed loyalty points
      tax_amount: posStore.taxAmount,
      notes: orderNotes.value.trim() || undefined,
      promotion_id: posStore.appliedCoupon?.promotion_id || undefined,
      items: posStore.cart.map((i) => ({
        variant_id: i.variant_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount_amount: i.discount_amount || 0,
      })),
      payments: paymentsPayload,
    }

    const saleRes: any = await createSale(salePayload)

    const completedOrderSessionId = posStore.orderSessionId
    const confirmedGrandTotal = posStore.grandTotal
    const confirmedItemCount = posStore.itemCount
    const confirmedChangeDue = changeDue.value
    const paymentMethodLabel = isSplitPaymentMode.value
      ? 'Split Tender'
      : selectedPaymentMethod.value === 'CASH'
        ? 'Cash'
        : selectedPaymentMethod.value === 'CARD'
          ? 'Credit Card'
          : selectedPaymentMethod.value === 'BANK_TRANSFER'
            ? 'Bank Transfer'
            : selectedPaymentMethod.value

    const tenderedAmountForDisplay = !isSplitPaymentMode.value && selectedPaymentMethod.value === 'CASH'
      ? Number(tenderAmount.value.toFixed(2))
      : isSplitPaymentMode.value
        ? Number(totalSplitAmount.value.toFixed(2))
        : null

    // 3. Prepare receipt data for print
    completedReceipt.value = {
      invoice_number: saleRes.invoice_number,
      date: new Date().toLocaleString(),
      customerName: posStore.selectedCustomer?.name || 'Walk-in Customer',
      couponCode: posStore.appliedCoupon?.code || null,
      items: posStore.cart.map((i) => ({
        variant_id: i.variant_id,
        sku: i.variant.sku || '',
        name: i.variant.product?.name || 'Product',
        variantInfo: `${i.variant.color?.name || ''} ${i.variant.size?.name || ''}`.trim(),
        quantity: i.quantity,
        price: i.unit_price,
        discount: i.discount_amount || 0,
        total: i.subtotal,
      })),
      subtotal: posStore.cartSubtotal,
      discount: posStore.totalDiscount,
      tax: posStore.taxAmount,
      grandTotal: posStore.grandTotal,
      tenderedAmount: tenderedAmountForDisplay,
      payments: paymentsPayload,
      change: confirmedChangeDue,
    }
    lastCompletedReceipt.value = completedReceipt.value

    // 4. Notify customer display with payment confirmation, tendered amount, and change due
    notifyCustomerDisplaySuccess({
      paymentId: saleRes.id || saleRes.invoice_number || `sale_${Date.now()}`,
      orderSessionId: completedOrderSessionId,
      invoiceNumber: saleRes.invoice_number || '',
      amount: confirmedGrandTotal,
      paymentMethod: paymentMethodLabel,
      tenderedAmount: tenderedAmountForDisplay,
      changeDue: confirmedChangeDue,
      itemCount: confirmedItemCount,
    })

    // 5. Optimistically update local inventory stocks in memory immediately
    for (const item of posStore.cart) {
      const currentQty = inventoryMap.value[item.variant_id]
      if (typeof currentQty === 'number') {
        inventoryMap.value[item.variant_id] = Math.max(0, currentQty - item.quantity)
      }
    }

    // 5B. Adjust customer loyalty points if redeemed
    if (posStore.redeemedLoyaltyPoints > 0 && posStore.selectedCustomerId) {
      adjustPoints(posStore.selectedCustomerId, {
        points: -posStore.redeemedLoyaltyPoints,
        note: `Redeemed on ${saleRes.invoice_number}`,
      }).catch((e: any) => console.warn('Loyalty points adjustment background error:', e))
    }

    // 6. Play audio chime and transition without immediately wiping the customer display's 5s confirmation screen
    playSuccess(posSettings.value.soundSuccess)
    isAutoClearingAfterPayment = true
    try {
      posStore.clearCart()
    } finally {
      isAutoClearingAfterPayment = false
    }
    orderNotes.value = ''
    paymentReferenceNumber.value = ''
    showPaymentModal.value = false
    showReceiptModal.value = true

    // Refresh remote stocks detached in background
    loadStocks().catch(() => {})

    toast.add({
      title: 'Sale Completed Successfully',
      description: `Invoice ${saleRes.invoice_number} generated`,
      color: 'green',
    })
  } catch (err: any) {
    playError(true)
    toast.add({
      title: 'Checkout Failed',
      description: err?.data?.detail || 'Error processing transaction',
      color: 'red',
    })
  } finally {
    processingSale.value = false
  }
}


function handlePrintReceipt() {
  window.print()
}

function reprintLastReceipt() {
  if (!lastCompletedReceipt.value) return
  completedReceipt.value = lastCompletedReceipt.value
  showReceiptModal.value = true
}

function viewOrderReceipt(order: any) {
  completedReceipt.value = order
  showReceiptModal.value = true
}

function reprintOrderReceipt(order: any) {
  completedReceipt.value = order
  showReceiptModal.value = true
  nextTick(() => {
    handlePrintReceipt()
  })
}

function openStickerModal() {
  if (posStore.cart.length > 0) {
    stickerInitialVariants.value = posStore.cart.map((i) => ({
      variant: i.variant,
      quantity: i.quantity,
    }))
  } else if (allVariants.value.length > 0) {
    stickerInitialVariants.value = [{ variant: allVariants.value[0]!, quantity: 1 }]
  } else {
    stickerInitialVariants.value = []
  }
  showStickerModal.value = true
}

function openStickerModalForVariant(variant: ProductVariant) {
  variantPickerProduct.value = null
  stickerInitialVariants.value = [{ variant, quantity: 1 }]
  showStickerModal.value = true
}

function startNewSale() {
  showReceiptModal.value = false
  completedReceipt.value = null
  if (posStore.cart.length === 0) {
    notifyCustomerDisplayClear('START_NEW_SALE')
  }
  searchOmnibarRef.value?.focus()
}

// ── Initial Data Fetching ─────────────────────────────────────────
async function loadCatalog() {
  try {
    const [categoriesRes, brandsRes, branchRes] = await Promise.allSettled([
      listCategories({ limit: 100 }),
      listBrands({ limit: 100 }),
      listBranches(),
    ])

    if (categoriesRes.status === 'fulfilled') {
      categoryList.value = (categoriesRes.value as Array<{ id: string; name: string }>) || []
    }
    if (brandsRes.status === 'fulfilled') {
      brandList.value = (brandsRes.value as Array<{ id: string; name: string; logo_url?: string }>) || []
    }
    if (branchRes.status === 'fulfilled' && branchRes.value?.length) {
      branches.value = branchRes.value
      // Only set branch/warehouse if not already set from a persisted session
      if (!posStore.branchId) posStore.branchId = branchRes.value[0]!.id
      if (!posStore.warehouseId && branchRes.value[0]!.warehouses?.length) {
        posStore.warehouseId = branchRes.value[0]!.warehouses![0]!.id
      }
    }
  } catch (err: any) {
    console.error('Failed to load initial POS catalog metadata:', err)
  }

  // Server-side product fetch handled by posProducts composable
  await fetchProducts()
  // Background prefetch for full offline barcode scanning resilience
  offlineCatalog?.prefetchFullCatalog(listProducts).catch(() => {})
  // Synchronize remote receipt template and store settings in background
  const settingsApi = useSystemSettingsApi()
  fetchRemoteSettings(settingsApi).catch(() => {})
}

async function loadStocks() {
  try {
    const stocks: any = await listStocks({ limit: 500 })
    const map: Record<string, number> = {}
    for (const s of stocks) {
      map[s.variant_id] = s.quantity
    }
    inventoryMap.value = map
  } catch (err) {
    console.error('Failed to load stock levels:', err)
  }
}

// ── Keyboard Shortcuts Listener ───────────────────────────────────
function handleGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'F1') {
    e.preventDefault()
    showShortcutsModal.value = !showShortcutsModal.value
  } else if (e.key === 'F2') {
    e.preventDefault()
    searchOmnibarRef.value?.focus()
    searchOmnibarRef.value?.select()
  } else if (e.key === 'F4') {
    e.preventDefault()
    if (posStore.cart.length > 0 && !showPaymentModal.value) {
      openCheckoutModal()
    }
  } else if (e.key === 'F7') {
    e.preventDefault()
    if (posStore.cart.length > 0 && !showAbaFullScreen.value) {
      startAbaFullScreenCheckout()
    }
  } else if (e.key === 'F8') {
    e.preventDefault()
    showCustomerModal.value = true
  } else if (e.key === 'F9') {
    e.preventDefault()
    if (posStore.cart.length > 0) {
      handleHoldCart()
    } else {
      showHeldOrdersModal.value = true
    }
  } else if (e.key === 'Escape') {
    if (showAbaFullScreen.value) handleAbaCancel()
    else if (showClearCartConfirm.value) showClearCartConfirm.value = false
    else if (showPaymentModal.value) showPaymentModal.value = false
    else if (showCustomerModal.value) showCustomerModal.value = false
    else if (showHeldOrdersModal.value) showHeldOrdersModal.value = false
    else if (variantPickerProduct.value) variantPickerProduct.value = null
    else if (showShortcutsModal.value) showShortcutsModal.value = false
    else if (lineDiscountItem.value) lineDiscountItem.value = null
  } else if (e.key === 'Enter') {
    if (showReceiptModal.value) {
      e.preventDefault()
      startNewSale()
    }
  }
}

// ── Lifecycle & Clock ─────────────────────────────────────────────
let timerInterval: any = null
let scannerBroadcastChannel: BroadcastChannel | null = null

function updateClock() {
  const now = new Date()
  currentTimeStr.value = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  currentDateStr.value = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function handlePosBeforeUnload() {
  const ch = getCustomerDisplayChannel()
  if (ch) {
    try {
      ch.postMessage({
        type: 'POS_DISCONNECTED',
        terminalId: activeTerminalId.value,
        timestamp: Date.now(),
      })
    } catch {
      // Ignore unload broadcast errors
    }
  }
}

onMounted(async () => {
  // Load terminal settings (auto-print, audio, station id) from localStorage
  loadSettings()
  // Set terminal on Pinia posStore to ensure terminal-scoped isolation
  posStore.setTerminal(posSettings.value.terminalId, posSettings.value.terminalDbId)
  posStore.hydrateFromStorage(posSettings.value.terminalId)

  // Sync active terminals from backend, resolve terminal DB UUID and warehouse
  await syncTerminalContext()
  pingTerminalHeartbeat()
  terminalHeartbeatTimer = setInterval(pingTerminalHeartbeat, 30000)
  await checkActiveShift()

  // Initialize dual-screen Customer Display & Scanner BroadcastChannels
  getCustomerDisplayChannel()
  broadcastCustomerDisplayState('INITIAL_LOAD')
  customerDisplayHeartbeatTimer = setInterval(() => {
    emitCustomerDisplayHeartbeat()
    refreshCustomerDisplayPresence()
  }, HEARTBEAT_INTERVAL_MS)
  refreshCustomerDisplayPresence()
  window.addEventListener('beforeunload', handlePosBeforeUnload)

  if (typeof BroadcastChannel !== 'undefined') {
    scannerBroadcastChannel = new BroadcastChannel('pos_scanner_channel')
    scannerBroadcastChannel.onmessage = (e) => {
      if (e.data?.type === 'barcode_scanned' && e.data?.barcode) {
        handleBarcodeScanned(String(e.data.barcode))
      }
    }
  }

  updateClock()
  timerInterval = setInterval(updateClock, 1000)
  window.addEventListener('keydown', handleGlobalKeydown)

  // Customer search fires on-demand only — not on mount (avoids loading all customers)
  await Promise.all([loadCatalog(), loadStocks()])
  // Re-broadcast once branch metadata has loaded so branchName is populated
  broadcastCustomerDisplayState('CART_UPDATED')
  isInitialLoadDone.value = true
  searchOmnibarRef.value?.focus()
})

const isInitialLoadDone = ref(false)

/**
 * Watch the omnibar search query and forward it to the server-side search.
 * The composable handles debouncing (350ms) and page reset.
 * For short queries (< 2 chars) we clear the search.
 * Gated by isInitialLoadDone to avoid PC mount autofocus race condition.
 */
watch(searchQuery, (val, oldVal) => {
  if (!isInitialLoadDone.value) return
  if (val === oldVal) return
  const trimmed = val.trim()
  if (trimmed.length >= 2) {
    setSearch(trimmed)
  } else if (trimmed.length === 0 && oldVal && oldVal.trim().length > 0) {
    applySearch('')
  }
})

onBeforeUnmount(() => {
  if (terminalHeartbeatTimer) {
    clearInterval(terminalHeartbeatTimer)
    terminalHeartbeatTimer = null
  }
  if (timerInterval) clearInterval(timerInterval)
  if (customerDisplayHeartbeatTimer) {
    clearInterval(customerDisplayHeartbeatTimer)
    customerDisplayHeartbeatTimer = null
  }
  clearActiveSuccessDisplay()
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('beforeunload', handlePosBeforeUnload)
  if (customerDisplayChannel) {
    try {
      customerDisplayChannel.postMessage({
        type: 'POS_DISCONNECTED',
        terminalId: activeTerminalId.value,
        timestamp: Date.now(),
      })
    } catch {
      // Ignore close errors
    }
    customerDisplayChannel.close()
    customerDisplayChannel = null
  }
  if (scannerBroadcastChannel) {
    scannerBroadcastChannel.close()
    scannerBroadcastChannel = null
  }
})

</script>

