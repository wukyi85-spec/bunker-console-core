// Web Audio synthesized sound library — no external assets.
// Every SFX is a short, tasteful, premium cue. Ambient is a slow evolving pad.
// A global mute toggle persists to localStorage.

const MUTE_KEY = "bunker.muted";

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientNodes: { stop: () => void } | null = null;
let muted = true; // start muted — user must opt in
const listeners = new Set<() => void>();

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 0.6;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function initSound() {
  if (typeof window === "undefined") return;
  try {
    const stored = window.localStorage.getItem(MUTE_KEY);
    muted = stored === null ? true : stored === "1";
  } catch {
    /* ignore */
  }
}

export function isMuted() {
  return muted;
}

export function subscribeSound(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((l) => l());
}

export function toggleMuted() {
  muted = !muted;
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (masterGain) {
    const now = ctx?.currentTime ?? 0;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.6, now + 0.15);
  }
  if (muted) stopAmbient();
  emit();
}

// ---------- primitives ----------

function envTone(opts: {
  freq: number;
  duration: number;
  type?: OscillatorType;
  peak?: number;
  attack?: number;
  release?: number;
  detune?: number;
  slideTo?: number;
  when?: number;
}) {
  const c = ensureCtx();
  if (!c || !masterGain) return;
  const {
    freq,
    duration,
    type = "sine",
    peak = 0.25,
    attack = 0.01,
    release = duration,
    detune = 0,
    slideTo,
    when = 0,
  } = opts;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  osc.detune.value = detune;
  if (typeof slideTo === "number") {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + duration);
  }
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + release);
  osc.connect(gain).connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + attack + release + 0.05);
}

function noiseBurst(opts: {
  duration: number;
  peak?: number;
  filterFreq?: number;
  when?: number;
}) {
  const c = ensureCtx();
  if (!c || !masterGain) return;
  const { duration, peak = 0.15, filterFreq = 1800, when = 0 } = opts;
  const t0 = c.currentTime + when;
  const bufferSize = Math.floor(c.sampleRate * duration);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.7;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter).connect(gain).connect(masterGain);
  src.start(t0);
  src.stop(t0 + duration + 0.05);
}

// ---------- SFX bank ----------

type SoundKey =
  | "click"
  | "hover"
  | "notification"
  | "reward"
  | "mission"
  | "rankup"
  | "orderConfirmed"
  | "terminalBoot"
  | "door"
  | "error";

const SFX: Record<SoundKey, () => void> = {
  click: () => {
    envTone({ freq: 880, duration: 0.06, type: "square", peak: 0.06, attack: 0.001, release: 0.05 });
    envTone({ freq: 1760, duration: 0.05, type: "triangle", peak: 0.04, release: 0.04, when: 0.008 });
  },
  hover: () => {
    envTone({ freq: 1600, duration: 0.05, type: "sine", peak: 0.03, release: 0.04 });
  },
  notification: () => {
    envTone({ freq: 660, duration: 0.18, type: "triangle", peak: 0.12, release: 0.15 });
    envTone({ freq: 880, duration: 0.18, type: "triangle", peak: 0.1, release: 0.15, when: 0.09 });
  },
  reward: () => {
    envTone({ freq: 523, duration: 0.15, type: "sine", peak: 0.1 });
    envTone({ freq: 659, duration: 0.15, type: "sine", peak: 0.1, when: 0.1 });
    envTone({ freq: 784, duration: 0.2, type: "sine", peak: 0.12, when: 0.2 });
    envTone({ freq: 1046, duration: 0.35, type: "triangle", peak: 0.13, when: 0.3 });
  },
  mission: () => {
    envTone({ freq: 440, duration: 0.2, type: "sawtooth", peak: 0.08, slideTo: 660 });
    envTone({ freq: 660, duration: 0.3, type: "triangle", peak: 0.1, when: 0.18 });
    noiseBurst({ duration: 0.15, peak: 0.05, filterFreq: 3200, when: 0.02 });
  },
  rankup: () => {
    envTone({ freq: 392, duration: 0.2, type: "sine", peak: 0.1 });
    envTone({ freq: 523, duration: 0.25, type: "sine", peak: 0.12, when: 0.15 });
    envTone({ freq: 659, duration: 0.3, type: "sine", peak: 0.14, when: 0.3 });
    envTone({ freq: 784, duration: 0.4, type: "triangle", peak: 0.16, when: 0.45 });
    envTone({ freq: 1046, duration: 0.7, type: "triangle", peak: 0.14, when: 0.6 });
    noiseBurst({ duration: 0.5, peak: 0.04, filterFreq: 4000, when: 0.45 });
  },
  orderConfirmed: () => {
    envTone({ freq: 523, duration: 0.14, type: "triangle", peak: 0.12 });
    envTone({ freq: 784, duration: 0.22, type: "triangle", peak: 0.14, when: 0.12 });
  },
  terminalBoot: () => {
    envTone({ freq: 120, duration: 0.6, type: "sawtooth", peak: 0.05, slideTo: 220, release: 0.6 });
    noiseBurst({ duration: 0.35, peak: 0.03, filterFreq: 900, when: 0.1 });
    envTone({ freq: 880, duration: 0.08, type: "square", peak: 0.05, when: 0.55 });
  },
  door: () => {
    envTone({ freq: 80, duration: 0.8, type: "sawtooth", peak: 0.08, slideTo: 40, release: 0.8 });
    noiseBurst({ duration: 0.6, peak: 0.06, filterFreq: 500, when: 0.05 });
    envTone({ freq: 60, duration: 0.4, type: "sine", peak: 0.05, when: 0.55 });
  },
  error: () => {
    envTone({ freq: 220, duration: 0.15, type: "square", peak: 0.1 });
    envTone({ freq: 180, duration: 0.2, type: "square", peak: 0.1, when: 0.1 });
  },
};

