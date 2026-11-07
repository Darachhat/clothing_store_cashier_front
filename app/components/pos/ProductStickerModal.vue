<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      id="pos-sticker-print-overlay"
      class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      @click.self="$emit('update:modelValue', false)"
    >
      <div class="pos-sticker-dialog bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <!-- Header (no-print) -->
        <div class="no-print px-5 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
              <UIcon name="i-heroicons-tag" class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-gray-900 leading-tight kh-text">
                បោះពុម្ពស្លាកទំនិញ &bull; Product Label &amp; Barcode Studio
              </h3>
              <p class="text-[11px] text-gray-500">
                Modern Khmer thermal garment stickers (50×30mm, 40×30mm, 60×40mm) with Code-128 barcode
              </p>
            </div>
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
        <div class="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          <!-- Left Controls (no-print) -->
          <div class="pos-sticker-left no-print w-full md:w-80 md:shrink-0 border-b md:border-b-0 md:border-r border-gray-200 p-4 overflow-y-auto flex flex-col gap-4 bg-white">
            <!-- Variant Search / Selector -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-gray-700 kh-text">
                ជ្រើសរើសទំនិញ (Add Product Variant)
              </label>
              <div class="relative">
                <UIcon name="i-heroicons-magnifying-glass" class="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  v-model="searchText"
                  type="text"
                  placeholder="ស្វែងរកឈ្មោះទំនិញ, SKU, ពណ៌, ទំហំ..."
                  class="w-full h-8 pl-8 pr-3 rounded-lg border border-gray-200 text-xs outline-none focus:border-gray-900 kh-text"
                >
              </div>

              <!-- Quick Variant Results -->
              <div v-if="filteredCatalogVariants.length > 0" class="max-h-36 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                <button
                  v-for="v in filteredCatalogVariants"
                  :key="v.id"
                  type="button"
                  class="w-full px-2.5 py-1.5 text-left hover:bg-gray-50 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                  @click="addVariantToQueue(v)"
                >
                  <div class="min-w-0">
                    <div class="text-xs font-semibold text-gray-900 truncate kh-text">{{ v.product?.name || v.sku }}</div>
                    <div class="text-[10px] text-gray-500 font-mono truncate kh-text">
                      {{ v.sku }} &bull; {{ [v.color?.name, v.size?.name].filter(Boolean).join(' / ') || 'ទូទៅ' }}
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    <span class="text-xs font-bold text-gray-900">${{ Number(v.selling_price).toFixed(2) }}</span>
                    <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5 text-gray-500" />
                  </div>
                </button>
              </div>
            </div>

            <!-- Selected Sticker Queue -->
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-gray-700 kh-text">
                  ចំនួនស្លាកទំនិញ ({{ totalStickerCount }} labels)
                </label>
                <button
                  v-if="stickerQueue.length > 0"
                  type="button"
                  class="text-[11px] text-gray-500 hover:text-gray-900 cursor-pointer"
                  @click="stickerQueue = []"
                >
                  Clear All
                </button>
              </div>

              <div v-if="stickerQueue.length === 0" class="p-3 rounded-lg border border-dashed border-gray-200 text-center text-xs text-gray-400">
                Select a product above to preview and print labels.
              </div>

              <div v-else class="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                <div
                  v-for="(entry, idx) in stickerQueue"
                  :key="entry.variant.id"
                  class="px-2.5 py-2 flex items-center justify-between gap-2 bg-gray-50/50"
                >
                  <div class="min-w-0 flex-1">
                    <div class="text-xs font-semibold text-gray-900 truncate kh-text">{{ entry.variant.product?.name || entry.variant.sku }}</div>
                    <div class="text-[10px] text-gray-500 font-mono truncate">
                      {{ entry.variant.sku }} &bull; ${{ Number(entry.variant.selling_price).toFixed(2) }}
                    </div>
                  </div>
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      class="w-6 h-6 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 cursor-pointer"
                      @click="changeQty(idx, -1)"
                    >
                      <UIcon name="i-heroicons-minus" class="w-3 h-3" />
                    </button>
                    <input
                      v-model.number="entry.quantity"
                      type="number"
                      min="1"
                      max="200"
                      class="w-11 h-6 text-center text-xs font-bold border border-gray-200 rounded bg-white"
                    >
                    <button
                      type="button"
                      class="w-6 h-6 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 cursor-pointer"
                      @click="changeQty(idx, 1)"
                    >
                      <UIcon name="i-heroicons-plus" class="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      class="w-6 h-6 rounded text-gray-400 hover:text-gray-900 flex items-center justify-center cursor-pointer"
                      @click="stickerQueue.splice(idx, 1)"
                    >
                      <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sticker Format Settings -->
            <div class="grid grid-cols-2 gap-2.5 pt-2 border-t border-gray-100">
              <div class="flex flex-col gap-1 col-span-2">
                <label class="text-[11px] font-semibold text-gray-700 kh-text">
                  ទំហំស្លាកទំនិញ (Label Size)
                </label>
                <select
                  v-model="stickerPreset"
                  class="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-gray-900"
                >
                  <option value="THERMAL_50x30">50 × 30 mm (Default Thermal Roll)</option>
                  <option value="THERMAL_40x30">40 × 30 mm (Compact Thermal Roll)</option>
                  <option value="THERMAL_60x40">60 × 40 mm (Large Thermal Roll)</option>
                  <option value="A4_SHEET">A4 Sheet Grid (4 Columns • 50 × 30 mm)</option>
                </select>
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-[11px] font-semibold text-gray-700">Barcode Format</label>
                <select
                  v-model="codeType"
                  class="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-gray-900"
                >
                  <option value="BARCODE">Code-128 Barcode</option>
                  <option value="QR">QR Code (2D)</option>
                </select>
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-[11px] font-semibold text-gray-700">Secondary KHR</label>
                <button
                  type="button"
                  class="h-8 px-2.5 rounded-lg border border-gray-200 text-xs font-semibold flex items-center justify-between cursor-pointer"
                  :class="showKhr ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'"
                  @click="showKhr = !showKhr"
                >
                  <span>USD + KHR</span>
                  <UIcon :name="showKhr ? 'i-heroicons-check' : 'i-heroicons-x-mark'" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Right: Live Sticker Sheet / Thermal Roll Preview (Printable Area) -->
          <div class="pos-sticker-scroll flex-1 p-5 overflow-y-auto bg-gray-100/80 flex flex-col items-center">
            <div class="no-print w-full flex items-center justify-between mb-3">
              <span class="text-xs font-semibold text-gray-600 kh-text">
                មើលស្លាកទំនិញមុនបោះពុម្ព &bull; Live Preview ({{ labelWidthMm }}×{{ labelHeightMm }}mm &bull; {{ totalStickerCount }} {{ totalStickerCount === 1 ? 'label' : 'labels' }})
              </span>
              <span class="text-[11px] text-gray-400 font-mono">Code-128 / UTF-8 Khmer</span>
            </div>

            <div
              v-if="expandedStickers.length === 0"
              class="no-print flex-1 flex flex-col items-center justify-center text-gray-400 text-xs gap-2 py-16"
            >
              <UIcon name="i-heroicons-tag" class="w-8 h-8 text-gray-300" />
              <span>No labels queued for printing</span>
            </div>

            <!-- Printable Sticker Container (Template C: Modern Khmer Product Sticker) -->
            <div
              v-else
              id="pos-printable-stickers"
              :class="stickerPreset === 'A4_SHEET' ? 'is-sheet-grid' : 'is-thermal-roll'"
              :style="{
                '--sticker-w': `${labelWidthMm}mm`,
                '--sticker-h': `${labelHeightMm}mm`,
              }"
            >
              <div
                v-for="(item, sIdx) in expandedStickers"
                :key="`${item.id}_${sIdx}`"
                class="kh-product-sticker"
                :class="`size-${labelWidthMm}x${labelHeightMm}`"
              >
                <!-- Store Header (Compact Khmer) -->
                <div v-if="stickerTemplate.show_store_header" class="kh-sticker__store">
                  {{ storeName }}
                </div>

                <!-- Product Name (Khmer or English) -->
                <div v-if="stickerTemplate.show_product_name" class="kh-sticker__product-name">
                  {{ item.product?.name || item.sku }}
                </div>

                <!-- Middle Info Row: SKU + Khmer Variant Details on Left, Prominent Price on Right -->
                <div class="kh-sticker__info-row">
                  <div class="kh-sticker__meta">
                    <div v-if="stickerTemplate.show_sku" class="kh-sticker__sku-line">
                      SKU: <span class="font-mono font-bold">{{ item.sku }}</span>
                    </div>
                    <div v-if="stickerTemplate.show_variant_attrs" class="kh-sticker__variant-line">
                      <span>ពណ៌: <strong>{{ item.color?.name || 'ទូទៅ' }}</strong></span>
                      <span class="kh-sticker__var-sep">ទំហំ: <strong>{{ item.size?.name || 'Free' }}</strong></span>
                    </div>
                  </div>

                  <div class="kh-sticker__price-box">
                    <div v-if="stickerTemplate.show_price_usd" class="kh-sticker__price-usd">${{ Number(item.selling_price).toFixed(2) }}</div>
                    <div v-if="showKhr" class="kh-sticker__price-khr">{{ formatRiel(Number(item.selling_price)) }}</div>
                  </div>
                </div>

                <!-- Barcode Zone (Code-128 with quiet zone & human-readable SKU below) -->
                <div v-if="codeType === 'BARCODE'" class="kh-sticker__barcode-zone">
                  <div class="kh-sticker__barcode-wrap">
                    <img
                      :src="getBarcodeImageUrl(item.id)"
                      :alt="item.barcode || item.sku"
                      class="kh-sticker__barcode-img"
                    >
                  </div>
                  <div class="kh-sticker__barcode-text">
                    {{ item.barcode || item.sku }}
                  </div>
                </div>

                <!-- Optional 2D QR Mode -->
                <div v-else class="kh-sticker__qr-zone">
                  <img
                    :src="getQrImageUrl(item.id)"
                    :alt="item.sku"
                    class="kh-sticker__qr-img"
                  >
                  <div class="kh-sticker__barcode-text">
                    {{ item.barcode || item.sku }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer (no-print) -->
        <div class="no-print px-5 py-3 border-t border-gray-200 flex items-center justify-between gap-2 bg-gray-50">
          <button
            type="button"
            class="px-3.5 h-9 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
            :disabled="stickerQueue.length === 0 || downloadingPdf"
            @click="downloadStickersPdf"
          >
            <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
            <span>{{ downloadingPdf ? 'Generating PDF...' : 'ទាញយក PDF (Download PDF)' }}</span>
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3.5 h-9 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 text-xs font-semibold transition-colors cursor-pointer"
              @click="$emit('update:modelValue', false)"
            >
              បិទ (Close)
            </button>
            <button
              type="button"
              class="px-4 h-9 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-1.5 cursor-pointer border border-transparent disabled:opacity-40 kh-text"
              :disabled="stickerQueue.length === 0"
              @click="printStickersNow"
            >
              <UIcon name="i-heroicons-printer" class="w-4 h-4" />
              <span>បោះពុម្ពស្លាកទំនិញ ({{ totalStickerCount }})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ProductVariant } from '~/types/pos'
