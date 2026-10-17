import type { Coordinates, LocationSample, Route } from "@/types/adventure";
export function distanceMeters(a: Coordinates, b: Coordinates) {
  const rad = Math.PI / 180;
  const h = Math.sin((b.lat - a.lat) * rad / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lng - a.lng) * rad / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function usableSample(sample: LocationSample, now = Date.now()) {
  return Number.isFinite(sample.lat) && Math.abs(sample.lat) <= 90 && Number.isFinite(sample.lng) && Math.abs(sample.lng) <= 180 && Number.isFinite(sample.accuracy) && sample.accuracy >= 0 && sample.accuracy <= 50 && now - sample.timestamp >= 0 && now - sample.timestamp <= 15000;
}
export class ArrivalDetector {
  private since: number | null = null;
  private last = 0;
  update(sample: LocationSample, destination: Coordinates, now = Date.now()) {
    if (!usableSample(sample, now) || sample.timestamp <= this.last || distanceMeters(sample, destination) > 35) { this.since = null; return false; }
    if (sample.timestamp - this.last > 15000) this.since = null;
    this.last = sample.timestamp;
    this.since ??= sample.timestamp;
    return sample.timestamp - this.since >= 5000;
  }
}
export class NavigationEngine {
  private index = 0;
  constructor(private route: Route) {}
  update(sample: LocationSample) {
    if (!usableSample(sample)) return null;
    while (this.index < this.route.steps.length - 1 && distanceMeters(sample, this.route.steps[this.index + 1].location) <= 30) this.index++;
    const next = this.route.steps[Math.min(this.index + 1, this.route.steps.length - 1)];
    return { step: next, distance: Math.round(distanceMeters(sample, next.location)) };
  }
}
