// BLACK'S BUNKER — Synthesized game UI sound library.
// Web Audio only; no external assets. All sounds share a single AudioContext
// and a master gain so mute/unmute is instant and low-cost.

export type BunkerSoundId =
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

type NodeCleanup = () => void;

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientCleanup: NodeCleanup | null = null;
let muted = false;
let volume = 0.55; // premium: keep everything soft

const listeners = new Set<() => void>();
const MUTE_KEY = "bunker.sound.muted";

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeSound(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isMuted(): boolean {
  return muted;
}

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : volume;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function initSound() {
  if (typeof window === "undefined") return;
  const stored = window.localStorage.getItem(MUTE_KEY);
  muted = stored === "1";
  ensureCtx();
  if (masterGain && ctx) masterGain.gain.value = muted ? 0 : volume;
  emit();
}

export function setMuted(next: boolean) {
  muted = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  }
  if (masterGain && ctx) {
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(muted ? 0 : volume, ctx.currentTime + 0.08);
  }
  if (muted) stopAmbient();
  else startAmbient();
  emit();
}

export function toggleMuted() {
  setMuted(!muted);
}

/* --------------------------- primitives --------------------------- */

function envTone(opts: {
  type?: OscillatorType;
  freq: number;
  toFreq?: number;
  duration: number;
  gain?: number;
  attack?: number;
  release?: number;
  detune?: number;
  filterFreq?: number;
}) {
  const c = ensureCtx();
  if (!c || !masterGain || muted) return;
  const {
    type = "sine",
    freq,
    toFreq,
    duration,
    gain = 0.35,
    attack = 0.005,
    release = 0.08,
    detune = 0,
    filterFreq,
  } = opts;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (toFreq) osc.frequency.exponentialRampToValueAtTime(toFreq, c.currentTime + duration);
  if (detune) osc.detune.value = detune;

  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration + release);

  let out: AudioNode = g;
  if (filterFreq) {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = filterFreq;
    g.connect(f);
    out = f;
  }
  osc.connect(g);
  out.connect(masterGain);
  osc.start();
  osc.stop(c.currentTime + duration + release + 0.05);
}

function noiseBurst(duration: number, gain = 0.25, filterFreq = 1800, hp = 400) {
  const c = ensureCtx();
  if (!c || !masterGain || muted) return;
  const bufferSize = Math.floor(c.sampleRate * duration);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = filterFreq;
  const hpF = c.createBiquadFilter();
  hpF.type = "highpass";
  hpF.frequency.value = hp;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  src.connect(hpF).connect(lp).connect(g).connect(masterGain);
  src.start();
  src.stop(c.currentTime + duration + 0.05);
}

/* ----------------------------- sfx map ---------------------------- */

function sfxClick() {
  envTone({ type: "triangle", freq: 880, toFreq: 640, duration: 0.06, gain: 0.22 });
  envTone({ type: "sine", freq: 1760, duration: 0.04, gain: 0.08 });
}

function sfxHover() {
  envTone({ type: "sine", freq: 1200, toFreq: 1600, duration: 0.05, gain: 0.05, release: 0.04 });
}

function sfxNotification() {
  envTone({ type: "sine", freq: 660, duration: 0.09, gain: 0.18 });
  setTimeout(() => envTone({ type: "sine", freq: 990, duration: 0.14, gain: 0.2 }), 90);
}

function sfxReward() {
  envTone({ type: "triangle", freq: 523, duration: 0.11, gain: 0.2 });
  setTimeout(() => envTone({ type: "triangle", freq: 784, duration: 0.11, gain: 0.2 }), 90);
  setTimeout(() => envTone({ type: "triangle", freq: 1046, duration: 0.16, gain: 0.24 }), 180);
  setTimeout(() => envTone({ type: "sine", freq: 1568, duration: 0.22, gain: 0.14 }), 260);
}

function sfxMission() {
  envTone({ type: "sawtooth", freq: 220, toFreq: 660, duration: 0.18, gain: 0.15, filterFreq: 1400 });
  setTimeout(() => envTone({ type: "triangle", freq: 880, duration: 0.2, gain: 0.22 }), 160);
  setTimeout(() => envTone({ type: "triangle", freq: 1318, duration: 0.28, gain: 0.24 }), 300);
}

function sfxRankup() {
  envTone({ type: "sawtooth", freq: 130, toFreq: 520, duration: 0.5, gain: 0.18, filterFreq: 1800 });
  setTimeout(() => envTone({ type: "triangle", freq: 659, duration: 0.16, gain: 0.22 }), 260);
  setTimeout(() => envTone({ type: "triangle", freq: 988, duration: 0.16, gain: 0.22 }), 380);
  setTimeout(() => envTone({ type: "triangle", freq: 1318, duration: 0.32, gain: 0.28 }), 500);
  setTimeout(() => noiseBurst(0.35, 0.08, 4200, 900), 200);
}