import { usePosSettings } from '~/composables/usePosSettings'
import { printWithKhmerFonts } from '~/composables/useKhmerPrint'
import { normalizeScannedCode } from '~/utils/scanCode'

const props = defineProps<{
  modelValue: boolean
  initialVariants?: Array<{ variant: ProductVariant; quantity: number }>
  catalogVariants: ProductVariant[]
  formatRiel: (amount: number) => string
}>()

defineEmits<{
  'update:modelValue': [val: boolean]
}>()

const config = useRuntimeConfig()
const authStore = useAuthStore()
const toast = useAppToast()
const { settings: posSettings } = usePosSettings()
const { brand } = useBrand()
const { stickerTemplate, loadStickerTemplate } = useStickerTemplate()

const searchText = ref('')
const stickerQueue = ref<Array<{ variant: ProductVariant; quantity: number }>>([])
const stickerPreset = ref<'THERMAL_50x30' | 'THERMAL_40x30' | 'THERMAL_60x40' | 'A4_SHEET'>('THERMAL_50x30')
const codeType = ref<'BARCODE' | 'QR'>('BARCODE')
const showKhr = ref(true)
const downloadingPdf = ref(false)

const storeName = computed(
  () =>
    stickerTemplate.value.store_header?.trim() ||
    brand.value.store_name_kh?.trim() ||
    brand.value.store_name?.trim() ||
    posSettings.value.receiptStoreName?.trim() ||
    'គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់',
)

