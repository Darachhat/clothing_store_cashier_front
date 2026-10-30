<template>
  <div class="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-slate-100 text-slate-900 font-sans">
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
        :time-str="currentTimeStr"
        :date-str="currentDateStr"
        @search="handleBarcodeOrSkuSearch"
        @scan="showScannerModal = true"
        @open-parked="showHeldOrdersModal = true"
        @open-shortcuts="showShortcutsModal = true"
        @open-stickers="openStickerModal()"
        @reprint-last="reprintLastReceipt"
      />

      <!-- ─── Body: Products Catalog (Left) + Cart Sidebar (Right) ───── -->
      <div class="flex-1 min-w-0 min-h-0 flex overflow-hidden">
        <!-- ─── Product Selection Section ────────────────────────────── -->
        <main class="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden p-2.5 gap-2 no-print">
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

        <!-- ─── PosCartPanel & Checkout Sidebar (Tailwind) ───────────── -->
        <PosCartPanel
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
      :search-results="customerSearchResults"
      :selected-customer-id="posStore.selectedCustomerId"
      :show-new-drawer="showNewCustomerDrawer"
      :new-customer-form="newCustomerForm"
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
const { listCustomers, createCustomer } = useCustomerApi()
const { searchByBarcode, searchBySku, searchByQr } = useProductApi()
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
const authStore = useAuthStore()
const router = useRouter()
const toast = useAppToast()
const { playBeep, playAbaChime, playSuccess, playError } = usePosAudio()
// ── POS Terminal Settings (auto-print, audio gates) ─────────────────
const { settings: posSettings, loadSettings, triggerAutoPrint } = usePosSettings()

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
const showReceiptModal = ref(false)
const showStickerModal = ref(false)
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
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : cashierName.value.slice(0, 2).toUpperCase()
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
  const riel = Math.round(usd * 4100)
  return `${riel.toLocaleString()} ៛`
}

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins === 1) return '1 min ago'
  return `${mins} mins ago`
}

function handleImgError(e: Event) {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
}

