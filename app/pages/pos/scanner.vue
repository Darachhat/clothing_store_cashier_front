<template>
  <div class="mobile-scanner">
    <!-- Header -->
    <header class="mobile-scanner__header">
      <div class="mobile-scanner__brand">
        <NuxtLink
          to="/pos"
          class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          title="Return to POS Terminal"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          <span>Back to POS</span>
        </NuxtLink>
        <div class="mobile-scanner__logo-dot ml-1" />
        <span class="mobile-scanner__title">POS Mobile Scanner</span>
      </div>

      <div class="mobile-scanner__status-badge" :class="{ 'is-connected': isConnected }">
        <span class="status-indicator-dot" />
        {{ isConnected ? 'Connected to PC' : 'Local / Standby' }}
      </div>
    </header>

    <!-- Session Bar -->
    <div class="mobile-scanner__session-bar">
      <span>Session: <strong class="font-mono">{{ sessionId }}</strong></span>
      <span class="mobile-scanner__count-tag">Scans: {{ scanCount }}</span>
    </div>

    <!-- Camera Viewfinder -->
    <div class="mobile-scanner__viewport">
      <video
        ref="videoRef"
        class="mobile-scanner__video"
        playsinline
        muted
        autoplay
      />

      <!-- Aiming Reticle / Laser -->
      <div class="mobile-scanner__reticle">
        <div class="mobile-scanner__corner top-left" />
        <div class="mobile-scanner__corner top-right" />
        <div class="mobile-scanner__corner bottom-left" />
        <div class="mobile-scanner__corner bottom-right" />
        <div class="mobile-scanner__laser" />
        <p class="mobile-scanner__hint">Align barcode inside the frame</p>
      </div>

      <!-- Flash / Torch Toggle -->
      <button
        v-if="hasTorch"
        type="button"
        class="mobile-scanner__torch-btn"
        :class="{ 'is-active': torchOn }"
        @click="toggleTorch"
      >
        <UIcon name="i-heroicons-bolt" class="w-5 h-5" />
      </button>

      <!-- Success Flash Overlay -->
      <div v-if="showFlash" class="mobile-scanner__flash-overlay" />
    </div>

    <!-- Recent Scanned Tag Notification -->
    <div v-if="lastScanned" class="mobile-scanner__recent-alert">
      <div class="recent-alert__icon">
        <UIcon name="i-heroicons-check" class="w-4 h-4 text-emerald-600" />
      </div>
      <div class="recent-alert__content">
        <div class="recent-alert__title">Scanned &amp; Sent to Cashier PC</div>
        <div class="recent-alert__code font-mono">{{ lastScanned }}</div>
      </div>
    </div>

    <!-- Manual Code Input Fallback -->
    <div class="mobile-scanner__manual-panel">
      <form class="mobile-scanner__manual-form" @submit.prevent="handleManualSubmit">
        <input
          v-model="manualCode"
          type="text"
          placeholder="Or type barcode / SKU manually"
          class="mobile-scanner__manual-input font-mono"
        />
        <button type="submit" class="mobile-scanner__send-btn" :disabled="!manualCode.trim()">
          Send
        </button>
      </form>
    </div>

    <!-- Camera Error State -->
    <div v-if="cameraError" class="mobile-scanner__error-box">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 flex-shrink-0" />
      <div class="error-text">
        <strong>Camera Unavailable:</strong> {{ cameraError }}. Please allow camera permissions in your browser or use the manual code input above.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'POS Wireless Scanner — Companion',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
  ],
})

const route = useRoute()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase || '/api/proxy'
const backendBase = (config.public.backendBase as string) || (apiBase.startsWith('http') ? apiBase : 'http://localhost:8000')

const storedSessionId = ref('default')
const sessionId = computed(() => (route.query.session as string) || storedSessionId.value || 'default')
let scannerBroadcastChannel: BroadcastChannel | null = null

const videoRef = ref<HTMLVideoElement | null>(null)
const isConnected = ref(false)
const scanCount = ref(0)
const lastScanned = ref<string | null>(null)
const showFlash = ref(false)
const manualCode = ref('')
const cameraError = ref<string | null>(null)
const hasTorch = ref(false)
const torchOn = ref(false)