const labelWidthMm = computed(() => {
  if (stickerPreset.value === 'THERMAL_40x30') return 40
  if (stickerPreset.value === 'THERMAL_60x40') return 60
  return 50
})

const labelHeightMm = computed(() => {
  if (stickerPreset.value === 'THERMAL_60x40') return 40
  return 30
})

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      const tpl = await loadStickerTemplate()
      if (tpl.code_type === 'QR' || tpl.code_type === 'BARCODE') {
        codeType.value = tpl.code_type
      }
      if (tpl.paper_size === 'A4') {
        stickerPreset.value = 'A4_SHEET'
      } else if (
        tpl.paper_size === 'THERMAL_50x30' ||
        tpl.paper_size === 'THERMAL_40x30' ||
        tpl.paper_size === 'THERMAL_60x40'
      ) {
        stickerPreset.value = tpl.paper_size
      }
      showKhr.value = tpl.show_khr ?? true

      if (props.initialVariants?.length) {
        const defCopies = Math.max(1, Number(tpl.default_copies) || 1)
        stickerQueue.value = props.initialVariants.map((item) => ({
          variant: item.variant,
          quantity: Math.max(1, item.quantity || defCopies),
        }))
      }
    }
  },
)

const filteredCatalogVariants = computed(() => {
  const raw = searchText.value.trim()
  const q = (normalizeScannedCode(raw) || raw).toLowerCase()
  const list = props.catalogVariants || []
  if (!q) return list.slice(0, 12)
  return list
    .filter(
      (v) =>
        v.product?.name?.toLowerCase().includes(q) ||
        v.sku?.toLowerCase().includes(q) ||
        v.barcode?.toLowerCase().includes(q) ||
        (v as any).qr_reference?.toLowerCase().includes(q) ||
        v.color?.name?.toLowerCase().includes(q) ||
        v.size?.name?.toLowerCase().includes(q),
    )
    .slice(0, 15)
})

