import { afterEach, describe, expect, it, vi } from "vitest";
import { formatCoordinates, getLocalTimeContext } from "../src/worker";

describe("formatCoordinates", () => {
  it("preserves precise coordinates", () => {
    expect(formatCoordinates("41.01384", "28.94966")).toBe("41.01384, 28.94966");
  });

  it("rejects missing or invalid coordinates", () => {
    expect(formatCoordinates(undefined, "28.94966")).toBeNull();
    expect(formatCoordinates("north", "east")).toBeNull();
  });
});

describe("getLocalTimeContext", () => {
  afterEach(() => vi.useRealTimers());

  it("uses the visitor timezone and a 15-minute cache bucket", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T10:18:00.000Z"));

    expect(getLocalTimeContext("Europe/Istanbul")).toMatchObject({
      localTime: "13:18",
      timeBucket: "13:15",
      month: "September",
      period: "bright afternoon daylight",
    });
  });
});
