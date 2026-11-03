<template>
  <AppModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <div class="scanner-modal">
      <!-- Modal Header -->
      <div class="scanner-modal__header">
        <div class="scanner-modal__title-group">
          <div class="scanner-modal__icon">
            <UIcon name="i-heroicons-qr-code" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="scanner-modal__title">Barcode Scanner</h3>
            <p class="scanner-modal__subtitle">Cross-device optical &amp; hardware tag scanning for POS</p>
          </div>
        </div>

        <button class="scanner-modal__close-btn" @click="closeModal">
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>

      <!-- Mode Selector Tabs -->
      <div class="scanner-tabs">
        <button
          type="button"
          class="scanner-tab"
          :class="{ 'is-active': activeTab === 'camera' }"
          @click="activeTab = 'camera'"
        >
          <UIcon name="i-heroicons-camera" class="w-4 h-4" />
          Live Camera
        </button>

        <button
          type="button"
          class="scanner-tab"
          :class="{ 'is-active': activeTab === 'image' }"
          @click="activeTab = 'image'"
        >
          <UIcon name="i-heroicons-photo" class="w-4 h-4" />
          Image File
        </button>
      </div>

      <!-- Tab 1: Live Camera Scanner -->
      <div v-if="activeTab === 'camera'" class="scanner-body">
        <div v-if="cameraError" class="scanner-notice scanner-notice--error">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 flex-shrink-0 text-amber-500" />
          <div>
            <strong>Camera Unavailable:</strong> {{ cameraError }}
            <p class="mt-1 text-xs text-slate-400">
              Check browser permissions, or switch to "Image File" above.
            </p>
          </div>
        </div>

        <!-- Camera Device Selector (if multiple cameras available) -->
        <div v-if="availableCameras.length > 1" class="scanner-camera-controls">
          <label class="camera-select-label">
            <UIcon name="i-heroicons-video-camera" class="w-3.5 h-3.5 text-slate-400" />
            <span>Select Camera:</span>
          </label>
          <select
            v-model="selectedCameraId"
            class="camera-select-input"
            @change="restartCameraScanner"
          >
            <option
              v-for="cam in availableCameras"
              :key="cam.id"
              :value="cam.id"
            >
              {{ cam.label || `Camera ${cam.id.slice(0, 6)}` }}
            </option>
          </select>
        </div>

        <!-- Viewport Box -->
        <div class="scanner-camera-viewport-wrap">
          <div id="pos-barcode-camera-reader" class="scanner-camera-reader" />
          <div v-if="isCameraStarting" class="scanner-camera-loader">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-slate-300" />
            <span class="mt-2 text-xs text-slate-300">Initializing camera lens...</span>
          </div>
        </div>

        <p class="text-xs text-center text-slate-400">
          Point your webcam or camera at standard retail barcodes (EAN-13, Code 128, UPC, QR).
        </p>
      </div>

      <!-- Tab 2: Local Image File Barcode Decoder -->
      <div v-if="activeTab === 'image'" class="scanner-body">
        <div
          class="scanner-dropzone"
          :class="{ 'is-dragging': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleFileDrop"
          @click="triggerFileInput"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          />
          <UIcon name="i-heroicons-arrow-up-tray" class="w-8 h-8 text-slate-400 mb-2" />
          <strong class="text-sm text-slate-200">Click or drag a barcode image here</strong>
          <p class="text-xs text-slate-400 mt-1">
            PNG, JPEG, WEBP photos of tags or product receipts. Decoded entirely inside your browser.
          </p>
          <div v-if="isDecodingImage" class="mt-3 flex items-center gap-2 text-xs text-slate-300">
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            Decoding image...
          </div>
        </div>

        <div v-if="imageDecodeMessage" class="scanner-notice scanner-notice--info">
          <UIcon name="i-heroicons-information-circle" class="w-4 h-4 flex-shrink-0" />
          <span>{{ imageDecodeMessage }}</span>
        </div>
      </div>

      <!-- Hidden container used for file decoding -->
      <div id="pos-barcode-hidden-file-decoder" class="hidden" />

      <!-- Recent Scans / Live Log -->
      <div class="scanner-scans-panel">
        <div class="scans-header">
          <span class="scans-title">Live Scanned Items ({{ recentScans.length }})</span>
          <button v-if="recentScans.length" type="button" class="clear-scans-btn" @click="recentScans = []">
            Clear
          </button>
        </div>

        <div v-if="recentScans.length === 0" class="scans-empty">
          No items scanned yet in this session.
        </div>

        <div v-else class="scans-list">
          <div
            v-for="(scan, idx) in recentScans"
            :key="idx"
            class="scan-item"
          >
            <div class="scan-item__code font-mono">{{ scan.barcode }}</div>
            <div class="scan-item__meta">
              <span class="scan-item__source">{{ scan.source || 'Camera' }}</span>
              <span class="scan-item__time">{{ formatTime(scan.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="scanner-modal__footer">
        <button type="button" class="btn btn--secondary" @click="closeModal">
          Done
        </button>
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { usePosAudio } from '~/composables/usePosAudio'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
  }>(),
  {
    modelValue: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'scanned', barcode: string): void
}>()

const isPC = ref(true)
const hasLocalCamera = ref(false)
const activeTab = ref<'camera' | 'image'>('camera')

const availableCameras = ref<Array<{ id: string; label: string }>>([])
const selectedCameraId = ref<string>('')
const isCameraStarting = ref(false)
const cameraError = ref<string | null>(null)

const isDragging = ref(false)
const isDecodingImage = ref(false)
const imageDecodeMessage = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const recentScans = ref<any[]>([])

let html5QrScannerInstance: any = null
let lastHandledBarcode = ''
let lastHandledTime = 0

const { playBeep } = usePosAudio()

// Sound synthesizer for crisp cashier chime
function playChime() {
  playBeep(true)
}

// Handle incoming scan
function onBarcodeReceived(barcode: string, source = 'Camera') {
  if (!barcode) return
  const now = Date.now()
  if (barcode === lastHandledBarcode && now - lastHandledTime < 1200) {
    return
  }
  lastHandledBarcode = barcode
  lastHandledTime = now

  playChime()
  recentScans.value.unshift({
    barcode,
    source,
    timestamp: now,
  })

  // Emit to parent POS
  emit('scanned', barcode)
}

// ── HTML5-QRCode Live Camera Scanner ───────────────────────────────────
async function startCameraScanner() {
  if (typeof window === 'undefined') return
  await stopCameraScanner()

  cameraError.value = null
  isCameraStarting.value = true

  try {
    const { Html5Qrcode } = await import('html5-qrcode')

    await nextTick()
    const container = document.getElementById('pos-barcode-camera-reader')
    if (!container) {
      isCameraStarting.value = false
      return
    }

    // Enumerate devices if not already populated
    if (availableCameras.value.length === 0) {
      try {
        const devices = await Html5Qrcode.getCameras()
        if (devices && devices.length > 0) {
          availableCameras.value = devices.map((d: any) => ({
            id: d.id,
            label: d.label || `Camera ${d.id.slice(0, 5)}`,
          }))
          if (!selectedCameraId.value) {
            // Prefer rear/environment camera if available
            const backCam = devices.find((d: any) => /back|rear|environment/i.test(d.label))
            selectedCameraId.value = backCam ? backCam.id : (devices[0]?.id || '')
          }
        }
      } catch {
        // Enumerate may fail if permission not yet granted; proceed with facingMode fallback
      }
    }

    html5QrScannerInstance = new Html5Qrcode('pos-barcode-camera-reader')

    const cameraConfig = selectedCameraId.value
      ? { deviceId: { exact: selectedCameraId.value } }
      : { facingMode: 'environment' }

    await html5QrScannerInstance.start(
      cameraConfig,
      {
        fps: 10,
        qrbox: { width: 260, height: 180 },
        aspectRatio: 1.333333,
      },
      (decodedText: string) => {
        onBarcodeReceived(decodedText, 'Live Camera')
      },
      () => {
        // Ignore frame scan misses
      },
    )
  } catch (err: any) {
    cameraError.value = err?.message || 'Unable to access camera device'
  } finally {
    isCameraStarting.value = false
  }
}

async function stopCameraScanner() {
  if (html5QrScannerInstance) {
    try {
      if (html5QrScannerInstance.isScanning) {
        await html5QrScannerInstance.stop()
      }
      html5QrScannerInstance.clear()
    } catch {
      // Stream stop cleanup
    } finally {
      html5QrScannerInstance = null
    }
  }
}

async function restartCameraScanner() {
  await stopCameraScanner()
  await startCameraScanner()
}

// ── Image File Barcode Decoding ───────────────────────────────────────
function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target?.files?.[0]
  if (file) {
    decodeImageFile(file)
  }
  if (target) target.value = ''
}

function handleFileDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    decodeImageFile(file)
  }
}

async function decodeImageFile(file: File) {
  isDecodingImage.value = true
  imageDecodeMessage.value = null

  try {
    const { Html5Qrcode } = await import('html5-qrcode')
    const decoder = new Html5Qrcode('pos-barcode-hidden-file-decoder')
    try {
      const decodedText = await decoder.scanFile(file, true)
      if (decodedText) {
        imageDecodeMessage.value = `Successfully decoded barcode: ${decodedText}`
        onBarcodeReceived(decodedText, 'Image File')
      } else {
        imageDecodeMessage.value = 'No recognizable barcode detected in this image.'
      }
    } finally {
      decoder.clear()
    }
  } catch {
    imageDecodeMessage.value = 'Could not find a valid barcode in this image. Ensure the barcode is clear and unblurred.'
  } finally {
    isDecodingImage.value = false
  }
}

async function checkDeviceAndCameras() {
  if (typeof navigator === 'undefined') return
  isPC.value = !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

  try {
    if (navigator.mediaDevices?.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter(d => d.kind === 'videoinput')
      hasLocalCamera.value = videoInputs.length > 0
    } else {
      hasLocalCamera.value = false
    }
  } catch {
    hasLocalCamera.value = false
  }
}

function closeModal() {
  emit('update:modelValue', false)
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ── Watchers & Lifecycle ──────────────────────────────────────────────
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    await checkDeviceAndCameras()
    if (activeTab.value === 'camera') {
      await startCameraScanner()
    }
  } else {
    await stopCameraScanner()
  }
})