const totalStickerCount = computed(() =>
  stickerQueue.value.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0),
)

const expandedStickers = computed(() => {
  const out: ProductVariant[] = []
  for (const entry of stickerQueue.value) {
    const count = Math.min(200, Math.max(1, Number(entry.quantity) || 1))
    for (let i = 0; i < count; i++) {
      out.push(entry.variant)
    }
  }
  return out
})

function addVariantToQueue(variant: ProductVariant) {
  const existing = stickerQueue.value.find((e) => e.variant.id === variant.id)
  if (existing) {
    existing.quantity = Math.min(200, (existing.quantity || 1) + 1)
  } else {
    stickerQueue.value.push({ variant, quantity: 1 })
  }
}

function changeQty(idx: number, delta: number) {
  const entry = stickerQueue.value[idx]
  if (!entry) return
  const next = (Number(entry.quantity) || 1) + delta
  if (next <= 0) {
    stickerQueue.value.splice(idx, 1)
  } else {
    entry.quantity = Math.min(200, next)
  }
}

function getQrImageUrl(variantId: string): string {
  return `${config.public.apiBase}/api/v1/product-variants/${variantId}/qr?format=svg`
}

function getBarcodeImageUrl(variantId: string): string {
  return `${config.public.apiBase}/api/v1/product-variants/${variantId}/barcode?format=svg&write_text=false`
}

async function printStickersNow() {
  await printWithKhmerFonts()
}

async function downloadStickersPdf() {
  if (stickerQueue.value.length === 0) return
  downloadingPdf.value = true
  try {
    const body = {
      variants: stickerQueue.value.map((e) => ({
        variant_id: e.variant.id,
        quantity: Math.max(1, Number(e.quantity) || 1),
      })),
      paper_size: stickerPreset.value === 'A4_SHEET' ? 'A4' : stickerPreset.value,
      label_width_mm: labelWidthMm.value,
      label_height_mm: labelHeightMm.value,
      columns: stickerPreset.value === 'A4_SHEET' ? 4 : 1,
      code_type: codeType.value,
      show_khr: showKhr.value,
      store_name_override: storeName.value,
    }

    const response = await fetch(`${config.public.apiBase}/api/cashier/v1/labels/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.accessToken}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) throw new Error('Failed to generate sticker PDF')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `khmer-product-labels-${Date.now()}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.add({ title: 'បានទាញយក PDF ស្លាកទំនិញ (Stickers PDF Downloaded)', color: 'green' })
  } catch (err: unknown) {
    toast.add({
      title: 'Failed to generate PDF',
      description: (err as Error)?.message || 'Please try browser printing',
      color: 'red',
    })
  } finally {
    downloadingPdf.value = false
  }
}
</script>

<style>
.kh-text {
  font-family: 'Kantumruy Pro', 'Battambang', 'Battambang Local', 'Noto Sans Khmer', sans-serif;
}

.pos-sticker-dialog {
  max-width: 54rem;
}

@media (min-width: 768px) {
  .pos-sticker-left {
    width: 320px !important;
    flex-shrink: 0 !important;
  }
}

#pos-printable-stickers.is-thermal-roll {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

#pos-printable-stickers.is-sheet-grid {
  display: grid;
  grid-template-columns: repeat(2, var(--sticker-w, 50mm));
  gap: 8px;
  justify-content: center;
}