export function playSound(key: SoundKey) {
  if (muted) return;
  const fn = SFX[key];
  if (!fn) return;
  try {
    fn();
  } catch {
    /* ignore */
  }
}

// ---------- Ambient ----------

export function startAmbient() {
  if (muted) return;
  const c = ensureCtx();
  if (!c || !masterGain) return;
  stopAmbient();

  const bus = c.createGain();
  bus.gain.value = 0;
  bus.gain.linearRampToValueAtTime(0.18, c.currentTime + 3);
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  bus.connect(filter).connect(masterGain);

  // Slow drone
  const drone = c.createOscillator();
  drone.type = "sine";
  drone.frequency.value = 55;
  const droneG = c.createGain();
  droneG.gain.value = 0.9;
  drone.connect(droneG).connect(bus);
  drone.start();

  // Detuned pad
  const pad = c.createOscillator();
  pad.type = "sawtooth";
  pad.frequency.value = 82.4; // E2
  pad.detune.value = 4;
  const padG = c.createGain();
  padG.gain.value = 0.08;
  pad.connect(padG).connect(bus);
  pad.start();

  // LFO wobbles the filter
  const lfo = c.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.08;
  const lfoG = c.createGain();
  lfoG.gain.value = 300;
  lfo.connect(lfoG).connect(filter.frequency);
  lfo.start();

  // Occasional shimmer
  let shimmerTimer: number | null = null;
  const shimmer = () => {
    if (muted) return;
    const freqs = [523, 659, 784, 1046];
    const f = freqs[Math.floor(Math.random() * freqs.length)];
    envTone({ freq: f, duration: 1.6, type: "sine", peak: 0.03, attack: 0.6, release: 1.4 });
    shimmerTimer = window.setTimeout(shimmer, 6000 + Math.random() * 6000);
  };
  shimmerTimer = window.setTimeout(shimmer, 4000);

  ambientNodes = {
    stop: () => {
      try {
        bus.gain.cancelScheduledValues(c.currentTime);
        bus.gain.linearRampToValueAtTime(0, c.currentTime + 0.5);
        drone.stop(c.currentTime + 0.6);
        pad.stop(c.currentTime + 0.6);
        lfo.stop(c.currentTime + 0.6);
      } catch {
        /* ignore */
      }
      if (shimmerTimer) window.clearTimeout(shimmerTimer);
    },
  };
}

export function stopAmbient() {
  if (ambientNodes) {
    ambientNodes.stop();
    ambientNodes = null;
  }
}
