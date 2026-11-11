import { describe, expect, it } from "vitest";
import { answerRate, periodStart, summarize } from "./metrics";

const ev = (event: string, d: number | null = null) => ({ call_id: "a", event, duration_seconds: d, created_at: "2026-01-01T10:00:00Z" });

describe("admin metrics", () => {
  it("answer rate is answered / opened as a rounded percent", () => {
    expect(answerRate(3, 1)).toBe(33);
    expect(answerRate(0, 0)).toBe(0);
  });
  it("average duration only counts ended events", () => {
    const s = summarize([ev("opened"), ev("opened"), ev("answered"), ev("ended", 60), ev("ended", 120), ev("declined")]);
    expect(s).toMatchObject({ opened: 2, answered: 1, declined: 1, avgDuration: 90, rate: 50 });
  });
  it("7 days period starts 6 days before today at midnight", () => {
    const s = periodStart("7d", new Date(2026, 0, 10, 15))!;
    expect(s.getDate()).toBe(4);
    expect(s.getHours()).toBe(0);
    expect(periodStart("all")).toBeNull();
  });
});