/* ============================================================================
   TEMPLATE C: MODERN KHMER PRODUCT STICKER (50x30mm, 40x30mm, 60x40mm)
   ============================================================================ */
.kh-product-sticker {
  width: var(--sticker-w, 50mm);
  height: var(--sticker-h, 30mm);
  background: #ffffff;
  color: #111827;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  padding: 1.6mm 2.2mm 1.4mm;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-family: 'Kantumruy Pro', 'Battambang', 'Battambang Local', 'Noto Sans Khmer', sans-serif;
  overflow: hidden;
  page-break-inside: avoid;
  break-inside: avoid;
}

.kh-sticker__store {
  font-size: 5.5pt;
  font-weight: 700;
  color: #374151;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kh-sticker__product-name {
  font-size: 7.5pt;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-bottom: 0.4pt solid #e5e7eb;
  padding-bottom: 0.4mm;
}

.kh-sticker__info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5mm;
  padding-top: 0.3mm;
}

.kh-sticker__meta {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2mm;
}

.kh-sticker__sku-line {
  font-size: 5.5pt;
  color: #374151;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kh-sticker__variant-line {
  font-size: 5.8pt;
  color: #111827;
  line-height: 1.25;
  display: flex;
  align-items: center;
  gap: 2mm;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kh-sticker__var-sep {
  margin-left: 0.5mm;
}

.kh-sticker__price-box {
  flex-shrink: 0;
  text-align: right;
  line-height: 1;
}

.kh-sticker__price-usd {
  font-size: 9.5pt;
  font-weight: 800;
  color: #111827;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.kh-sticker__price-khr {
  font-size: 5.2pt;
  font-weight: 600;
  color: #4b5563;
  margin-top: 0.3mm;
}

/* Barcode Zone with proper quiet zone on left and right */
.kh-sticker__barcode-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-top: 0.3mm;
  min-height: 0;
}

.kh-sticker__barcode-wrap {
  width: 100%;
  padding: 0 2mm;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
}

.kh-sticker__barcode-img {
  width: 100%;
  height: 7.8mm;
  object-fit: contain;
  display: block;
}

.kh-product-sticker.size-60x40 .kh-sticker__barcode-img {
  height: 11.5mm;
}

.kh-product-sticker.size-60x40 .kh-sticker__product-name {
  font-size: 9pt;
}

.kh-product-sticker.size-60x40 .kh-sticker__price-usd {
  font-size: 11.5pt;
}

.kh-sticker__barcode-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 5.5pt;
  font-weight: 700;
  color: #111827;
  text-align: center;
  letter-spacing: 0.04em;
  line-height: 1.1;
  margin-top: 0.2mm;
}

.kh-sticker__qr-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2mm;
  padding-top: 0.3mm;
}

.kh-sticker__qr-img {
  width: 9.5mm;
  height: 9.5mm;
  object-fit: contain;
}

@media print {
  #pos-sticker-print-overlay {
    position: static !important;
    inset: auto !important;
    background: transparent !important;
    backdrop-filter: none !important;
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
  }

  #pos-sticker-print-overlay .pos-sticker-dialog,
  #pos-sticker-print-overlay .pos-sticker-scroll {
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

  #pos-printable-stickers.is-thermal-roll {
    display: block !important;
  }

  #pos-printable-stickers.is-thermal-roll .kh-product-sticker {
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    page-break-after: always !important;
    break-after: page !important;
  }

  #pos-printable-stickers.is-sheet-grid {
    display: grid !important;
    grid-template-columns: repeat(4, var(--sticker-w, 50mm)) !important;
    gap: 3mm !important;
    padding: 6mm !important;
    justify-content: start !important;
  }
}
</style>