function sfxOrderConfirmed() {
  envTone({ type: "sine", freq: 587, duration: 0.1, gain: 0.18 });
  setTimeout(() => envTone({ type: "sine", freq: 880, duration: 0.14, gain: 0.2 }), 110);
  setTimeout(() => envTone({ type: "sine", freq: 1174, duration: 0.22, gain: 0.22 }), 240);
}

function sfxTerminalBoot() {
  noiseBurst(0.28, 0.06, 1800, 600);
  envTone({ type: "square", freq: 180, toFreq: 90, duration: 0.35, gain: 0.1, filterFreq: 900 });
  setTimeout(() => envTone({ type: "triangle", freq: 660, duration: 0.08, gain: 0.14 }), 240);
  setTimeout(() => envTone({ type: "triangle", freq: 990, duration: 0.12, gain: 0.16 }), 340);
}

function sfxDoor() {
  const c = ensureCtx();
  if (!c || !masterGain || muted) return;
  // low mechanical rumble
  envTone({ type: "sawtooth", freq: 60, toFreq: 40, duration: 0.9, gain: 0.16, filterFreq: 380, release: 0.2 });
  envTone({ type: "square", freq: 90, toFreq: 55, duration: 0.9, gain: 0.08, filterFreq: 260, release: 0.2 });
  noiseBurst(0.9, 0.05, 900, 120);
  setTimeout(() => envTone({ type: "triangle", freq: 220, duration: 0.18, gain: 0.15 }), 800);
}

function sfxError() {
  envTone({ type: "square", freq: 220, duration: 0.12, gain: 0.14, filterFreq: 1200 });
  setTimeout(() => envTone({ type: "square", freq: 165, duration: 0.18, gain: 0.14, filterFreq: 1000 }), 100);
}

const SFX: Record<BunkerSoundId, () => void> = {
  click: sfxClick,
  hover: sfxHover,
  notification: sfxNotification,
  reward: sfxReward,
  mission: sfxMission,
  rankup: sfxRankup,
  orderConfirmed: sfxOrderConfirmed,
  terminalBoot: sfxTerminalBoot,
  door: sfxDoor,
  error: sfxError,
};

export function playSound(id: BunkerSoundId) {
  if (muted) return;
  ensureCtx();
  try {
    SFX[id]?.();
  } catch {
    // ignore audio errors
  }
}

/* ---------------------------- ambient ----------------------------- */

export function startAmbient() {
  if (muted) return;
  const c = ensureCtx();
  if (!c || !masterGain) return;
  if (ambientCleanup) return;

  const bus = c.createGain();
  bus.gain.value = 0.0001;
  bus.gain.linearRampToValueAtTime(0.16, c.currentTime + 3.5);
  bus.connect(masterGain);

  // Warm sub drone
  const drone = c.createOscillator();
  drone.type = "sine";
  drone.frequency.value = 55;
  const droneGain = c.createGain();
  droneGain.gain.value = 0.55;
  drone.connect(droneGain).connect(bus);
  drone.start();

  // Detuned pad
  const pad = c.createOscillator();
  pad.type = "triangle";
  pad.frequency.value = 110;
  pad.detune.value = -8;
  const padGain = c.createGain();
  padGain.gain.value = 0.18;
  const padLP = c.createBiquadFilter();
  padLP.type = "lowpass";
  padLP.frequency.value = 700;
  pad.connect(padGain).connect(padLP).connect(bus);
  pad.start();

  // Slow LFO on pad filter for breathing
  const lfo = c.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.06;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 220;
  lfo.connect(lfoGain).connect(padLP.frequency);
  lfo.start();

  // Occasional shimmer chime
  let shimmerTimer: ReturnType<typeof setTimeout> | null = null;
  const scheduleShimmer = () => {
    const delay = 9000 + Math.random() * 12000;
    shimmerTimer = setTimeout(() => {
      if (!muted) {
        const notes = [880, 1046, 1318, 1568];
        const n = notes[Math.floor(Math.random() * notes.length)];
        envTone({ type: "sine", freq: n, duration: 0.6, gain: 0.05, release: 0.6 });
      }
      scheduleShimmer();
    }, delay);
  };
  scheduleShimmer();

  ambientCleanup = () => {
    try {
      bus.gain.cancelScheduledValues(c.currentTime);
      bus.gain.linearRampToValueAtTime(0.0001, c.currentTime + 0.4);
      setTimeout(() => {
        drone.stop();
        pad.stop();
        lfo.stop();
      }, 500);
    } catch {
      /* ignore */
    }
    if (shimmerTimer) clearTimeout(shimmerTimer);
    ambientCleanup = null;
  };
}

export function stopAmbient() {
  ambientCleanup?.();
}
