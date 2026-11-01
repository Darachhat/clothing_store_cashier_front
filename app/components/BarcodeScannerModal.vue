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
            <p class="scanner-modal__subtitle">Optical tag scanning for Point of Sale</p>
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
          :class="{ 'is-active': activeTab === 'phone' }"
          @click="activeTab = 'phone'"
        >
          <UIcon name="i-heroicons-device-phone-mobile" class="w-4 h-4" />
          Connect Phone (Wireless)
          <span v-if="phoneConnected" class="scanner-tab__online-dot" />
        </button>

        <button
          type="button"
          class="scanner-tab"
          :class="{ 'is-active': activeTab === 'webcam' }"
          @click="activeTab = 'webcam'"
        >
          <UIcon name="i-heroicons-video-camera" class="w-4 h-4" />
          PC Webcam
          <span v-if="!hasLocalCamera && isPC" class="scanner-tab__badge-warn">None</span>
        </button>
      </div>

      <!-- Tab 1: Phone Wireless Pairing -->
      <div v-if="activeTab === 'phone'" class="scanner-body">
        <!-- PC Camera Missing Banner (if applicable) -->
        <div v-if="isPC && !hasLocalCamera" class="scanner-notice scanner-notice--info">
          <UIcon name="i-heroicons-information-circle" class="w-5 h-5 flex-shrink-0" />
          <div>
            <strong>No camera detected on this PC.</strong>
            Please connect your mobile phone as a wireless barcode scanner by scanning the QR code below.
          </div>
        </div>

        <div class="scanner-pairing-grid">
          <!-- QR Code Box -->
          <div class="scanner-qr-card">
            <div class="scanner-qr-frame">
              <img
                v-if="qrCodeUrl"
                :src="qrCodeUrl"
                alt="Scanner pairing QR Code"
                class="scanner-qr-img"
              />
              <div v-else class="scanner-qr-loading">Generating QR...</div>
            </div>

            <div class="scanner-status-indicator" :class="{ 'is-connected': phoneConnected }">
              <span class="status-pulse-dot" />
              <span>{{ phoneConnected ? 'Phone Connected & Active' : 'Waiting for phone connection...' }}</span>
            </div>
          </div>

          <!-- Pairing Instructions -->
          <div class="scanner-instructions">
            <div class="instruction-step">
              <span class="step-num">1</span>
              <div>
                <strong>Scan QR Code with your phone</strong>
                <p>Open camera app on your phone and tap the link</p>
              </div>
            </div>

            <div class="instruction-step">
              <span class="step-num">2</span>
              <div>
                <strong>Point phone camera at tag</strong>
                <p>Barcodes are transmitted directly to this POS screen in real time</p>
              </div>
            </div>

            <!-- LAN IP / Host config for testing -->
            <div class="scanner-link-config">
              <label class="config-label">Companion Link:</label>
              <div class="config-input-group">
                <input
                  v-model="customHost"
                  type="text"
                  placeholder="e.g. 192.168.1.10:3000"
                  class="config-input font-mono"
                  @change="updateHost"
                />
                <button type="button" class="btn btn--secondary btn--sm" @click="copyPairingUrl">
                  {{ copied ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <span class="config-hint font-mono text-xs">PIN: {{ sessionShortCode }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: PC Webcam -->
      <div v-else-if="activeTab === 'webcam'" class="scanner-body">
        <div v-if="!hasLocalCamera" class="scanner-empty-cam">
          <UIcon name="i-heroicons-video-camera-slash" class="w-10 h-10 text-slate-400" />
          <div class="empty-title">No Webcam Found on this PC</div>
          <p class="empty-desc">Connect a USB webcam, or switch to the "Connect Phone" tab to use your smartphone camera.</p>
          <button type="button" class="btn btn--primary btn--sm" @click="activeTab = 'phone'">
            Switch to Phone Scanner
          </button>
        </div>

        <div v-else class="scanner-webcam-feed">
          <video ref="webcamVideoRef" autoplay playsinline muted class="webcam-video" />
          <div class="webcam-overlay">
            <div class="webcam-reticle" />
          </div>
        </div>
      </div>

      <!-- Recent Scans / Live Log -->
      <div class="scanner-scans-panel">
        <div class="scans-header">
          <span class="scans-title">Live Scanned Items ({{ recentScans.length }})</span>
          <button v-if="recentScans.length" type="button" class="clear-scans-btn" @click="recentScans = []">
            Clear
          </button>
        </div>

        <div v-if="recentScans.length === 0" class="scans-empty">
          No items scanned yet. Scan a garment barcode or SKU to add directly to cart.
        </div>

        <div v-else class="scans-list">
          <div
            v-for="(scan, idx) in recentScans"
            :key="idx"
            class="scan-item"
          >
            <div class="scan-item__code font-mono">{{ scan.barcode }}</div>
            <div class="scan-item__meta">
              <span class="scan-item__source">{{ scan.source || 'Phone' }}</span>
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

const config = useRuntimeConfig()
const apiBase = config.public.apiBase || '/api/proxy'
const backendBase = (config.public.backendBase as string) || (apiBase.startsWith('http') ? apiBase : 'http://localhost:8000')

const isPC = ref(true)
const hasLocalCamera = ref(false)
const activeTab = ref<'phone' | 'webcam'>('phone')
const phoneConnected = ref(false)
const copied = ref(false)

const sessionId = ref('')
const sessionShortCode = ref('')
const customHost = ref('')
const qrCodeUrl = ref('')
const recentScans = ref<any[]>([])

const webcamVideoRef = ref<HTMLVideoElement | null>(null)
let webcamStream: MediaStream | null = null
let ws: WebSocket | null = null
let pollInterval: any = null
let lastHandledBarcode = ''
let lastHandledTime = 0

// Sound synthesizer for crisp cashier chime
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1) // A6
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  } catch {
    // blocked
  }
}

