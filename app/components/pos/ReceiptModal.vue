<template>
  <Teleport to="body">
    <div
      v-if="modelValue && receipt"
      id="pos-receipt-print-overlay"
      :class="activeTemplate === 'A4' ? 'is-printing-a4' : 'is-printing-receipt'"
      class="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4"
      @click.self="$emit('newSale')"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Invoice and receipt"
        class="pos-focus pos-receipt-dialog bg-white rounded-xl border border-gray-200 w-full flex flex-col overflow-hidden transition-all shadow-xl"
        :class="activeTemplate === 'A4' ? 'max-w-4xl max-h-[94vh]' : 'max-w-2xl max-h-[92vh]'"
      >
        <!-- Header (no-print) -->
        <div class="no-print px-4 sm:px-5 py-2.5 border-b border-gray-200 flex items-center justify-between gap-3 bg-gray-50 flex-wrap">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-full bg-pay text-white flex items-center justify-center flex-shrink-0">
              <UIcon name="i-heroicons-check" class="w-4 h-4" />
            </div>
            <div class="flex flex-col min-w-0">
              <h3 class="text-sm sm:text-base font-semibold text-gray-900 leading-normal truncate khmer-ui">
                {{ receipt.isSample ? 'មើលគំរូបោះពុម្ព (Sample Print Preview)' : 'មើលវិក្កយបត្រ និងបង្កាន់ដៃ (Invoice & Receipt)' }}
              </h3>
              <div class="text-xs text-gray-500 truncate khmer-ui flex items-center gap-1.5 leading-tight">
                <span>លេខវិក្កយបត្រ:</span>
                <span class="font-mono font-semibold text-gray-800">{{ receipt.invoice_number || 'PENDING...' }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <!-- Template Mode Switcher: មើលវិក្កយបត្រ A4 vs បង្កាន់ដៃ 80mm -->
            <div class="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5 text-xs font-semibold khmer-ui">
              <button
                type="button"
                class="px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                :class="activeTemplate === 'RECEIPT' ? 'bg-gray-900 text-white shadow-xs' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'"
                @click="activeTemplate = 'RECEIPT'"
              >
                <UIcon name="i-heroicons-receipt-percent" class="w-3.5 h-3.5" />
                <span>បង្កាន់ដៃ (80mm)</span>
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                :class="activeTemplate === 'A4' ? 'bg-gray-900 text-white shadow-xs' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'"
                @click="activeTemplate = 'A4'"
              >
                <UIcon name="i-heroicons-document-text" class="w-3.5 h-3.5" />
                <span>វិក្កយបត្រ A4</span>
              </button>
            </div>

            <!-- Thermal Width Switcher when in Receipt mode -->
            <div
              v-if="activeTemplate === 'RECEIPT'"
              class="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5 text-xs font-semibold"
            >
              <button
                type="button"
                class="px-2 py-1 rounded-md transition-colors cursor-pointer"
                :class="activePaperWidth === '80mm' ? 'bg-gray-900 text-white shadow-xs' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'"
                @click="setPaperWidth('80mm')"
              >
                80mm
              </button>
              <button
                type="button"
                class="px-2 py-1 rounded-md transition-colors cursor-pointer"
                :class="activePaperWidth === '58mm' ? 'bg-gray-900 text-white shadow-xs' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'"
                @click="setPaperWidth('58mm')"
              >
                58mm
              </button>
            </div>

            <button
              type="button"
              class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close and start next sale"
              @click="$emit('newSale')"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Body: Scrollable Preview Stage -->
        <div
          ref="scrollStageRef"
          class="pos-receipt-scroll p-4 md:p-6 overflow-y-auto flex-1 flex justify-center items-start bg-slate-100/80 no-scrollbar"
        >
          <!-- =========================================================================
               TEMPLATE B: MODERN KHMER THERMAL RECEIPT (80mm / 58mm Dedicated Layout)
               ========================================================================= -->
          <div
            v-if="activeTemplate === 'RECEIPT'"
            id="pos-thermal-receipt"
            :class="activePaperWidth === '58mm' ? 'w-[248px] is-58mm' : 'w-[336px] is-80mm'"
            class="khmer-print-surface bg-white p-4 rounded-lg border border-gray-200 shadow-xs text-gray-900 transition-all"
          >
            <!-- Double Rule Top Header -->
            <div class="kh-receipt-double-rule py-2 text-center flex flex-col items-center gap-0.5">
              <div class="kh-receipt-store-kh">{{ resolvedStoreName }}</div>
              <div v-if="receiptTemplate?.tagline" class="text-[10px] text-gray-600 font-normal leading-tight">{{ receiptTemplate.tagline }}</div>
              <div class="kh-receipt-branch">{{ khmerBranchName }}</div>
              <div v-if="receiptTemplate?.address" class="text-[9.5px] text-gray-500 font-normal leading-tight mt-0.5">{{ receiptTemplate.address }}</div>
              <div v-if="receiptTemplate?.phone" class="text-[9.5px] text-gray-500 font-mono">Tel: {{ receiptTemplate.phone }}</div>
              <div v-if="receiptTemplate?.tax_id" class="text-[9px] text-gray-500 font-mono">VAT TIN: {{ receiptTemplate.tax_id }}</div>
            </div>

            <!-- Receipt Metadata -->
            <div class="py-2.5 flex flex-col gap-1 text-[11px]">
              <div class="flex justify-between gap-2">
                <span class="text-gray-600">វិក្កយបត្រ:</span>
                <strong class="font-mono font-bold text-gray-900">{{ receipt.invoice_number || 'INV-PENDING' }}</strong>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-gray-600">កាលបរិច្ឆេទ:</span>
                <span class="font-mono text-gray-900">{{ compactDateStr }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-gray-600">អ្នកគិតលុយ:</span>
                <span class="text-gray-900 text-right">{{ cashierName }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-gray-600">អតិថិជន:</span>
                <span class="text-gray-900 text-right">{{ khmerCustomerName }}</span>
              </div>
            </div>

            <!-- Items Section (Dashed Rule) -->
            <div class="kh-receipt-dashed-rule py-2.5 flex flex-col gap-2.5">
              <div
                v-for="(item, idx) in receipt.items"
                :key="item.variant_id || idx"
                class="flex flex-col gap-0.5"
              >
                <!-- Line 1: Product Name + (Color / Size) -->
                <div class="kh-receipt-item-title">
                  <span>{{ item.name }}</span>
                  <span v-if="item.variantInfo" class="text-gray-700 font-normal">
                    ({{ formatVariantSlash(item.variantInfo) }})
                  </span>
                </div>
                <!-- Line 2: Indented Qty x Unit Price on left, Line Total on right -->
                <div class="flex items-baseline justify-between pl-3 text-[11px] font-mono">
                  <span class="text-gray-600">
                    {{ item.quantity }} x ${{ Number(item.price).toFixed(2) }}
                    <template v-if="item.discount && Number(item.discount) > 0">
                      (&minus;${{ Number(item.discount).toFixed(2) }})
                    </template>
                  </span>
                  <strong class="font-bold text-gray-900">${{ Number(item.total).toFixed(2) }}</strong>
                </div>
                <!-- Line 3: Optional SKU/Barcode -->
                <div v-if="receiptTemplate?.show_item_sku !== false && (item.sku || item.barcode)" class="pl-3 text-[9.5px] text-gray-500 font-mono">
                  SKU: {{ item.sku || item.barcode }}
                </div>
              </div>
            </div>

            <!-- Subtotal / Discount / Tax -->
            <div class="py-2 flex flex-col gap-1 text-[11px]">
              <div class="flex justify-between">
                <span class="text-gray-700">សរុបរង:</span>
                <span class="font-mono font-semibold">${{ Number(receipt.subtotal || 0).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-700">
                  បញ្ចុះតម្លៃ{{ receipt.couponCode ? ` (${receipt.couponCode})` : '' }}:
                </span>
                <span class="font-mono font-semibold">
                  {{ Number(receipt.discount || 0) > 0 ? `-$${Number(receipt.discount).toFixed(2)}` : '$0.00' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-700">ពន្ធ:</span>
                <span class="font-mono font-semibold">${{ Number(receipt.tax || 0).toFixed(2) }}</span>
              </div>
            </div>

            <!-- Grand Total inside Double Rule -->
            <div class="kh-receipt-double-rule py-2 flex flex-col gap-1">
              <div class="flex justify-between items-baseline">
                <span class="text-xs font-bold text-gray-900">សរុបត្រូវបង់:</span>
                <span class="text-base font-extrabold font-mono text-gray-900">
                  ${{ Number(receipt.grandTotal || 0).toFixed(2) }}
                </span>
              </div>
              <div class="flex justify-between items-baseline text-[10.5px] text-gray-600">
                <span>សរុបជាប្រាក់រៀល (KHR):</span>
                <span class="font-mono font-semibold text-gray-800">{{ formatRiel(Number(receipt.grandTotal || 0)) }}</span>
              </div>
            </div>

            <!-- Payment Method & Status -->
            <div class="py-2.5 flex flex-col gap-1 text-[11px]">
              <div class="flex justify-between gap-2">
                <span class="text-gray-600">វិធីទូទាត់:</span>
                <span class="font-semibold text-gray-900 text-right">{{ primaryPaymentMethod }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-gray-600">ស្ថានភាព:</span>
                <strong class="font-bold text-gray-900">{{ paymentStatus.khmer }}</strong>
              </div>
              <div
                v-if="receipt.tenderedAmount && Number(receipt.tenderedAmount) > Number(receipt.grandTotal)"
                class="flex justify-between gap-2"
              >
                <span class="text-gray-600">ប្រាក់បានបង់:</span>
                <span class="font-mono">${{ Number(receipt.tenderedAmount).toFixed(2) }}</span>
              </div>
              <div v-if="Number(receipt.change) > 0" class="flex justify-between gap-2 font-bold text-gray-900">
                <span>ប្រាក់អាប់:</span>
                <span class="font-mono">${{ Number(receipt.change).toFixed(2) }} ({{ formatRiel(Number(receipt.change)) }})</span>
              </div>
            </div>

            <!-- Khmer Thank You Footer -->
            <div class="pt-2 border-t border-dashed border-gray-300 text-center flex flex-col items-center gap-1">
              <p class="text-xs font-bold text-gray-900">សូមអរគុណ!</p>
              <p class="text-[11px] font-medium text-gray-700 leading-tight">{{ resolvedFooterNote }}</p>
              <p v-if="receiptTemplate?.return_policy" class="text-[9.5px] text-gray-500 mt-0.5 leading-snug">{{ receiptTemplate.return_policy }}</p>
              <p v-if="receiptTemplate?.wifi_info" class="text-[9.5px] font-mono text-gray-600 mt-0.5">{{ receiptTemplate.wifi_info }}</p>
            </div>
          </div>

          <!-- =========================================================================
               TEMPLATE A: MODERN KHMER A4 SALES INVOICE (Dedicated A4 Document Layout)
               ========================================================================= -->
          <div
            v-else
            id="pos-a4-invoice"
            class="khmer-print-surface kh-a4-sheet bg-white rounded-lg border border-gray-200 shadow-xs text-gray-900"
          >
            <!-- 1. A4 Header: Brand Identity Left, Invoice Title Right -->
            <div class="kh-a4-header">
              <div class="kh-a4-brand">
                <div class="kh-a4-logo">
                  <UIcon name="i-heroicons-building-storefront" class="w-6 h-6 text-white" />
                </div>
                <div class="kh-a4-brand-text">
                  <h1 class="kh-a4-store-kh">គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់ </h1>
                  <div class="kh-a4-store-en">{{ resolvedStoreName }}</div>
                  <div class="kh-a4-store-sub">
                    {{ khmerBranchName }} &bull; រាជធានីភ្នំពេញ ប្រទេសកម្ពុជា &bull; ទូរស័ព្ទ: +855 23 888 999
                  </div>
                </div>
              </div>

              <div class="kh-a4-doc-heading">
                <div class="kh-a4-doc-kh">វិក្កយបត្រលក់</div>
                <div class="kh-a4-doc-en">SALES INVOICE</div>
              </div>
            </div>

            <!-- 2. Invoice Information Block -->
            <div class="kh-a4-meta-grid">
              <div class="kh-a4-meta-col">
                <div class="kh-a4-meta-row">
                  <span class="kh-a4-meta-label">លេខវិក្កយបត្រ (Invoice No):</span>
                  <strong class="kh-a4-meta-value font-mono">{{ receipt.invoice_number || 'INV-PENDING' }}</strong>
                </div>
                <div class="kh-a4-meta-row">
                  <span class="kh-a4-meta-label">កាលបរិច្ឆេទ (Date):</span>
                  <span class="kh-a4-meta-value">{{ khmerInvoiceDateStr }}</span>
                </div>
                <div class="kh-a4-meta-row">
                  <span class="kh-a4-meta-label">សាខា (Branch):</span>
                  <span class="kh-a4-meta-value">{{ khmerBranchName }}</span>
                </div>
              </div>

              <div class="kh-a4-meta-col">
                <div class="kh-a4-meta-row">
                  <span class="kh-a4-meta-label">អ្នកគិតលុយ (Cashier):</span>
                  <span class="kh-a4-meta-value">{{ cashierName }} ({{ resolvedTerminalId }})</span>
                </div>
                <div class="kh-a4-meta-row">
                  <span class="kh-a4-meta-label">អតិថិជន (Customer):</span>
                  <strong class="kh-a4-meta-value">{{ khmerCustomerName }}</strong>
                </div>
                <div class="kh-a4-meta-row">
                  <span class="kh-a4-meta-label">ស្ថានភាពទូទាត់ (Status):</span>
                  <span class="kh-a4-status-pill">{{ paymentStatus.khmer }} ({{ paymentStatus.english }})</span>
                </div>
              </div>
            </div>

            <!-- 3. Product Table -->
            <div class="kh-a4-table-wrap">
              <table class="kh-a4-table">
                <thead>
                  <tr>
                    <th class="col-idx">ល.រ</th>
                    <th class="col-desc">បរិយាយទំនិញ</th>
                    <th class="col-variant">ពណ៌ / ទំហំ</th>
                    <th class="col-qty">ចំនួន</th>
                    <th class="col-price">តម្លៃរាយ</th>
                    <th class="col-total">សរុប</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in receipt.items" :key="item.variant_id || idx">
                    <td class="col-idx">{{ toKhmerNumerals(Number(idx) + 1) }}</td>
                    <td class="col-desc">
                      <div class="kh-a4-item-name">{{ item.name }}</div>
                      <div v-if="item.sku" class="kh-a4-item-sku">SKU: {{ item.sku }}</div>
                    </td>
                    <td class="col-variant">{{ formatVariantSlash(item.variantInfo) || '—' }}</td>
                    <td class="col-qty">{{ toKhmerNumerals(item.quantity) }} ({{ item.quantity }})</td>
                    <td class="col-price font-mono">${{ Number(item.price).toFixed(2) }}</td>
                    <td class="col-total font-mono">${{ Number(item.total).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 4. Payment Information (Left) & Financial Summary (Right) -->
            <div class="kh-a4-summary-grid">
              <!-- Payment Information -->
              <div class="kh-a4-payment-box">
                <div class="kh-a4-box-title">ព័ត៌មានទូទាត់ (Payment Information)</div>
                <div class="kh-a4-pay-row">
                  <span>វិធីទូទាត់:</span>
                  <strong>{{ primaryPaymentMethod }}</strong>
                </div>
                <div class="kh-a4-pay-row">
                  <span>ស្ថានភាពទូទាត់:</span>
                  <strong>{{ paymentStatus.khmer }}</strong>
                </div>
                <div class="kh-a4-pay-row">
                  <span>ប្រាក់បានបង់:</span>
                  <strong class="font-mono">${{ paidAmountUsd.toFixed(2) }}</strong>
                </div>
                <div v-if="Number(receipt.change) > 0" class="kh-a4-pay-row">
                  <span>ប្រាក់អាប់ (Change Due):</span>
                  <strong class="font-mono">${{ Number(receipt.change).toFixed(2) }} ({{ formatRiel(Number(receipt.change)) }})</strong>
                </div>
                <div
                  v-for="(pay, pIdx) in receipt.payments"
                  :key="pIdx"
                  class="kh-a4-pay-sub"
                >
                  <span v-if="pay.reference_number" class="font-mono text-[11px] text-gray-500">
                    លេខយោង (Ref): #{{ pay.reference_number }}
                  </span>
                </div>
              </div>

              <!-- Financial Summary -->
              <div class="kh-a4-totals-box">
                <div class="kh-a4-tot-row">
                  <span>សរុបរង (Subtotal)</span>
                  <span class="font-mono font-semibold">${{ Number(receipt.subtotal || 0).toFixed(2) }}</span>
                </div>
                <div class="kh-a4-tot-row">
                  <span>បញ្ចុះតម្លៃ (Discount){{ receipt.couponCode ? ` [${receipt.couponCode}]` : '' }}</span>
                  <span class="font-mono font-semibold">
                    {{ Number(receipt.discount || 0) > 0 ? `-$${Number(receipt.discount).toFixed(2)}` : '$0.00' }}
                  </span>
                </div>
                <div class="kh-a4-tot-row">
                  <span>ពន្ធ (Tax)</span>
                  <span class="font-mono font-semibold">${{ Number(receipt.tax || 0).toFixed(2) }}</span>
                </div>
                <div class="kh-a4-tot-grand">
                  <div class="kh-a4-tot-grand-label">
                    <span>សរុបត្រូវបង់ (Total Due)</span>
                  </div>
                  <div class="kh-a4-tot-grand-val font-mono">
                    ${{ Number(receipt.grandTotal || 0).toFixed(2) }}
                  </div>
                </div>
                <div class="kh-a4-tot-khr">
                  <span>សរុបជាប្រាក់រៀល (KHR Equivalent)</span>
                  <strong class="font-mono">{{ formatRiel(Number(receipt.grandTotal || 0)) }}</strong>
                </div>
              </div>
            </div>

            <!-- 5. Khmer Footer -->
            <div class="kh-a4-footer">
              <p class="kh-a4-thank-main">សូមអរគុណដែលបានគាំទ្រហាងរបស់យើង!</p>
              <p class="kh-a4-thank-sub">សូមអញ្ជើញមកទិញម្តងទៀត។</p>
              <p class="kh-a4-policy">
                ទំនិញអាចប្តូរវិញបានក្នុងរយៈពេល ៧ ថ្ងៃ ដោយភ្ជាប់មកជាមួយវិក្កយបត្រ។ &bull; {{ resolvedFooterNote }}
              </p>
            </div>
          </div>
        </div>

        <!-- Footer Print Controls (no-print) -->
        <div class="no-print px-4 sm:px-5 py-2.5 border-t border-gray-200 flex items-center justify-between gap-3 bg-gray-50 khmer-ui flex-shrink-0 flex-wrap sm:flex-nowrap">
          <div class="flex items-center gap-2 flex-wrap">
            <!-- បោះពុម្ពបង្កាន់ដៃ (Print Receipt) -->
            <button
              type="button"
              class="px-3.5 h-10 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border shadow-xs"
              :class="activeTemplate === 'RECEIPT'
                ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900'"
              @click="handlePrintTemplate('RECEIPT')"
            >
              <UIcon name="i-heroicons-printer" class="w-4 h-4 flex-shrink-0" />
              <span>បោះពុម្ពបង្កាន់ដៃ (Receipt)</span>
            </button>

            <!-- បោះពុម្ពវិក្កយបត្រ A4 (Print A4 Invoice) -->
            <button
              type="button"
              class="px-3.5 h-10 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border shadow-xs"
              :class="activeTemplate === 'A4'
                ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900'"
              @click="handlePrintTemplate('A4')"
            >
              <UIcon name="i-heroicons-document-text" class="w-4 h-4 flex-shrink-0" />
              <span>បោះពុម្ពវិក្កយបត្រ A4 (Invoice)</span>
            </button>
          </div>

          <button
            type="button"
            class="px-5 h-10 bg-gray-900 text-white hover:bg-gray-800 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs flex-shrink-0 ml-auto"
            @click="$emit('newSale')"
          >
            <span>{{ receipt.isSample ? 'បិទ (Close Preview)' : 'ការលក់បន្ទាប់ [Enter]' }}</span>
            <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 flex-shrink-0" />
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { usePosSettings } from '~/composables/usePosSettings'
import { normalizeTerminalId } from '~/composables/useCustomerDisplaySync'
import {
  ENGLISH_STORE_NAME,
  formatKhmerBranchName,
  formatKhmerCustomerName,
  formatKhmerInvoiceDate,
  formatKhmerPaymentMethod,
  formatKhmerPaymentStatus,
  formatReceiptCompactDate,
  printWithKhmerFonts,
  toKhmerNumerals,
} from '~/composables/useKhmerPrint'

export interface PosCompletedReceipt {
  invoice_number?: string
  date?: string
  rawDate?: string
  customerName?: string
  couponCode?: string | null
  items: Array<{
    variant_id?: string
    sku?: string
    barcode?: string
    name: string
    variantInfo?: string
    quantity: number
    price: number
    discount?: number
    total: number
  }>
  subtotal: number
  discount: number
  tax: number
  grandTotal: number
  tenderedAmount?: number | null
  payments: Array<{
    payment_method: string
    amount: number
    reference_number?: string
  }>
  change: number
  paymentStatus?: string
  saleStatus?: string
  isSample?: boolean
}

const props = defineProps<{
  modelValue: boolean
  receipt: PosCompletedReceipt | null
  branchName: string
  cashierName: string
  formatRiel: (amount: number) => string
}>()

defineEmits<{
  'update:modelValue': [val: boolean]
  'print': []
  'newSale': []
}>()

const { settings: posSettings, saveSettings } = usePosSettings()

const scrollStageRef = ref<HTMLElement | null>(null)

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      nextTick(() => {
        if (scrollStageRef.value) {
          scrollStageRef.value.scrollTop = 0
        }
      })
    }
  },
  { immediate: true },
)

const activeTemplate = ref<'RECEIPT' | 'A4'>('RECEIPT')
const activePaperWidth = computed(() => posSettings.value.paperWidth || '80mm')
const receiptTemplate = computed(() => posSettings.value.receiptTemplate)
const resolvedStoreName = computed(
  () => receiptTemplate.value?.store_name?.trim() || posSettings.value.receiptStoreName?.trim() || ENGLISH_STORE_NAME,
)
const resolvedFooterNote = computed(
  () => receiptTemplate.value?.footer_message?.trim() || posSettings.value.receiptFooterNote?.trim() || 'Items can be exchanged within 7 days with valid receipt.',
)
const resolvedTerminalId = computed(() => normalizeTerminalId(posSettings.value.terminalId))

const khmerBranchName = computed(() => formatKhmerBranchName(props.branchName))
const khmerCustomerName = computed(() => formatKhmerCustomerName(props.receipt?.customerName))
const compactDateStr = computed(() => formatReceiptCompactDate(props.receipt?.rawDate || props.receipt?.date))
const khmerInvoiceDateStr = computed(() => formatKhmerInvoiceDate(props.receipt?.rawDate || props.receipt?.date))

const paymentStatus = computed(() =>
  formatKhmerPaymentStatus(
    props.receipt?.paymentStatus || 'PAID',
    props.receipt?.saleStatus || 'COMPLETED',
  ),
)

const primaryPaymentMethod = computed(() => {
  const payments = props.receipt?.payments || []
  if (payments.length === 0) return 'សាច់ប្រាក់ (Cash)'
  if (payments.length === 1 && payments[0]) return formatKhmerPaymentMethod(payments[0].payment_method)
  return payments.map((p) => formatKhmerPaymentMethod(p.payment_method)).join(' + ')
})

const paidAmountUsd = computed(() => {
  if (props.receipt?.tenderedAmount && Number(props.receipt.tenderedAmount) > 0) {
    return Number(props.receipt.tenderedAmount)
  }
  const payments = props.receipt?.payments || []
  if (payments.length > 0) {
    return payments.reduce((sum: number, p) => sum + (Number(p.amount) || 0), 0)
  }
  return Number(props.receipt?.grandTotal || 0)
})

function formatVariantSlash(variantInfo?: string | null): string {
  const clean = (variantInfo || '').trim()
  if (!clean) return ''
  if (clean.includes('/')) return clean
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]} / ${parts.slice(1).join(' ')}`
  return clean
}

function setPaperWidth(width: '80mm' | '58mm') {
  posSettings.value.paperWidth = width
  saveSettings()
}

async function handlePrintTemplate(mode: 'RECEIPT' | 'A4') {
  activeTemplate.value = mode
  await nextTick()
  await printWithKhmerFonts()
}
</script>

<style>
.khmer-ui,
.khmer-print-surface {
  font-family: var(--font-khmer, 'Kantumruy Pro', 'Battambang', 'Noto Sans Khmer', 'Battambang Local', 'Inter', sans-serif);
  line-height: 1.6;
}

/* ── Template B: 80mm Khmer Thermal Receipt Styles ──────────────── */
.kh-receipt-store-kh {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  line-height: 1.65;
}

.kh-receipt-store-en {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #1f2937;
  text-transform: uppercase;
}

.kh-receipt-branch {
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  line-height: 1.5;
}

.kh-receipt-double-rule {
  border-top: 3px double #111827;
  border-bottom: 3px double #111827;
}

.kh-receipt-dashed-rule {
  border-top: 1px dashed #9ca3af;
  border-bottom: 1px dashed #9ca3af;
}

.kh-receipt-item-title {
  font-size: 11.5px;
  font-weight: 600;
  color: #111827;
  line-height: 1.65;
  word-break: break-word;
}

/* ── Template A: Modern Khmer A4 Sales Invoice Styles ───────────── */
.kh-a4-sheet {
  width: 100%;
  max-width: 210mm;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.kh-a4-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid #111827;
}

.kh-a4-brand {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.kh-a4-logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #111827;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kh-a4-store-kh {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  line-height: 1.5;
  margin: 0;
}

.kh-a4-store-en {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #374151;
  text-transform: uppercase;
}

.kh-a4-store-sub {
  font-size: 11.5px;
  color: #6b7280;
  margin-top: 2px;
  line-height: 1.5;
}

.kh-a4-doc-heading {
  text-align: right;
  flex-shrink: 0;
}

.kh-a4-doc-kh {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  line-height: 1.45;
}

.kh-a4-doc-en {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #4b5563;
}

.kh-a4-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 12px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.kh-a4-meta-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kh-a4-meta-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: 12.5px;
  line-height: 1.6;
}

.kh-a4-meta-label {
  color: #4b5563;
}

.kh-a4-meta-value {
  color: #111827;
  text-align: right;
}

.kh-a4-status-pill {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  font-size: 11.5px;
  font-weight: 700;
  color: #111827;
}

.kh-a4-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

.kh-a4-table thead tr {
  border-bottom: 2px solid #111827;
  background: #f9fafb;
}

.kh-a4-table th {
  padding: 9px 10px;
  font-weight: 700;
  color: #111827;
  line-height: 1.6;
}

.kh-a4-table td {
  padding: 10px;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: top;
  line-height: 1.6;
}

.kh-a4-table .col-idx { width: 44px; text-align: center; }
.kh-a4-table .col-desc { text-align: left; }
.kh-a4-table .col-variant { width: 130px; text-align: left; }
.kh-a4-table .col-qty { width: 80px; text-align: right; }
.kh-a4-table .col-price { width: 100px; text-align: right; }
.kh-a4-table .col-total { width: 110px; text-align: right; font-weight: 700; }

.kh-a4-item-name {
  font-weight: 600;
  color: #111827;
}

.kh-a4-item-sku {
  font-size: 11px;
  font-family: var(--font-mono);
  color: #6b7280;
}

.kh-a4-summary-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
}

.kh-a4-payment-box {
  padding: 12px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
}

.kh-a4-box-title {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 4px;
  margin-bottom: 2px;
}

.kh-a4-pay-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.kh-a4-totals-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.kh-a4-tot-row {
  display: flex;
  justify-content: space-between;
  color: #374151;
}

.kh-a4-tot-grand {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-top: 10px;
  border-top: 2px solid #111827;
}

.kh-a4-tot-grand-label {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.kh-a4-tot-grand-val {
  font-size: 24px;
  font-weight: 800;
  color: #111827;
}

.kh-a4-tot-khr {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #4b5563;
  padding-top: 2px;
}

.kh-a4-footer {
  padding-top: 14px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kh-a4-thank-main {
  font-size: 13.5px;
  font-weight: 700;
  color: #111827;
}

.kh-a4-thank-sub {
  font-size: 12.5px;
  font-weight: 500;
  color: #374151;
}

.kh-a4-policy {
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
}

@media print {
  @page {
    margin: 0;
  }

  html,
  body {
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    background: #ffffff !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  body > #__nuxt {
    display: none !important;
  }

  .no-print {
    display: none !important;
  }

  #pos-receipt-print-overlay {
    position: static !important;
    inset: auto !important;
    background: transparent !important;
    backdrop-filter: none !important;
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
  }

  #pos-receipt-print-overlay .pos-receipt-dialog,
  #pos-receipt-print-overlay .pos-receipt-scroll {
    max-width: none !important;
    max-height: none !important;
    overflow: visible !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
  }

  #pos-thermal-receipt {
    position: static !important;
    margin: 0 !important;
    padding: 2mm 3mm !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    color: #000000 !important;
    background: #ffffff !important;
  }

  #pos-thermal-receipt.is-80mm {
    width: 78mm !important;
  }

  #pos-thermal-receipt.is-58mm {
    width: 54mm !important;
    font-size: 10px !important;
    padding: 1.5mm 2mm !important;
  }

  #pos-a4-invoice {
    width: 190mm !important;
    max-width: 190mm !important;
    margin: 10mm auto !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: #ffffff !important;
  }
}
</style>
