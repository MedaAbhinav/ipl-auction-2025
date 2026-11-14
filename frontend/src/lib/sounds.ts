/**
 * Professional Web Audio API sound engine.
 * All sounds synthesized — zero external files needed.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let _enabled = true;
let _volume  = 0.65;

function ac(): AudioContext {
  if (!ctx) {
    ctx    = new (window.AudioContext || (window as any).webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = _volume;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function gain(val: number): GainNode {
  const g = ac().createGain();
  g.gain.value = val;
  g.connect(master!);
  return g;
}

function osc(freq: number, type: OscillatorType, startAt: number, duration: number, g: GainNode, fadeStart?: number) {
  const o = ac().createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, startAt);
  o.connect(g);
  const fs = fadeStart ?? startAt;
  g.gain.setValueAtTime(_volume * g.gain.value, fs);
  g.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  o.start(startAt);
  o.stop(startAt + duration + 0.01);
}

function reverb(seconds = 1.2): ConvolverNode {
  const c = ac();
  const len = c.sampleRate * seconds;
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
  }
  const conv = c.createConvolver();
  conv.buffer = buf;
  conv.connect(master!);
  return conv;
}

export function setVolume(v: number)  { _volume = Math.max(0, Math.min(1, v)); if (master) master.gain.value = _volume; }
export function setSoundEnabled(v: boolean) { _enabled = v; }

export const Sounds = {

  /** Sharp ascending bid beep with harmonics */
  bid() {
    if (!_enabled) return;
    try {
      const c = ac();
      const t = c.currentTime;
      [880, 1320, 1760].forEach((f, i) => {
        const g = gain(0.18 - i * 0.04);
        osc(f, 'square', t + i * 0.015, 0.14, g);
      });
      // click transient
      const g2 = gain(0.3);
      osc(200, 'sawtooth', t, 0.04, g2);
    } catch (_) {}
  },

  /** Triumphant 4-note fanfare chord */
  sold() {
    if (!_enabled) return;
    try {
      const c = ac();
      const t = c.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
      notes.forEach((f, i) => {
        const g = gain(0.28);
        osc(f, 'triangle', t + i * 0.09, 0.6 - i * 0.05, g);
      });
      // bass thud
      const gb = gain(0.4);
      osc(130.81, 'sine', t, 0.5, gb);
    } catch (_) {}
  },

  /** Sad descending trombone */
  unsold() {
    if (!_enabled) return;
    try {
      const c = ac();
      const t = c.currentTime;
      const g = gain(0.35);
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(400, t);
      o.frequency.exponentialRampToValueAtTime(180, t + 0.8);
      o.connect(g);
      g.gain.setValueAtTime(0.35, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.start(t); o.stop(t + 1);
      // reverb tail
      const rv = reverb(0.8);
      const g2 = gain(0.12);
      const o2 = c.createOscillator();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(300, t + 0.1);
      o2.frequency.exponentialRampToValueAtTime(140, t + 0.9);
      o2.connect(g2);
      o2.connect(rv);
      g2.gain.setValueAtTime(0.12, t + 0.1);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 1);
      o2.start(t + 0.1); o2.stop(t + 1.1);
    } catch (_) {}
  },

  /** Epic golden multi-layer record fanfare */
  record() {
    if (!_enabled) return;
    try {
      const c = ac();
      const t = c.currentTime;
      const melody = [523, 659, 784, 1047, 1319, 1047, 1319, 1568];
      melody.forEach((f, i) => {
        const g = gain(0.3);
        osc(f, 'triangle', t + i * 0.11, 0.55, g);
        // harmony
        const g2 = gain(0.12);
        osc(f * 1.26, 'sine', t + i * 0.11 + 0.03, 0.5, g2);
      });
      // deep bass hit
      [65.4, 130.8].forEach(f => {
        const gb = gain(0.45);
        osc(f, 'sine', t, 0.7, gb);
      });
      // reverb shimmer
      const rv = reverb(2);
      const gRv = c.createGain();
      gRv.gain.value = 0.18;
      gRv.connect(rv);
      const oRv = c.createOscillator();
      oRv.type = 'triangle';
      oRv.frequency.value = 1047;
      oRv.connect(gRv);
      gRv.gain.setValueAtTime(0.18, t + 0.6);
      gRv.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
      oRv.start(t + 0.6); oRv.stop(t + 2.6);
    } catch (_) {}
  },

  /** Dramatic spotlight-on sweep */
  reveal() {
    if (!_enabled) return;
    try {
      const c = ac();
      const t = c.currentTime;
      // Rising filtered noise burst
      const bufLen = c.sampleRate * 0.4;
      const buf = c.createBuffer(1, bufLen, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buf;
      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, t);
      filter.frequency.exponentialRampToValueAtTime(3200, t + 0.4);
      filter.Q.value = 2;
      const gN = c.createGain();
      gN.gain.setValueAtTime(0.0001, t);
      gN.gain.exponentialRampToValueAtTime(0.4, t + 0.15);
      gN.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      src.connect(filter); filter.connect(gN); gN.connect(master!);
      src.start(t); src.stop(t + 0.4);
      // Rising tone
      const g2 = gain(0.0001);
      const o2 = c.createOscillator();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(200, t);
      o2.frequency.exponentialRampToValueAtTime(880, t + 0.5);
      o2.connect(g2);
      g2.gain.exponentialRampToValueAtTime(0.3, t + 0.2);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o2.start(t); o2.stop(t + 0.6);
    } catch (_) {}
  },

  /** Deep punchy scoreboard tick */
  countdown() {
    if (!_enabled) return;
    try {
      const c = ac();
      const t = c.currentTime;
      const g = gain(0.5);
      osc(80, 'sine', t, 0.06, g);
      const g2 = gain(0.35);
      osc(160, 'square', t, 0.04, g2);
    } catch (_) {}
  },

  /** Urgent pulsing alarm */
  timerWarning() {
    if (!_enabled) return;
    try {
      const c = ac();
      const t = c.currentTime;
      [0, 0.12].forEach(offset => {
        const g = gain(0.4);
        osc(880, 'square', t + offset, 0.08, g);
      });
    } catch (_) {}
  },

  /** Full 8-note victory melody */
  champion() {
    if (!_enabled) return;
    try {
      const c = ac();
      const t = c.currentTime;
      const melody = [523, 523, 784, 523, 1047, 988, 523, 523, 784, 523, 1175, 1047];
      melody.forEach((f, i) => {
        const g = gain(0.26);
        osc(f, 'triangle', t + i * 0.16, 0.22, g);
        const g2 = gain(0.1);
        osc(f / 2, 'sine', t + i * 0.16, 0.22, g2);
      });
      const rv = reverb(2.5);
      const gRv = c.createGain();
      gRv.gain.value = 0.2;
      gRv.connect(rv);
      const oRv = c.createOscillator();
      oRv.type = 'triangle';
      oRv.frequency.value = 1047;
      oRv.connect(gRv);
      gRv.gain.setValueAtTime(0.2, t + melody.length * 0.16);
      gRv.gain.exponentialRampToValueAtTime(0.0001, t + melody.length * 0.16 + 3);
      oRv.start(t + melody.length * 0.16);
      oRv.stop(t + melody.length * 0.16 + 3.1);
    } catch (_) {}
  },

  /** Friendly pop notification */
  join() {
    if (!_enabled) return;
    try {
      const c = ac();
      const t = c.currentTime;
      [600, 900].forEach((f, i) => {
        const g = gain(0.22);
        osc(f, 'sine', t + i * 0.1, 0.18, g);
      });
    } catch (_) {}
  },

  /** Hammer swing whoosh */
  hammer() {
    if (!_enabled) return;
    try {
      const c = ac();
      const t = c.currentTime;
      const bufLen = c.sampleRate * 0.3;
      const buf = c.createBuffer(1, bufLen, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 1.5);
      const src = c.createBufferSource();
      src.buffer = buf;
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, t);
      filter.frequency.exponentialRampToValueAtTime(100, t + 0.3);
      const gN = c.createGain();
      gN.gain.setValueAtTime(0.6, t);
      gN.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      src.connect(filter); filter.connect(gN); gN.connect(master!);
      src.start(t); src.stop(t + 0.35);
      // impact thud
      const gt = gain(0.5);
      osc(55, 'sine', t + 0.05, 0.25, gt);
    } catch (_) {}
  }
};
