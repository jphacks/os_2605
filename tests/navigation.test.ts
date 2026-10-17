import { describe, expect, it, vi } from "vitest";
import { ArrivalDetector, NavigationEngine, detectArrival, distanceMeters, usableArrivalSample, usableSample } from "@/lib/navigation/engine";
import { normalizeGeolocationTimestamp, TestLocationProvider } from "@/lib/navigation/location-provider";
import realSpots from "@/data/real-spots.json";
import { isDestinationCandidate } from "@/features/adventure/validation";
import type { LocationSample, Route } from "@/types/adventure";

const point = { lat: 35, lng: 135 };
const sample = (timestamp: number, overrides: Partial<LocationSample> = {}): LocationSample => ({ ...point, accuracy: 10, timestamp, ...overrides });
const route: Route = {
  id: "road-route", origin: point, destination: { lat: 35, lng: 135.02 }, provider: "osrm", mode: "live",
  geometryKind: "road", mapCompatibility: "openstreetmap", durationSeconds: 600, distanceMeters: 2_000,
  geometry: [point, { lat: 35, lng: 135.01 }, { lat: 35, lng: 135.02 }],
  steps: [
    { id: "depart", location: point, endLocation: { lat: 35, lng: 135.01 }, maneuver: "STRAIGHT", instruction: "直進", distanceMeters: 1_000, durationSeconds: 300, distanceFromOriginMeters: 0 },
    { id: "turn", location: { lat: 35, lng: 135.01 }, endLocation: { lat: 35, lng: 135.02 }, maneuver: "TURN_RIGHT", instruction: "右折", distanceMeters: 1_000, durationSeconds: 300, distanceFromOriginMeters: 1_000 },
  ],
};

describe("navigation", () => {
  it("normalizes Apple reference-date geolocation timestamps without refreshing genuinely stale fixes", () => {
    const receivedAt = Date.UTC(2026, 9, 17, 8, 0, 0);
    const appleOffset = Date.UTC(2001, 0, 1);
    expect(normalizeGeolocationTimestamp(receivedAt - appleOffset, receivedAt)).toBe(receivedAt);
    expect(normalizeGeolocationTimestamp(receivedAt - 30_000, receivedAt)).toBe(receivedAt - 30_000);
    expect(normalizeGeolocationTimestamp(receivedAt - 86_400_000, receivedAt)).toBe(receivedAt - 86_400_000);
  });

  it("confirms arrival after two fresh, accurate, spaced samples within 50m", () => {
    const detector = new ArrivalDetector();
    expect(detector.update(sample(1_000), point, 1_000)).toBe(false);
    expect(detector.update(sample(2_000), point, 2_000)).toBe(true);
    expect(detector.getState()).toMatchObject({ status: "confirmed", consecutiveSamples: 2 });
    expect(detector.update(sample(3_000, { lat: 36 }), point, 3_000)).toBe(true);
  });

  it("allows relaxed fixes for guidance but keeps arrival confirmation strict", () => {
    expect(usableSample(sample(1_000, { accuracy: 150 }), 31_000)).toBe(true);
    expect(usableSample(sample(1_000), 62_000)).toBe(false);
    expect(usableSample(sample(1_000, { accuracy: 201 }), 1_000)).toBe(false);
    expect(usableArrivalSample(sample(1_000, { accuracy: 60 }), 1_000)).toBe(false);
    expect(usableArrivalSample(sample(1_000), 17_000)).toBe(false);
    expect(detectArrival(sample(1_000, { accuracy: 60 }), point, undefined, 1_000).status).toBe("unavailable");
    expect(detectArrival(sample(1_000, { lat: 35.001 }), point, undefined, 1_000).status).toBe("outside");
    const detector = new ArrivalDetector();
    detector.update(sample(1_000), point, 1_000);
    expect(detector.update(sample(20_000), point, 20_000)).toBe(false);
    expect(detector.getState().consecutiveSamples).toBe(1);
    expect(distanceMeters(point, point)).toBe(0);
  });

  it("projects GPS onto road geometry and calculates route-based guidance", () => {
    const guidance = new NavigationEngine(route).update(sample(1_000, { lng: 135.009 }), 1_000);
    expect(guidance).toMatchObject({ status: "navigating", stepIndex: 1 });
    expect(guidance!.distanceToStepMeters).toBeGreaterThan(50);
    expect(guidance!.distanceToStepMeters).toBeLessThan(200);
    expect(guidance!.remainingDistanceMeters).toBeGreaterThan(1_000);
    expect(guidance!.remainingDurationSeconds).toBeGreaterThan(300);
  });

  it("stops guidance off route and resists one noisy backward GPS jump", () => {
    const engine = new NavigationEngine(route);
    const first = engine.update(sample(1_000, { lng: 135.015 }), 1_000)!;
    const noisy = engine.update(sample(2_000, { lng: 135.005 }), 2_000)!;
    const confirmedReverse = engine.update(sample(3_000, { lng: 135.005 }), 3_000)!;
    expect(noisy.progress.progressMeters).toBe(first.progress.progressMeters);
    expect(confirmedReverse.progress.progressMeters).toBeLessThan(first.progress.progressMeters);
    expect(engine.update(sample(4_000, { lat: 35.01, lng: 135.01 }), 4_000)?.status).toBe("off-route");
  });

  it("provides a stoppable test location source without exposing a UI demo", () => {
    const provider = new TestLocationProvider();
    const handler = vi.fn();
    provider.start(handler);
    provider.emit(sample(1_000));
    provider.stop();
    provider.emit(sample(2_000));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("keeps curated real destinations structurally valid", () => {
    expect(realSpots.every(isDestinationCandidate)).toBe(true);
    expect(realSpots.every(spot => spot.source === "curated" && !spot.accessVerified)).toBe(true);
  });
});
