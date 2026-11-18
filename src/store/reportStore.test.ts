import type { RoundResult } from "@/lib/reports";
import { MAX_SAVED_ROUNDS, useReportStore } from "./reportStore";

const result = (id: string, startedAt: number) =>
  ({ id, startedAt, sectionId: "s", players: [], words: [] }) as unknown as RoundResult;

beforeEach(() => {
  localStorage.clear();
  useReportStore.setState({ results: [] });
});

describe("report store", () => {
  it("upserts by id and keeps rounds in time order", () => {
    const s = useReportStore.getState();
    s.record(result("b", 2));
    s.record(result("a", 1));
    s.record({ ...result("b", 2), title: "updated" } as RoundResult);
    expect(useReportStore.getState().results.map((r) => r.id)).toEqual(["a", "b"]);
    expect(useReportStore.getState().results[1].title).toBe("updated");
  });

  it("caps the number of saved rounds", () => {
    useReportStore
      .getState()
      .addMany(Array.from({ length: MAX_SAVED_ROUNDS + 5 }, (_, i) => result(`r${i}`, i)));
    const ids = useReportStore.getState().results.map((r) => r.id);
    expect(ids).toHaveLength(MAX_SAVED_ROUNDS);
    expect(ids[0]).toBe("r5");
  });

  it("clears sample history for one section only", () => {
    useReportStore
      .getState()
      .addMany([
        { ...result("x", 1), sample: true },
        { ...result("y", 2), sample: true, sectionId: "other" },
        result("z", 3),
      ]);
    useReportStore.getState().clearSamples("s");
    expect(useReportStore.getState().results.map((r) => r.id)).toEqual(["y", "z"]);
  });
});
