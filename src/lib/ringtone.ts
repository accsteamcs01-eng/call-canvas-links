export const PRESET_RINGTONES = [
  { value: "classic", label: "Clássico Telegram" },
  { value: "soft", label: "Suave" },
  { value: "modern", label: "Moderno" },
  { value: "buzz", label: "Vibração" },
] as const;

export type PresetRingtone = (typeof PRESET_RINGTONES)[number]["value"];

type Note = { f: number; t: number; d: number; type?: OscillatorType; g?: number };

// One loop of each preset, synthesized live (no audio files needed). period = loop length in seconds.
const PATTERNS: Record<PresetRingtone, { period: number; notes: Note[] }> = {
  classic: {
    period: 3,
    notes: [
      { f: 784, t: 0, d: 0.16 }, { f: 988, t: 0.18, d: 0.16 }, { f: 1175, t: 0.36, d: 0.22 },
      { f: 784, t: 0.75, d: 0.16 }, { f: 988, t: 0.93, d: 0.16 }, { f: 1175, t: 1.11, d: 0.22 },
    ],
  },
  soft: {
    period: 3.2,
    notes: [
      { f: 523, t: 0, d: 0.5, g: 0.22 }, { f: 659, t: 0.35, d: 0.5, g: 0.22 },
      { f: 784, t: 0.7, d: 0.7, g: 0.22 }, { f: 659, t: 1.3, d: 0.6, g: 0.18 },
    ],
  },
  modern: {
    period: 2.4,
    notes: [
      { f: 880, t: 0, d: 0.09, type: "square", g: 0.08 }, { f: 1320, t: 0.12, d: 0.09, type: "square", g: 0.08 },
      { f: 880, t: 0.24, d: 0.09, type: "square", g: 0.08 }, { f: 1760, t: 0.36, d: 0.14, type: "square", g: 0.08 },
      { f: 880, t: 0.8, d: 0.09, type: "square", g: 0.08 }, { f: 1320, t: 0.92, d: 0.09, type: "square", g: 0.08 },
    ],
  },
  buzz: {
    period: 2,
    notes: [
      { f: 140, t: 0, d: 0.4, type: "sawtooth", g: 0.12 },
      { f: 140, t: 0.55, d: 0.4, type: "sawtooth", g: 0.12 },
    ],
  },
};

const VIBRATE_PATTERN = [600, 400, 600, 1400];

/** Plays a preset (WebAudio) or a custom URL in loop, with optional vibration. */
export class Ringer {
  private ctx: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private vibTimer: ReturnType<typeof setInterval> | null = null;
  private audio: HTMLAudioElement | null = null;
  private playing = false;

  constructor(
    private kind: "preset" | "custom",
    private value: string,
    private vibrate = false,
  ) {
    if (kind === "custom" && typeof Audio !== "undefined") {
      this.audio = new Audio(value);
      this.audio.loop = true;
      this.audio.preload = "auto";
    }
  }

  /** Returns true if audio is actually playing (false if blocked by autoplay policy). */
  async start(): Promise<boolean> {
    if (this.vibrate) this.startVibration();
    if (this.playing) return true;
    try {
      if (this.audio) {
        await this.audio.play();
        this.playing = true;
        return true;
      }
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) this.ctx = new Ctx();
      if (this.ctx.state !== "running") await Promise.race([this.ctx.resume(), new Promise((r) => setTimeout(r, 300))]);
      if (this.ctx.state !== "running") return false;
      const pattern = PATTERNS[(this.value as PresetRingtone)] ?? PATTERNS.classic;
      const loop = () => this.playOnce(pattern.notes);
      loop();
      this.timer = setInterval(loop, pattern.period * 1000);
      this.playing = true;
      return true;
    } catch {
      return false;
    }
  }

  private playOnce(notes: Note[]) {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime + 0.02;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type ?? "sine";
      osc.frequency.value = n.f;
      const g = n.g ?? 0.25;
      gain.gain.setValueAtTime(0, now + n.t);
      gain.gain.linearRampToValueAtTime(g, now + n.t + 0.015);
      gain.gain.setValueAtTime(g, now + n.t + n.d * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.05);
    }
  }

  private startVibration() {
    if (this.vibTimer || typeof navigator === "undefined" || !("vibrate" in navigator)) return;
    const total = VIBRATE_PATTERN.reduce((a, b) => a + b, 0);
    const v = () => {
      try { navigator.vibrate(VIBRATE_PATTERN); } catch { /* ignore */ }
    };
    v();
    this.vibTimer = setInterval(v, total);
  }

  stop() {
    this.playing = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.vibTimer) clearInterval(this.vibTimer);
    this.vibTimer = null;
    try { navigator.vibrate?.(0); } catch { /* ignore */ }
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
