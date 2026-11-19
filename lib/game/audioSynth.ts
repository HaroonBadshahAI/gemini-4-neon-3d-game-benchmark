import type { CombatEvent } from './combatEngine';

class CombatAudioSynth {
  private ctx: AudioContext | null = null;
  private muted = false;
  private noiseBuffer: AudioBuffer | null = null;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.buildNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private buildNoiseBuffer(): void {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * 0.5);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  public playUiClick(pitch = 620): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.45, now + 0.055);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  public playEvent(ev: CombatEvent): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx) return;

    const jitter = 0.92 + Math.random() * 0.16;

    switch (ev.type) {
      case 'swing':
        this.playWhoosh(420 * jitter, 0.09, 0.07);
        break;
      case 'dash':
        this.playWhoosh(280 * jitter, 0.12, 0.08);
        break;
      case 'jump':
        this.playTone(170 * jitter, 340 * jitter, 0.11, 'sine', 0.08);
        break;
      case 'land':
        this.playImpact(85 * jitter, 0.09, 0.1, false);
        break;
      case 'hit':
        this.playImpact(170 * jitter, 0.13, 0.22, false);
        break;
      case 'heavy_hit':
        this.playImpact(115 * jitter, 0.22, 0.34, true);
        break;
      case 'block':
        this.playBlockClack(740 * jitter);
        break;
      case 'special':
        this.playSpecialSurge();
        break;
      case 'round_start':
        this.playTaikoGong(110, 0.85, 0.28);
        break;
      case 'fight_call':
        this.playTaikoGong(185, 0.45, 0.24);
        this.playTone(520, 780, 0.16, 'sawtooth', 0.08);
        break;
      case 'ko':
        this.playImpact(68, 0.42, 0.42, true);
        this.playTaikoGong(72, 1.2, 0.32);
        break;
      case 'victory':
        this.playVictoryChord();
        break;
    }
  }

  private playTone(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(25, endFreq), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  private playWhoosh(centerFreq: number, duration: number, volume: number): void {
    if (!this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(centerFreq * 1.4, now);
    filter.frequency.exponentialRampToValueAtTime(centerFreq * 0.45, now + duration);
    filter.Q.value = 2.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  private playImpact(
    baseFreq: number,
    duration: number,
    volume: number,
    heavy: boolean,
  ): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Low punch thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = heavy ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(baseFreq * 1.8, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + duration);
    oscGain.gain.setValueAtTime(volume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);

    // Crisp transient slap
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(heavy ? 1800 : 1200, now);
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(volume * 0.85, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.6);
      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + duration * 0.65);
    }
  }

  private playBlockClack(freq: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.55, now + 0.065);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  private playSpecialSurge(): void {
    if (!this.ctx) return;
    this.playTone(180, 960, 0.26, 'sawtooth', 0.16);
    this.playTone(360, 1480, 0.22, 'triangle', 0.11);
    this.playWhoosh(950, 0.25, 0.16);
  }

  private playTaikoGong(freq: number, duration: number, volume: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc1.frequency.exponentialRampToValueAtTime(freq * 0.68, now + duration);
    osc2.frequency.setValueAtTime(freq * 1.49, now);
    osc2.frequency.exponentialRampToValueAtTime(freq * 1.12, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.02);
    osc2.stop(now + duration + 0.02);
  }

  private playVictoryChord(): void {
    const notes = [293.66, 369.99, 440, 587.33]; // D major martial fanfare
    notes.forEach((n, idx) => {
      setTimeout(() => {
        this.playTone(n, n * 1.005, 0.45, 'triangle', 0.12);
      }, idx * 75);
    });
  }
}

export const audioSynth = new CombatAudioSynth();