// Generate or restore persistent session token
function initSession() {
  let saved = ''
  if (typeof window !== 'undefined') {
    saved = localStorage.getItem('pos_scanner_session_id') || ''
  }
  if (!saved) {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
    saved = `sess_${rand}`
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_scanner_session_id', saved)
    }
  }
  sessionId.value = saved
  sessionShortCode.value = saved.replace(/^sess_/, '')

  if (typeof window !== 'undefined') {
    customHost.value = window.location.host
  }
  updateQrUrl()
}

// Companion pairing URL
const pairingUrl = computed(() => {
  const host = customHost.value.trim() || (typeof window !== 'undefined' ? window.location.host : 'localhost:3002')
  const proto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:'
  return `${proto}//${host}/pos/scanner?session=${sessionId.value}`
})

function updateQrUrl() {
  qrCodeUrl.value = `${backendBase}/api/v1/scanner/qr?text=${encodeURIComponent(pairingUrl.value)}`
}

function updateHost() {
  updateQrUrl()
}

async function copyPairingUrl() {
  try {
    await navigator.clipboard.writeText(pairingUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    //
  }
}

// Handle incoming scan
function onBarcodeReceived(barcode: string, source = 'Phone Camera') {
  if (!barcode) return
  const now = Date.now()
  if (barcode === lastHandledBarcode && now - lastHandledTime < 1500) {
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

// WebSocket connection to backend
function connectWebSocket() {
  if (!sessionId.value) return
  const wsProto = backendBase.startsWith('https') ? 'wss' : 'ws'
  const wsHost = backendBase.replace(/^https?:\/\//, '')
  const wsUrl = `${wsProto}://${wsHost}/api/v1/scanner/ws/${sessionId.value}?client_type=pc`

  try {
    ws = new WebSocket(wsUrl)
    ws.onmessage = (event) => {
      try {
        const data = jsonParse(event.data)
        if (data.type === 'peer_connected' && data.client_type === 'phone') {
          phoneConnected.value = true
        } else if (data.type === 'peer_disconnected' && data.client_type === 'phone') {
          phoneConnected.value = false
        } else if (data.type === 'barcode_scanned') {
          onBarcodeReceived(data.barcode, 'Phone Camera')
        }
      } catch {
        //
      }
    }
    ws.onclose = () => {
      // Reconnect in 3s if modal still open
      if (props.modelValue) {
        setTimeout(connectWebSocket, 3000)
      }
    }
  } catch {
    //
  }
}

function jsonParse(str: string) {
  try { return JSON.parse(str) } catch { return {} }
}

// Poll fallback for reliable status & scans
async function pollSession() {
  if (!sessionId.value || !props.modelValue) return
  try {
    const res = await fetch(`${backendBase}/api/v1/scanner/${sessionId.value}/status`)
    if (res.ok) {
      const data = await res.json()
      if (data.phone_connected) {
        phoneConnected.value = true
      }
      if (data.last_barcode && data.last_barcode !== lastHandledBarcode) {
        onBarcodeReceived(data.last_barcode, 'Phone (HTTP)')
      }
    }
  } catch {
    //
  }
}

// Detect hardware
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

  // If on PC without camera, force phone tab
  if (isPC.value && !hasLocalCamera.value) {
    activeTab.value = 'phone'
  }
}

// PC Webcam stream
async function startWebcam() {
  if (!hasLocalCamera.value) return
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
    })
    if (webcamVideoRef.value) {
      webcamVideoRef.value.srcObject = webcamStream
    }
  } catch {
    //
  }
}