function getVariantStock(variantId: string): number {
  // Return 0 when stock is unknown — safer than a fake positive fallback
  return inventoryMap.value[variantId] ?? 0
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

function getSelectedColor(prodId: string): string | null {
  return selectedCardColors.value[prodId] || null
}

function setSelectedColor(prodId: string, colorName: string) {
  selectedCardColors.value[prodId] = colorName
}

function getSelectedSize(prodId: string): string | null {
  return selectedCardSizes.value[prodId] || null
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

// ── Actions: Barcode & Omnibar ────────────────────────────────────
async function handleBarcodeOrSkuSearch() {
  const q = searchQuery.value.trim()
  if (!q) return

  // 1. Direct search in current page's in-memory variants (fast path)
  const directMatch = allVariants.value.find(
    (v) =>
      v.barcode?.toLowerCase() === q.toLowerCase() ||
      v.sku?.toLowerCase() === q.toLowerCase() ||
      v.qr_reference?.toLowerCase() === q.toLowerCase(),
  )

  if (directMatch) {
    const stock = getVariantStock(directMatch.id)
    if (stock <= 0) {
      playError(true)
      toast.add({ title: 'Out of Stock', description: `Item ${directMatch.sku} has no stock`, color: 'red' })
      return
    }
    const res = posStore.addVariant(directMatch, 1, stock)
    playBeep(posSettings.value.soundBeep)
    toast.add({
      title: 'Item Scanned',
      description: `${directMatch.product?.name} (${directMatch.sku})`,
      color: 'green',
    })
    if (res.reachedLimit) {
      toast.add({ title: 'Stock Limit', description: `Reached warehouse stock limit of ${stock}`, color: 'amber' })
    }
    searchQuery.value = ''
    return
  }

  // 2. Query backend by barcode/sku/qr in parallel
  try {
    const lookups = [
      searchByBarcode(q).catch(() => null),
      searchBySku(q).catch(() => null),
      searchByQr(q).catch(() => null),
    ]

    const results = await Promise.all(lookups)
    const result: any = results.find((r) => r !== null)

    if (result) {
      const stock = getVariantStock(result.id)
      posStore.addVariant(result, 1, stock)
      playBeep(posSettings.value.soundBeep)
      toast.add({
        title: 'Item Found & Added',
        description: `${result.product?.name || 'Product'} (${result.sku})`,
        color: 'green',
      })
      searchQuery.value = ''
    } else {
      playError(true)
      toast.add({
        title: 'Product Not Found',
        description: `No barcode or SKU match for "${q}"`,
        color: 'amber',
      })
    }
  } catch {
    playError(true)
    toast.add({ title: 'Scan query failed', color: 'red' })
  }
}

let lastProcessedBarcode = ''
let lastProcessedBarcodeAt = 0

async function handleBarcodeScanned(barcodeStr: string) {
  const code = barcodeStr.trim()
  if (!code) return
  const now = Date.now()
  if (code === lastProcessedBarcode && now - lastProcessedBarcodeAt < 600) {
    return
  }
  lastProcessedBarcode = code
  lastProcessedBarcodeAt = now
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
    color: 'blue',
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
    // Auto-print receipt on thermal printer if enabled in settings
    triggerAutoPrint()
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
    toast.add({ title: 'Payment Cancelled', description: 'Order & cart preserved in POS', color: 'gray' })
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
        customer_id: posStore.selectedCustomerId,
        discount_amount: posStore.totalDiscount,
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
    const formResp = await createPurchaseForm(saleId, paymentOption)
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
      description: abaError.value,
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
    toast.add({ title: 'QR Cancelled', description: 'Payment window closed', color: 'gray' })
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
        customer_id: posStore.selectedCustomerId,
        discount_amount: posStore.totalDiscount,
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
    // 1. Create the sale with items
    const salePayload = {
      branch_id: posStore.branchId || null,
      warehouse_id: posStore.warehouseId || null,
      customer_id: posStore.selectedCustomerId,
      discount_amount: posStore.totalDiscount,
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

    // 2. Prepare payments list
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

    await completeSale(saleRes.id, { payments: paymentsPayload })

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

    // 5. Play audio chime and transition without immediately wiping the customer display's 5s confirmation screen
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
    // Auto-print receipt on thermal printer if enabled in settings
    triggerAutoPrint()

    // Refresh stocks in background
    loadStocks()

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
      categoryList.value = categoriesRes.value || []
    }
    if (brandsRes.status === 'fulfilled') {
      brandList.value = brandsRes.value || []
    }
    if (branchRes.status === 'fulfilled' && branchRes.value?.length) {
      branches.value = branchRes.value
      // Only set branch/warehouse if not already set from a persisted session
      if (!posStore.branchId) posStore.branchId = branchRes.value[0].id
      if (!posStore.warehouseId && branchRes.value[0].warehouses?.length) {
        posStore.warehouseId = branchRes.value[0].warehouses[0].id
      }
    }
  } catch (err: any) {
    console.error('Failed to load initial POS catalog metadata:', err)
  }

  // Server-side product fetch handled by posProducts composable
  await fetchProducts()
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
  // Restore persisted cart/held carts from previous session
  posStore.hydrateFromStorage()
  // Load terminal settings (auto-print, audio) from localStorage
  loadSettings()

  // Initialize dual-screen Customer Display & Scanner BroadcastChannels
  getCustomerDisplayChannel()
  broadcastCustomerDisplayState('INITIAL_LOAD')
  customerDisplayHeartbeatTimer = setInterval(() => {
    emitCustomerDisplayHeartbeat()
  }, HEARTBEAT_INTERVAL_MS)
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
  searchOmnibarRef.value?.focus()
})

/**
 * Watch the omnibar search query and forward it to the server-side search.
 * The composable handles debouncing (350ms) and page reset.
 * For short queries (< 2 chars) we clear the search.
 */
watch(searchQuery, (val) => {
  const trimmed = val.trim()
  if (trimmed.length >= 2) {
    setSearch(trimmed)
  } else if (trimmed.length === 0) {
    applySearch('')
  }
})

onBeforeUnmount(() => {
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

