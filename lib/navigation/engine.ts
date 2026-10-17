import { ARRIVAL_CONFIG, NAVIGATION_CONFIG } from "@/config/navigation";
import type { Coordinates, LocationSample, Route, RouteStep } from "@/types/adventure";
export function validCoordinates(value: Coordinates) {
  return Number.isFinite(value.lat) && Math.abs(value.lat) <= 90 && Number.isFinite(value.lng) && Math.abs(value.lng) <= 180;
}
export function distanceMeters(a: Coordinates, b: Coordinates) {
  if (!validCoordinates(a) || !validCoordinates(b)) return Number.NaN;
  const rad = Math.PI / 180;
  const h = Math.sin((b.lat - a.lat) * rad / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lng - a.lng) * rad / 2) ** 2;
  return 6_371_000 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function usableSample(sample: LocationSample, now = Date.now()) {
  const age = now - sample.timestamp;
  return validCoordinates(sample) && Number.isFinite(sample.accuracy) && sample.accuracy >= 0 && sample.accuracy <= NAVIGATION_CONFIG.maxAccuracyMeters && age >= 0 && age <= NAVIGATION_CONFIG.maxLocationAgeMs;
}
export function usableArrivalSample(sample: LocationSample, now = Date.now()) {
  const age = now - sample.timestamp;
  return validCoordinates(sample) && Number.isFinite(sample.accuracy) && sample.accuracy >= 0 && sample.accuracy <= ARRIVAL_CONFIG.maxAccuracyMeters && age >= 0 && age <= ARRIVAL_CONFIG.maxLocationAgeMs;
}

export type NavigationProgress = { progressMeters: number; geometryIndex: number; stepIndex: number; regressionCount: number };
export type NavigationGuidance = {
  status: "navigating" | "off-route";
  step: RouteStep;
  stepIndex: number;
  distanceToStepMeters: number;
  remainingDistanceMeters: number;
  remainingDurationSeconds: number;
  progress: NavigationProgress;
};
type Projection = { distance: number; progress: number; segment: number };