watch(activeTab, async (tab) => {
  if (props.modelValue) {
    if (tab === 'camera') {
      await startCameraScanner()
    } else {
      await stopCameraScanner()
    }
  }
})

onMounted(() => {
  checkDeviceAndCameras()
})

onUnmounted(() => {
  stopCameraScanner()
})
</script>

<style scoped>
.scanner-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 540px;
}

.scanner-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
  padding-bottom: 12px;
}

.scanner-modal__title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scanner-modal__icon {
  width: 38px;
  height: 38px;
  border-radius: 6px;
  background: var(--surface-active, #f1f5f9);
  color: var(--text-primary, #0f172a);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle, #e5e7eb);
}

.scanner-modal__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  margin: 0;
}

.scanner-modal__subtitle {
  font-size: 12px;
  color: var(--text-tertiary, #64748b);
  margin: 0;
}

.scanner-modal__close-btn {
  background: transparent;
  border: none;
  color: var(--text-tertiary, #64748b);
  cursor: pointer;
  padding: 4px;
}

.scanner-modal__close-btn:hover {
  color: var(--text-primary, #0f172a);
}

/* Tabs */
.scanner-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
  gap: 4px;
}

.scanner-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #475569);
  cursor: pointer;
  margin-bottom: -1px;
}

.scanner-tab.is-active {
  color: var(--text-primary, #0f172a);
  border-bottom-color: var(--text-primary, #0f172a);
}

/* Body */
.scanner-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.scanner-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.4;
}

.scanner-notice--info {
  background: var(--surface-hover, #f8fafc);
  border: 1px solid var(--border-subtle, #e5e7eb);
  color: var(--text-primary, #0f172a);
}

.scanner-notice--error {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid var(--border-subtle, #e5e7eb);
  color: var(--text-primary, #0f172a);
}

/* Camera controls & viewport */
.scanner-camera-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.camera-select-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary, #475569);
}

.camera-select-input {
  flex: 1;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--text-primary, #0f172a);
}

.scanner-camera-viewport-wrap {
  position: relative;
  width: 100%;
  min-height: 240px;
  background: #090d16;
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scanner-camera-reader {
  width: 100% !important;
  border: none !important;
}

.scanner-camera-loader {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.85);
  z-index: 10;
}

/* Image Dropzone */
.scanner-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px 16px;
  background: var(--surface, #ffffff);
  border: 1.5px dashed var(--border-subtle, #cbd5e1);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.scanner-dropzone:hover,
.scanner-dropzone.is-dragging {
  background: var(--surface-hover, #f8fafc);
}

/* Recent Scans Live List */
.scanner-scans-panel {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 140px;
  overflow-y: auto;
}

.scans-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.scans-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.clear-scans-btn {
  font-size: 11px;
  color: var(--text-tertiary, #64748b);
  background: transparent;
  border: none;
  cursor: pointer;
}

.scans-empty {
  font-size: 12px;
  color: var(--text-tertiary, #64748b);
  font-style: italic;
  padding: 6px 0;
}

.scans-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scan-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: var(--surface-hover, #f8fafc);
  border-radius: 4px;
  border: 1px solid var(--border-subtle, #e5e7eb);
}

.scan-item__code {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
}

.scan-item__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-tertiary, #64748b);
}

.scan-item__source {
  background: var(--surface-active, #f1f5f9);
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid var(--border-subtle, #e5e7eb);
}

/* Footer */
.scanner-modal__footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--border-subtle, #e5e7eb);
  padding-top: 12px;
}
</style>
