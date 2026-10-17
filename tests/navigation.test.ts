import { describe, expect, it } from "vitest";
import { ArrivalDetector, distanceMeters, usableSample } from "@/lib/navigation/engine";
import realSpots from "@/data/real-spots.json";
import { isDestinationCandidate } from "@/features/adventure/validation";
describe("navigation", () => {
  const point = { lat: 35, lng: 135 };
  const sample = (timestamp: number) => ({ ...point, accuracy: 10, timestamp });
  it("requires sustained fresh accurate samples and resets outside arrival radius", () => {
    const detector = new ArrivalDetector();
    expect(detector.update(sample(1000), point, 1000)).toBe(false);
    expect(detector.update(sample(6000), point, 6000)).toBe(true);
    expect(detector.update({ ...sample(7000), lat: 36 }, point, 7000)).toBe(false);
    expect(detector.update(sample(8000), point, 8000)).toBe(false);
    expect(detector.update({ ...sample(13000), accuracy: 100 }, point, 13000)).toBe(false);
    expect(detector.update(sample(14000), point, 14000)).toBe(false);
  });
  it("rejects stale fixes and excessive sample gaps", () => {
    expect(usableSample(sample(1000), 17000)).toBe(false);
    const detector = new ArrivalDetector();
    detector.update(sample(1000), point, 1000);
    expect(detector.update(sample(20000), point, 20000)).toBe(false);
    expect(distanceMeters(point, point)).toBe(0);
  });
  it("keeps curated destinations valid and separate from demo data", () => {
    expect(realSpots.every(isDestinationCandidate)).toBe(true);
    expect(realSpots.every(s => s.source === "curated" && !s.accessVerified)).toBe(true);
  });
});
