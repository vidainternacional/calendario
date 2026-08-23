'use client'

type FeedbackKind = 'tap' | 'success' | 'warning' | 'listen-start' | 'listen-end'

function vibrate(pattern: number | number[]) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try { navigator.vibrate(pattern) } catch { /* unsupported or blocked */ }
}

function tone(frequency: number, duration = 70, gainValue = 0.025) {
  if (typeof window === 'undefined') return
  const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) return
  try {
    const context = new AudioContextCtor()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.value = gainValue
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + duration / 1000)
    oscillator.onended = () => { void context.close() }
  } catch { /* audio feedback is optional */ }
}

export function interactionFeedback(kind: FeedbackKind) {
  if (kind === 'tap') { vibrate(8); return }
  if (kind === 'success') { vibrate([10, 30, 16]); tone(740, 85, 0.02); return }
  if (kind === 'warning') { vibrate([18, 28, 18]); tone(330, 100, 0.018); return }
  if (kind === 'listen-start') { vibrate(10); tone(620, 55, 0.015); return }
  if (kind === 'listen-end') { vibrate(8); tone(480, 45, 0.012) }
}
