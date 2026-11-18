import { note, schedule, type SoundName } from "./sfx";

/** Minimal fake AudioContext that records oscillators. */
function fakeContext() {
  const oscillators: { type: string; freq: number; start: number; stop: number }[] = [];
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ connect() {} });
  const ctx = {
    currentTime: 10,
    createGain: () => ({ ...node(), gain: param() }),
    createBiquadFilter: () => ({ ...node(), type: "", frequency: param(), Q: param() }),
    createOscillator: () => {
      const o = {
        ...node(),
        type: "sine",
        frequency: {
          ...param(),
          setValueAtTime(v: number) {
            rec.freq = v;
          },
        },
        start(t: number) {
          rec.start = t;
        },
        stop(t: number) {
          rec.stop = t;
        },
      };
      const rec = { type: "", freq: 0, start: 0, stop: 0 };
      oscillators.push(rec);
      return new Proxy(o, {
        set(target, key, value) {
          if (key === "type") rec.type = value;
          (target as Record<string | symbol, unknown>)[key] = value;
          return true;
        },
      });
    },
  };
  return { ctx: ctx as unknown as BaseAudioContext, oscillators };
}

describe("sound effects", () => {
  it("computes note frequencies", () => {
    expect(note(0)).toBe(440);
    expect(note(12)).toBe(880);
  });

  it.each<SoundName>(["tock", "found", "allFound", "miss", "tick", "roundEnd"])(
    "%s schedules short sounds",
    (name) => {
      const { ctx, oscillators } = fakeContext();
      schedule(ctx, { connect() {} } as unknown as AudioNode, name);
      expect(oscillators.length).toBeGreaterThan(0);
      for (const o of oscillators) {
        expect(o.start).toBeGreaterThanOrEqual(10);
        expect(o.stop - o.start).toBeLessThan(1.6); // keep effects brief
      }
    },
  );

  it("tock rises in pitch with each tile", () => {
    const freqs = [0, 4, 8].map((step) => {
      const { ctx, oscillators } = fakeContext();
      schedule(ctx, { connect() {} } as unknown as AudioNode, "tock", { step });
      return oscillators[0].freq;
    });
    expect(freqs[0]).toBeLessThan(freqs[1]);
    expect(freqs[1]).toBeLessThan(freqs[2]);
  });

  it("all-found is a bigger version of the found chime", () => {
    const count = (name: SoundName) => {
      const { ctx, oscillators } = fakeContext();
      schedule(ctx, { connect() {} } as unknown as AudioNode, name);
      return oscillators.length;
    };
    expect(count("allFound")).toBeGreaterThan(count("found"));
  });

  it("miss is low-pitched", () => {
    const { ctx, oscillators } = fakeContext();
    schedule(ctx, { connect() {} } as unknown as AudioNode, "miss");
    expect(oscillators[0].freq).toBeLessThan(200);
  });
});
