// Composable for crisp, low-latency POS sound synthesis (Web Audio API)
// Provides acoustic feedback for barcode scans and payment approvals without external audio assets.
// Each sound accepts an optional `enabled` flag so callers can gate on settings.

export function usePosAudio() {
  let ctx: AudioContext | null = null

  function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        ctx = new AudioCtx()
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    return ctx
  }

  /**
   * Crisp, high-frequency industrial barcode scan chirp (Zebra/Honeywell style).
   * Short 55ms duration with zero-click envelope.
   * @param enabled  When false, skips playback (reads from pos settings).
   */
  function playBeep(enabled = true) {
    if (!enabled) return
    try {
      const audioCtx = getAudioContext()
      if (!audioCtx) return

      const t = audioCtx.currentTime
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()

      // High crisp tone with subtle downward micro-chirp for satisfying acoustic snap
      osc.type = 'sine'
      osc.frequency.setValueAtTime(2093, t) // C7
      osc.frequency.exponentialRampToValueAtTime(1760, t + 0.055) // A6

      // Smooth attack to eliminate clicking, exponential decay
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.14, t + 0.004)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055)

      osc.connect(gain)
      gain.connect(audioCtx.destination)

      osc.start(t)
      osc.stop(t + 0.055)
    } catch {
      // Audio failure is non-fatal
    }
  }

  /**
   * Signature ABA KHQR Payment Approval Chime.
   * Multi-tonal ascending celebration chime with a rich bell resonance.
   * Phase 1: High sparkle note (E6)
   * Phase 2: Harmonic A-Major chord (A5 + C#6 + E6 + overtone) with acoustic bell decay.
   * @param enabled  When false, skips playback (reads from pos settings).
   */
  function playAbaChime(enabled = true) {
    if (!enabled) return
    try {
      const audioCtx = getAudioContext()
      if (!audioCtx) return

      const t = audioCtx.currentTime

      // ── Sparkle leading chime (E6) ──
      const leadOsc = audioCtx.createOscillator()
      const leadGain = audioCtx.createGain()
      leadOsc.type = 'sine'
      leadOsc.frequency.setValueAtTime(1318.51, t) // E6
      leadGain.gain.setValueAtTime(0, t)
      leadGain.gain.linearRampToValueAtTime(0.08, t + 0.005)
      leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
      leadOsc.connect(leadGain)
      leadGain.connect(audioCtx.destination)
      leadOsc.start(t)
      leadOsc.stop(t + 0.12)

      // ── Primary celebration chord (A-Major: A5, C#6, E6) starting at t + 0.07 ──
      const chord = [
        { freq: 880.00, gain: 0.12, type: 'triangle' as OscillatorType, duration: 0.65 },  // A5 (warm body)
        { freq: 1108.73, gain: 0.10, type: 'sine' as OscillatorType, duration: 0.55 },     // C#6 (bright)
        { freq: 1318.51, gain: 0.09, type: 'sine' as OscillatorType, duration: 0.60 },     // E6 (air)
        { freq: 1760.00, gain: 0.04, type: 'sine' as OscillatorType, duration: 0.40 },     // A6 (overtone sparkle)
      ]

      chord.forEach((item) => {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        const startTime = t + 0.07

        osc.type = item.type
        osc.frequency.setValueAtTime(item.freq, startTime)

        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(item.gain, startTime + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + item.duration)

        osc.connect(gain)
        gain.connect(audioCtx.destination)

        osc.start(startTime)
        osc.stop(startTime + item.duration)
      })
    } catch {
      // Audio failure is non-fatal
    }
  }

  /**
   * Harmonious three-note major chord for standard sale completion (Cash / Card).
   * @param enabled  When false, skips playback (reads from pos settings).
   */
  function playSuccess(enabled = true) {
    if (!enabled) return
    try {
      const audioCtx = getAudioContext()
      if (!audioCtx) return
      const chord = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
      const t = audioCtx.currentTime

      chord.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        const startTime = t + idx * 0.065
        osc.frequency.setValueAtTime(freq, startTime)
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(0.09, startTime + 0.008)
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28)
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.start(startTime)
        osc.stop(startTime + 0.28)
      })
    } catch {}
  }

  /**
   * Low double-buzz for invalid barcode, out of stock, or payment error.
   * @param enabled  When false, skips playback (reads from pos settings).
   */
  function playError(enabled = true) {
    if (!enabled) return
    try {
      const audioCtx = getAudioContext()
      if (!audioCtx) return
      const t = audioCtx.currentTime

      // Double pulse: 0ms -> 80ms, pause, 120ms -> 200ms
      ;[0, 0.12].forEach((offset) => {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        const startTime = t + offset
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(220, startTime)
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.008)
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.08)
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.start(startTime)
        osc.stop(startTime + 0.08)
      })
    } catch {}
  }

  return { playBeep, playAbaChime, playSuccess, playError }
}
