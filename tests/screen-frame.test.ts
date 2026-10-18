import { describe, expect, it } from "vitest";
import { fitScale, fitScreen } from "@/components/screens/screen-frame";

describe("screen frame sizing", () => {
  it("keeps the reference phone size unchanged", () => {
    expect(fitScreen("390x844")).toEqual({ scaleX: 1, scaleY: 1 });
  });

  it("fills a portrait phone viewport with no letterboxing", () => {
    const result = fitScreen("360x800");
    expect(390 * result.scaleX).toBeCloseTo(360);
    expect(844 * result.scaleY).toBeCloseTo(800);
  });

  it("uses the visual viewport dimensions when offsets are included", () => {
    const result = fitScreen("393x759x0x47");
    expect(390 * result.scaleX).toBeCloseTo(393);
    expect(844 * result.scaleY).toBeCloseTo(759);
  });

  it("keeps a uniform capped scale on larger screens", () => {
    const result = fitScreen("1440x1200");
    expect(result.scaleX).toBe(1.35);
    expect(result.scaleY).toBe(1.35);
    expect(fitScale("1440x1200")).toBe(1.35);
  });
});