function geometryCumulative(route: Route) {
  const cumulative = [0];
  for (let index = 1; index < route.geometry.length; index++) cumulative.push(cumulative[index - 1] + distanceMeters(route.geometry[index - 1], route.geometry[index]));
  return cumulative;
}
function projectToSegment(point: Coordinates, start: Coordinates, end: Coordinates, before: number): Projection {
  const latitude = (start.lat + end.lat + point.lat) / 3 * Math.PI / 180;
  const xScale = 111_320 * Math.cos(latitude), yScale = 110_540;
  const vx = (end.lng - start.lng) * xScale, vy = (end.lat - start.lat) * yScale;
  const wx = (point.lng - start.lng) * xScale, wy = (point.lat - start.lat) * yScale;
  const squared = vx * vx + vy * vy;
  const ratio = squared === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / squared));
  return { distance: Math.hypot(wx - vx * ratio, wy - vy * ratio), progress: before + Math.sqrt(squared) * ratio, segment: 0 };
}
function closestProjection(route: Route, point: Coordinates, previous?: NavigationProgress) {
  if (route.geometry.length < 2 || !route.geometry.every(validCoordinates)) return null;
  const cumulative = geometryCumulative(route), geometryLength = cumulative.at(-1) ?? 0;
  if (!Number.isFinite(geometryLength) || geometryLength <= 0) return null;
  const scale = route.distanceMeters / geometryLength;
  let best: Projection | null = null;
  for (let index = 0; index < route.geometry.length - 1; index++) {
    const candidate = projectToSegment(point, route.geometry[index], route.geometry[index + 1], cumulative[index]);
    candidate.segment = index; candidate.progress *= scale;
    const penalty = previous && Math.abs(index - previous.geometryIndex) > 20 ? 20 : 0;
    const bestPenalty = best && previous && Math.abs(best.segment - previous.geometryIndex) > 20 ? 20 : 0;
    if (!best || candidate.distance + penalty < best.distance + bestPenalty) best = candidate;
  }
  return best;
}
function nextStep(route: Route, progressMeters: number) {
  const index = route.steps.findIndex((step, stepIndex) => stepIndex > 0 && step.distanceFromOriginMeters > progressMeters + NAVIGATION_CONFIG.stepPassToleranceMeters);
  const stepIndex = index >= 0 ? index : route.steps.length - 1;
  return { step: route.steps[stepIndex], stepIndex };
}
export function updateNavigation(route: Route, sample: LocationSample, previous?: NavigationProgress, now = Date.now()): NavigationGuidance | null {
  if (!route.steps.length || !usableSample(sample, now) || route.distanceMeters <= 0 || route.durationSeconds <= 0) return null;
  const projection = closestProjection(route, sample, previous);
  if (!projection) return null;
  let progressMeters = projection.progress, regressionCount = 0;
  if (previous && progressMeters < previous.progressMeters - NAVIGATION_CONFIG.allowedProgressRegressionMeters) {
    regressionCount = previous.regressionCount + 1;
    if (regressionCount < NAVIGATION_CONFIG.regressionConfirmationCount) progressMeters = previous.progressMeters;
  }
  progressMeters = Math.max(0, Math.min(route.distanceMeters, progressMeters));
  const { step, stepIndex } = nextStep(route, progressMeters);
  const remainingDistanceMeters = Math.max(0, route.distanceMeters - progressMeters);
  return {
    status: projection.distance > Math.max(NAVIGATION_CONFIG.offRouteMeters, sample.accuracy * 2) ? "off-route" : "navigating",
    step, stepIndex,
    distanceToStepMeters: Math.max(0, Math.round(Math.max(progressMeters, step.distanceFromOriginMeters) - progressMeters)),
    remainingDistanceMeters: Math.round(remainingDistanceMeters),
    remainingDurationSeconds: Math.max(0, Math.round(route.durationSeconds * remainingDistanceMeters / route.distanceMeters)),
    progress: { progressMeters, geometryIndex: projection.segment, stepIndex, regressionCount },
  };
}
export class NavigationEngine {
  private progress: NavigationProgress | undefined;
  constructor(private readonly route: Route) {}
  update(sample: LocationSample, now = Date.now()) {
    const result = updateNavigation(this.route, sample, this.progress, now);
    if (result) this.progress = result.progress;
    return result;
  }
}

export type ArrivalState = { status: "outside" | "candidate" | "confirmed" | "unavailable"; consecutiveSamples: number; lastTimestamp: number | null; distanceMeters: number | null };
export const INITIAL_ARRIVAL_STATE: ArrivalState = { status: "outside", consecutiveSamples: 0, lastTimestamp: null, distanceMeters: null };
export function detectArrival(sample: LocationSample, destination: Coordinates, previous: ArrivalState = INITIAL_ARRIVAL_STATE, now = Date.now()): ArrivalState {
  if (previous.status === "confirmed") return previous;
  if (!validCoordinates(destination) || !usableArrivalSample(sample, now)) return { status: "unavailable", consecutiveSamples: 0, lastTimestamp: previous.lastTimestamp, distanceMeters: null };
  const distance = distanceMeters(sample, destination);
  if (distance > ARRIVAL_CONFIG.radiusMeters) return { status: "outside", consecutiveSamples: 0, lastTimestamp: sample.timestamp, distanceMeters: distance };
  const interval = previous.lastTimestamp === null ? null : sample.timestamp - previous.lastTimestamp;
  if (interval !== null && (interval < ARRIVAL_CONFIG.minSampleIntervalMs || interval > ARRIVAL_CONFIG.maxSampleGapMs)) return { status: "candidate", consecutiveSamples: 1, lastTimestamp: sample.timestamp, distanceMeters: distance };
  const consecutiveSamples = previous.status === "candidate" ? previous.consecutiveSamples + 1 : 1;
  return { status: consecutiveSamples >= ARRIVAL_CONFIG.confirmationCount ? "confirmed" : "candidate", consecutiveSamples, lastTimestamp: sample.timestamp, distanceMeters: distance };
}
export class ArrivalDetector {
  private state = INITIAL_ARRIVAL_STATE;
  update(sample: LocationSample, destination: Coordinates, now = Date.now()) { this.state = detectArrival(sample, destination, this.state, now); return this.state.status === "confirmed"; }
  getState() { return this.state; }
}
