<template>
  <AppModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <div class="flex flex-col gap-4 w-full max-w-[540px]">
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-md bg-surface-active text-text-primary flex items-center justify-center border border-border-subtle">
            <UIcon name="i-heroicons-qr-code" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-[15px] font-semibold text-text-primary m-0">Barcode Scanner</h3>
            <p class="text-xs text-text-tertiary m-0">Cross-device optical &amp; hardware tag scanning for POS</p>
          </div>
        </div>

        <button class="p-1 bg-transparent border-0 text-text-tertiary hover:text-text-primary cursor-pointer transition-colors" @click="closeModal">
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>

      <!-- Mode Selector Tabs -->
      <div class="flex border-b border-border-subtle gap-1">
        <button
          type="button"
          class="flex items-center gap-1.5 px-3.5 py-2 bg-transparent border-0 border-b-2 font-medium text-[13px] cursor-pointer -mb-px transition-colors"
          :class="activeTab === 'camera' ? 'text-text-primary border-b-text-primary' : 'text-text-secondary border-b-transparent hover:text-text-primary'"
          @click="activeTab = 'camera'"
        >
          <UIcon name="i-heroicons-camera" class="w-4 h-4" />
          Live Camera
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 px-3.5 py-2 bg-transparent border-0 border-b-2 font-medium text-[13px] cursor-pointer -mb-px transition-colors"
          :class="activeTab === 'image' ? 'text-text-primary border-b-text-primary' : 'text-text-secondary border-b-transparent hover:text-text-primary'"
          @click="activeTab = 'image'"
        >
          <UIcon name="i-heroicons-photo" class="w-4 h-4" />
          Image File
        </button>
      </div>

      <!-- Tab 1: Live Camera Scanner -->
      <div v-if="activeTab === 'camera'" class="flex flex-col gap-3.5">
        <div v-if="cameraError" class="flex items-start gap-2.5 p-2.5 rounded-md text-xs leading-snug bg-amber-500/10 border border-border-subtle text-text-primary">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 flex-shrink-0 text-amber-500" />
          <div>
            <strong>Camera Unavailable:</strong> {{ cameraError }}
            <p class="mt-1 text-xs text-text-tertiary">
              Check browser permissions, or switch to "Image File" above.
            </p>
          </div>
        </div>

        <!-- Camera Device Selector (if multiple cameras available) -->
        <div v-if="availableCameras.length > 1" class="flex items-center gap-2 text-xs">
          <label class="flex items-center gap-1 text-text-secondary">
            <UIcon name="i-heroicons-video-camera" class="w-3.5 h-3.5 text-text-tertiary" />
            <span>Select Camera:</span>
          </label>
          <select
            v-model="selectedCameraId"
            class="flex-1 bg-surface-card border border-border-subtle rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-default"
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
        <div class="relative w-full min-h-[240px] bg-[#090d16] border border-border-subtle rounded-lg overflow-hidden flex items-center justify-center">
          <div id="pos-barcode-camera-reader" class="w-full !border-0" />
          <div v-if="isCameraStarting" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/85 z-10">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-slate-300" />
            <span class="mt-2 text-xs text-slate-300">Initializing camera lens...</span>
          </div>
        </div>

        <p class="text-xs text-center text-text-tertiary">
          Point your webcam or camera at standard retail barcodes (EAN-13, Code 128, UPC, QR).
        </p>
      </div>

      <!-- Tab 2: Local Image File Barcode Decoder -->
      <div v-if="activeTab === 'image'" class="flex flex-col gap-3.5">
        <div
          class="flex flex-col items-center justify-center text-center p-8 bg-surface-card border-2 border-dashed border-border-subtle rounded-lg cursor-pointer transition-colors"
          :class="isDragging ? 'bg-surface-active' : 'hover:bg-surface-hover'"
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
          <UIcon name="i-heroicons-arrow-up-tray" class="w-8 h-8 text-text-tertiary mb-2" />
          <strong class="text-sm text-text-primary">Click or drag a barcode image here</strong>
          <p class="text-xs text-text-tertiary mt-1">
            PNG, JPEG, WEBP photos of tags or product receipts. Decoded entirely inside your browser.
          </p>
          <div v-if="isDecodingImage" class="mt-3 flex items-center gap-2 text-xs text-text-secondary">
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            Decoding image...
          </div>
        </div>

        <div v-if="imageDecodeMessage" class="flex items-start gap-2.5 p-2.5 rounded-md text-xs leading-snug bg-surface-hover border border-border-subtle text-text-primary">
          <UIcon name="i-heroicons-information-circle" class="w-4 h-4 flex-shrink-0 text-text-secondary" />
          <span>{{ imageDecodeMessage }}</span>
        </div>
      </div>

      <!-- Hidden container used for file decoding -->
      <div id="pos-barcode-hidden-file-decoder" class="hidden" />

      <!-- Recent Scans / Live Log -->
      <div class="bg-surface-card border border-border-subtle rounded-md p-2.5 flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pos-scroll">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Live Scanned Items ({{ recentScans.length }})</span>
          <button v-if="recentScans.length" type="button" class="text-[11px] text-text-tertiary bg-transparent border-0 cursor-pointer hover:text-text-primary transition-colors" @click="recentScans = []">
            Clear
          </button>
        </div>

        <div v-if="recentScans.length === 0" class="text-xs text-text-tertiary italic py-1.5">
          No items scanned yet in this session.
        </div>

        <div v-else class="flex flex-col gap-1">
          <div
            v-for="(scan, idx) in recentScans"
            :key="idx"
            class="flex items-center justify-between px-2 py-1.5 bg-surface-hover rounded border border-border-subtle"
          >
            <div class="text-[13px] font-semibold text-text-primary font-mono">{{ scan.barcode }}</div>
            <div class="flex items-center gap-2 text-[11px] text-text-tertiary">
              <span class="bg-surface-active px-1.5 py-0.5 rounded border border-border-subtle">{{ scan.source || 'Camera' }}</span>
              <span>{{ formatTime(scan.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end pt-3 border-t border-border-subtle">
        <AppButton variant="default" @click="closeModal">
          Done
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { usePosAudio } from '~/composables/usePosAudio'
import { normalizeScannedCode } from '~/utils/scanCode'

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
function onBarcodeReceived(rawBarcode: string, source = 'Camera') {
  const barcode = normalizeScannedCode(rawBarcode) || rawBarcode?.trim()
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

