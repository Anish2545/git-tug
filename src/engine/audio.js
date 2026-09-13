/**
 * Procedural Web Audio API sound effects for GitTug
 * Zero external audio files, ultra-responsive, works offline!
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem("gittug_muted") === "true";
    this.masterGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : 0.7;
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem("gittug_muted", this.muted.toString());
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.muted ? 0 : 0.7,
        this.ctx.currentTime
      );
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  /**
   * Countdown tone: low pitch for 3, 2, 1; high sharp tone for GO!
   */
  countdownBeep(isGo = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = isGo ? "sawtooth" : "sine";
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
    if (isGo) {
      osc.frequency.exponentialRampToValueAtTime(1174, now + 0.3); // High D6
    }

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.45 : 0.2));

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + (isGo ? 0.5 : 0.25));
  }

  /**
   * High-pitch referee whistle with realistic tremolo
   */
  whistle() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.linearRampToValueAtTime(2450, now + 0.15);

    // LFO for whistle flutter
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(32, now);
    lfoGain.gain.setValueAtTime(220, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(this.masterGain);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.55);
    osc.stop(now + 0.55);
  }

  /**
   * Tension rope creak (straining fibers)
   */
  ropeCreak() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(450 + Math.random() * 200, now);
    filter.Q.setValueAtTime(5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.2);
  }

  /**
   * Massive tug surge: heavy bass impact + whoosh
   */
  tugSurge(strength = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(120 + strength * 40, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

    gain.gain.setValueAtTime(0.35 * Math.min(1.2, strength), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.4);

    // Complement with slight rope creak
    this.ropeCreak();
  }

  /**
   * Rapid button mash click sound
   */
  mashClick(pitch = 500) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(pitch + (Math.random() * 60 - 30), now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Crowd roar / cheer burst
   */
  crowdCheer() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.9;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1400, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.9);
  }

  /**
   * Triumphant 8-bit arcade victory fanfare
   */
  victoryFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, t: 0 },    // C5
      { f: 659.25, t: 0.12 }, // E5
      { f: 783.99, t: 0.24 }, // G5
      { f: 1046.5, t: 0.38 }, // C6
      { f: 1318.5, t: 0.58 }  // E6 sustain
    ];

    const baseNow = this.ctx.currentTime;
    notes.forEach((n) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = baseNow + n.t;

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(n.f, noteTime);

      const duration = n.t === 0.58 ? 0.7 : 0.18;
      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + duration + 0.05);
    });

    // Follow up with crowd cheer
    setTimeout(() => this.crowdCheer(), 400);
  }
}

export const sounds = new SoundManager();
