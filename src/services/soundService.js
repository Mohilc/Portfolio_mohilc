/**
 * Zero-dependency Web Audio API 8-bit chiptune sound effects engine.
 */
class SoundService {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastStepAt = 0;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
  }

  ensureContext() {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playTone(freq, duration = 0.08, type = 'square', gainPeak = 0.045, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  playStep() {
    const now = performance.now();
    if (now - this.lastStepAt < 230) return;
    this.lastStepAt = now;
    this.playTone(140 + Math.random() * 25, 0.04, 'triangle', 0.025);
  }

  playRoomEnter() {
    this.playTone(392, 0.07, 'square', 0.03, 0);
    this.playTone(523.25, 0.09, 'square', 0.03, 0.06);
  }

  playOpenDrawer() {
    this.playTone(440, 0.06, 'square', 0.035, 0);
    this.playTone(659.25, 0.08, 'square', 0.035, 0.05);
    this.playTone(880, 0.1, 'square', 0.03, 0.1);
  }

  playClose() {
    this.playTone(523.25, 0.06, 'square', 0.03, 0);
    this.playTone(349.23, 0.08, 'square', 0.03, 0.05);
  }

  playCollect() {
    this.playTone(660, 0.05, 'square', 0.04, 0);
    this.playTone(990, 0.09, 'square', 0.04, 0.05);
  }

  playHit() {
    this.playTone(180, 0.12, 'sawtooth', 0.045, 0);
    this.playTone(110, 0.15, 'sawtooth', 0.04, 0.08);
  }
}

export const soundService = new SoundService();
