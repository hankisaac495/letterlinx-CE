/**
 * Synthesised sound effects (Web Audio API, no audio files).
 * Tone: clean and satisfying — wooden tocks, bell-like chimes, a soft thud.
 */

export type SoundName = "tock" | "found" | "allFound" | "miss" | "tick" | "roundEnd";

export interface PlayOptions {
  /** For "tock": position in the selection (pitch rises slightly with each tile). */
  step?: number;
}

type Ctx = BaseAudioContext;

/** Note frequency from a semitone offset relative to A4 (440 Hz). */
export const note = (semitonesFromA4: number) => 440 * 2 ** (semitonesFromA4 / 12);

const N = { G4: -2, B4: 2, C5: 3, D5: 5, E5: 7, G5: 10, A5: 12, B5: 14, C6: 15, E6: 19 };

function envelope(
  ctx: Ctx,
  out: AudioNode,
  at: number,
  peak: number,
  attack: number,
  decay: number,
) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  g.connect(out);
  return g;
}

function tone(
  ctx: Ctx,
  out: AudioNode,
  {
    freq,
    at,
    peak,
    attack = 0.005,
    decay,
    type = "sine" as OscillatorType,
    glideTo,
  }: {
    freq: number;
    at: number;
    peak: number;
    attack?: number;
    decay: number;
    type?: OscillatorType;
    glideTo?: number;
  },
) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, at + attack + decay);
  osc.connect(envelope(ctx, out, at, peak, attack, decay));
  osc.start(at);
  osc.stop(at + attack + decay + 0.05);
  return osc;
}

/** A bell-ish note: fundamental plus a quiet octave partial. */
function bell(ctx: Ctx, out: AudioNode, freq: number, at: number, peak: number, decay: number) {
  tone(ctx, out, { freq, at, peak, decay, attack: 0.004 });
  tone(ctx, out, { freq: freq * 2, at, peak: peak * 0.25, decay: decay * 0.6, attack: 0.004 });
}

/** Schedules a sound on `out` starting at the context's current time. */
export function schedule(ctx: Ctx, out: AudioNode, name: SoundName, opts: PlayOptions = {}) {
  const t = ctx.currentTime + 0.005;
  switch (name) {
    case "tock": {
      // Short wooden knock: a sine that drops in pitch fast, through a band-pass.
      const step = Math.min(opts.step ?? 0, 12);
      const base = 520 * 2 ** (step / 24);
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = base * 1.5;
      filter.Q.value = 1.2;
      filter.connect(out);
      tone(ctx, filter, {
        freq: base * 1.6,
        glideTo: base,
        at: t,
        peak: 0.5,
        attack: 0.002,
        decay: 0.07,
        type: "triangle",
      });
      return;
    }
    case "found":
      [N.E5, N.G5, N.B5].forEach((n, i) => bell(ctx, out, note(n), t + i * 0.075, 0.16, 0.55));
      return;
    case "allFound":
      [N.C5, N.E5, N.G5, N.C6, N.E6].forEach((n, i) =>
        bell(ctx, out, note(n), t + i * 0.085, 0.16, 0.9 + i * 0.1),
      );
      return;
    case "miss": {
      // Low, muted thud — never harsh.
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 400;
      lp.connect(out);
      tone(ctx, lp, { freq: 130, glideTo: 70, at: t, peak: 0.45, attack: 0.004, decay: 0.16 });
      return;
    }
    case "tick":
      tone(ctx, out, {
        freq: 1600,
        at: t,
        peak: 0.05,
        attack: 0.001,
        decay: 0.025,
        type: "square",
      });
      return;
    case "roundEnd": {
      // Warm, short flourish: a rising arpeggio landing on a soft chord.
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 2400;
      lp.connect(out);
      [N.G4, N.B4, N.D5].forEach((n, i) =>
        tone(ctx, lp, {
          freq: note(n),
          at: t + i * 0.09,
          peak: 0.12,
          decay: 0.3,
          type: "triangle",
        }),
      );
      [N.G4, N.D5, N.G5, N.B5].forEach((n) =>
        tone(ctx, lp, {
          freq: note(n),
          at: t + 0.3,
          peak: 0.08,
          attack: 0.03,
          decay: 1.1,
          type: "triangle",
        }),
      );
      return;
    }
  }
}

/** Owns the AudioContext, master volume and mute. Safe to call on the server (no-ops). */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private volume = 0.8;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!this.ctx) {
      this.ctx = new AC();
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.connect(this.ctx.destination);
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(compressor);
    }
    return this.ctx;
  }

  /** Call from a user gesture so later sounds (e.g. timer ticks) are allowed to play. */
  unlock() {
    const ctx = this.ensure();
    if (ctx?.state === "suspended") void ctx.resume();
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.volume;
  }

  play(name: SoundName, opts?: PlayOptions) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    if (ctx.state === "suspended") void ctx.resume();
    schedule(ctx, this.master, name, opts);
  }
}

export const sfx = new SoundEngine();