function stopWebcam() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(t => t.stop())
    webcamStream = null
  }
}

function closeModal() {
  emit('update:modelValue', false)
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    initSession()
    checkDeviceAndCameras()
    connectWebSocket()
    pollInterval = setInterval(pollSession, 2000)
    if (activeTab.value === 'webcam') {
      startWebcam()
    }
  } else {
    if (ws) {
      ws.close()
      ws = null
    }
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
    stopWebcam()
  }
})

watch(activeTab, (tab) => {
  if (tab === 'webcam') {
    startWebcam()
  } else {
    stopWebcam()
  }
})

onMounted(() => {
  checkDeviceAndCameras()
})

onUnmounted(() => {
  if (ws) ws.close()
  if (pollInterval) clearInterval(pollInterval)
  stopWebcam()
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
  border-bottom: 1px solid var(--border);
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
  background: var(--surface-active);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.scanner-modal__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.scanner-modal__subtitle {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0;
}

.scanner-modal__close-btn {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 4px;
}

.scanner-modal__close-btn:hover {
  color: var(--text-primary);
}

/* Tabs */
.scanner-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
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
  color: var(--text-secondary);
  cursor: pointer;
  margin-bottom: -1px;
}

.scanner-tab.is-active {
  color: var(--text-primary);
  border-bottom-color: var(--text-primary);
}

.scanner-tab__online-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

.scanner-tab__badge-warn {
  font-size: 10px;
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  padding: 1px 5px;
  border-radius: 4px;
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
  background: var(--surface-hover);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.scanner-pairing-grid {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 16px;
  align-items: start;
}

.scanner-qr-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.scanner-qr-frame {
  width: 170px;
  height: 170px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scanner-qr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.scanner-qr-loading {
  font-size: 12px;
  color: var(--text-tertiary);
}

.scanner-status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #f59e0b;
}

.scanner-status-indicator.is-connected {
  color: #10b981;
}

.status-pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.7; }
}

.scanner-instructions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.instruction-step {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 12px;
}

.instruction-step strong {
  color: var(--text-primary);
  display: block;
}

.instruction-step p {
  color: var(--text-tertiary);
  margin: 2px 0 0 0;
}

.step-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--surface-active);
  color: var(--text-primary);
  font-weight: 700;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.scanner-link-config {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.config-input-group {
  display: flex;
  gap: 6px;
}

.config-input {
  flex: 1;
  font-size: 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 4px 8px;
  background: var(--surface-hover);
  color: var(--text-primary);
}

.config-hint {
  color: var(--text-tertiary);
}

/* Webcam tab */
.scanner-empty-cam {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px 16px;
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: 8px;
  gap: 8px;
  color: var(--text-secondary);
}

.empty-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.empty-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  max-width: 320px;
}

.scanner-webcam-feed {
  position: relative;
  width: 100%;
  height: 220px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.webcam-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.webcam-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.webcam-reticle {
  width: 200px;
  height: 120px;
  border: 2px dashed rgba(255, 255, 255, 0.7);
  border-radius: 8px;
}

/* Recent Scans Live List */
.scanner-scans-panel {
  background: var(--surface);
  border: 1px solid var(--border);
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
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.clear-scans-btn {
  font-size: 11px;
  color: var(--text-tertiary);
  background: transparent;
  border: none;
  cursor: pointer;
}

.scans-empty {
  font-size: 12px;
  color: var(--text-tertiary);
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
  background: var(--surface-hover);
  border-radius: 4px;
  border: 1px solid var(--border-subtle, #e2e8f0);
}

.scan-item__code {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.scan-item__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.scan-item__source {
  background: var(--surface-active);
  padding: 1px 5px;
  border-radius: 3px;
}

/* Footer */
.scanner-modal__footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--border);
  padding-top: 12px;
}
</style>