let stream: MediaStream | null = null
let videoTrack: MediaStreamTrack | null = null
let ws: WebSocket | null = null
let scanInterval: any = null
let isProcessing = false
let lastScannedCode = ''
let lastScannedTime = 0

// Synthesize audio beep
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1050, ctx.currentTime)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  } catch {
    // AudioContext blocked
  }
}

// Setup WebSocket
function initWebSocket() {
  const wsProto = backendBase.startsWith('https') ? 'wss' : 'ws'
  const wsHost = backendBase.replace(/^https?:\/\//, '')
  const wsUrl = `${wsProto}://${wsHost}/api/v1/scanner/ws/${sessionId.value}?client_type=phone`

  try {
    ws = new WebSocket(wsUrl)
    ws.onopen = () => {
      isConnected.value = true
      ws?.send(JSON.stringify({ type: 'identify', client_type: 'phone' }))
    }
    ws.onclose = () => {
      isConnected.value = false
      setTimeout(initWebSocket, 3000)
    }
    ws.onerror = () => {
      isConnected.value = false
    }
  } catch (err) {
    console.error('WS error:', err)
  }
}

// Send scanned barcode to PC
async function sendScan(code: string, format = 'UNKNOWN') {
  if (!code) return
  const now = Date.now()
  if (code === lastScannedCode && now - lastScannedTime < 1800) {
    return // Cooldown to avoid duplicate rapid scan
  }

  lastScannedCode = code
  lastScannedTime = now
  lastScanned.value = code
  scanCount.value++

  // Audio & Haptic feedback
  playBeep()
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100])
  }

  // Visual feedback
  showFlash.value = true
  setTimeout(() => {
    showFlash.value = false
  }, 400)

  // 0. Broadcast via BroadcastChannel for instant same-browser POS relay
  if (scannerBroadcastChannel) {
    try {
      scannerBroadcastChannel.postMessage({
        type: 'barcode_scanned',
        barcode: code,
        format,
        timestamp: now,
      })
    } catch {
      // ignore
    }
  }

  // 1. Send via WebSocket if connected
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'scan',
      barcode: code,
      format,
      device: navigator.userAgent.includes('iPhone') ? 'iPhone Camera' : 'Android Camera',
    }))
  }

  // 2. Also send via HTTP fallback
  try {
    await fetch(`${backendBase}/api/v1/scanner/${sessionId.value}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barcode: code,
        format,
        device_info: 'Mobile Phone Camera',
      }),
    })
  } catch (e) {
    console.error('HTTP scan send failed:', e)
  }
}

// Camera initialization
async function startCamera() {
  cameraError.value = null
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access not supported by this browser')
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    })

    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()
    }

    videoTrack = stream.getVideoTracks()[0] ?? null
    const capabilities = (videoTrack as any).getCapabilities?.() || {}
    if (capabilities.torch) {
      hasTorch.value = true
    }

    startBarcodeDetection()
  } catch (err: any) {
    cameraError.value = err.message || 'Permission denied or no camera found'
  }
}

async function toggleTorch() {
  if (!videoTrack) return
  torchOn.value = !torchOn.value
  try {
    await (videoTrack as any).applyConstraints({
      advanced: [{ torch: torchOn.value }],
    })
  } catch (err) {
    console.error('Torch error:', err)
  }
}

// Detection loop
function startBarcodeDetection() {
  if (typeof (window as any).BarcodeDetector !== 'undefined') {
    const formats = ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code']
    const detector = new (window as any).BarcodeDetector({ formats })

    scanInterval = setInterval(async () => {
      if (isProcessing || !videoRef.value || videoRef.value.readyState < 2) return
      isProcessing = true
      try {
        const barcodes = await detector.detect(videoRef.value)
        if (barcodes && barcodes.length > 0) {
          const raw = barcodes[0].rawValue
          const format = barcodes[0].format || 'BARCODE'
          if (raw) {
            sendScan(raw, format)
          }
        }
      } catch (err) {
        // detection frame error
      } finally {
        isProcessing = false
      }
    }, 200)
  } else {
    // Canvas fallback
    console.info('Native BarcodeDetector not available, using video stream canvas fallback')
  }
}

function handleManualSubmit() {
  if (manualCode.value.trim()) {
    sendScan(manualCode.value.trim(), 'MANUAL')
    manualCode.value = ''
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('pos_scanner_session_id')
    if (saved) storedSessionId.value = saved
    if (typeof BroadcastChannel !== 'undefined') {
      scannerBroadcastChannel = new BroadcastChannel('pos_scanner_channel')
    }
  }
  initWebSocket()
  startCamera()
})

onUnmounted(() => {
  if (scanInterval) clearInterval(scanInterval)
  if (ws) ws.close()
  if (scannerBroadcastChannel) {
    scannerBroadcastChannel.close()
    scannerBroadcastChannel = null
  }
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
  }
})
</script>

<style scoped>
.mobile-scanner {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #0f172a;
  color: #f8fafc;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.mobile-scanner__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  flex-shrink: 0;
}

.mobile-scanner__brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-scanner__logo-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #3b82f6;
}

.mobile-scanner__title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.mobile-scanner__status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 9999px;
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.mobile-scanner__status-badge.is-connected {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.status-indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.mobile-scanner__session-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  background: #090d16;
  font-size: 11px;
  color: #94a3b8;
  border-bottom: 1px solid #1e293b;
  flex-shrink: 0;
}

.mobile-scanner__count-tag {
  background: #1e293b;
  padding: 2px 6px;
  border-radius: 4px;
  color: #cbd5e1;
}

/* Viewport */
.mobile-scanner__viewport {
  position: relative;
  flex: 1;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.mobile-scanner__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Aiming Reticle */
.mobile-scanner__reticle {
  position: absolute;
  width: 260px;
  height: 200px;
  pointer-events: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.mobile-scanner__corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: rgba(255, 255, 255, 0.75);
  border-style: solid;
}

.mobile-scanner__corner.top-left {
  top: -2px;
  left: -2px;
  border-width: 4px 0 0 4px;
  border-top-left-radius: 10px;
}

.mobile-scanner__corner.top-right {
  top: -2px;
  right: -2px;
  border-width: 4px 4px 0 0;
  border-top-right-radius: 10px;
}

.mobile-scanner__corner.bottom-left {
  bottom: -2px;
  left: -2px;
  border-width: 0 0 4px 4px;
  border-bottom-left-radius: 10px;
}

.mobile-scanner__corner.bottom-right {
  bottom: -2px;
  right: -2px;
  border-width: 0 4px 4px 0;
  border-bottom-right-radius: 10px;
}

.mobile-scanner__laser {
  position: absolute;
  top: 50%;
  left: 5%;
  right: 5%;
  height: 2px;
  background: #ef4444;
  box-shadow: 0 0 8px #ef4444;
  animation: laserScan 2s infinite ease-in-out alternate;
}

@keyframes laserScan {
  0% { transform: translateY(-70px); }
  100% { transform: translateY(70px); }
}

.mobile-scanner__hint {
  position: absolute;
  bottom: -32px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.mobile-scanner__torch-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mobile-scanner__torch-btn.is-active {
  background: #f59e0b;
  color: #000;
}

.mobile-scanner__flash-overlay {
  position: absolute;
  inset: 0;
  background: rgba(16, 185, 129, 0.4);
  pointer-events: none;
}

/* Recent Scanned Alert */
.mobile-scanner__recent-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #0f172a;
  border-top: 1px solid #334155;
  padding: 10px 16px;
  flex-shrink: 0;
}

.recent-alert__icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #1e293b;
  color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
}

.recent-alert__title {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.recent-alert__code {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

/* Manual Input */
.mobile-scanner__manual-panel {
  padding: 12px 16px;
  background: #1e293b;
  border-top: 1px solid #334155;
  flex-shrink: 0;
}

.mobile-scanner__manual-form {
  display: flex;
  gap: 8px;
}

.mobile-scanner__manual-input {
  flex: 1;
  background: #0f172a;
  border: 1px solid #475569;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  color: #fff;
  outline: none;
}

.mobile-scanner__manual-input:focus {
  border-color: #94a3b8;
}

.mobile-scanner__send-btn {
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0 16px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}

.mobile-scanner__send-btn:disabled {
  opacity: 0.5;
}

.mobile-scanner__error-box {
  background: #7f1d1d;
  color: #fecaca;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
</style>
