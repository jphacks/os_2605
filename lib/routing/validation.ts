import { isCoordinates, isVehicleType } from "@/features/adventure/validation";
import type { Route } from "@/types/adventure";
import type { RouteApiRequest } from "./types";
import { RoutingError } from "./errors";
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RoutingError("INVALID_ROUTE");
  return value as Record<string, unknown>;
}
export function nonnegative(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new RoutingError("INVALID_ROUTE");
  return value;
}
export function parseRouteRequest(value: unknown): RouteApiRequest {
  try {
    const v = record(value);
    if (!isCoordinates(v.origin) || !isVehicleType(v.vehicleType) ||
      typeof v.destinationId !== "string" || !v.destinationId ||
      (v.mode !== "demo" && v.mode !== "live")) throw new Error();
    return { origin: v.origin, vehicleType: v.vehicleType, destinationId: v.destinationId, mode: v.mode };
  } catch { throw new RoutingError("INVALID_INPUT", 400); }
}
/** Reject corrupt route data before it reaches navigation. */
export function validateRoute(route: Route): Route {
  if (!route.id || !isCoordinates(route.origin) || !isCoordinates(route.destination) ||
    !Array.isArray(route.geometry) || route.geometry.length < 2 || !route.geometry.every(isCoordinates)) throw new RoutingError("INVALID_ROUTE");
  if (nonnegative(route.distanceMeters) === 0 || nonnegative(route.durationSeconds) === 0) throw new RoutingError("INVALID_ROUTE");
  if (!Array.isArray(route.steps) || !route.steps.length) throw new RoutingError("MISSING_INSTRUCTIONS");
  const demo = route.mode === "demo" && route.provider === "demo-schematic" && route.geometryKind === "schematic" && route.mapCompatibility === "schematic-only";
  const live = route.mode === "live" && route.provider === "google-routes" && route.geometryKind === "road" && route.mapCompatibility === "google-maps";
  const osm = route.mode === "live" && route.provider === "osrm" && route.geometryKind === "road" && route.mapCompatibility === "openstreetmap";
  if (!demo && !live && !osm) throw new RoutingError("INVALID_ROUTE");
  let previousEnd: Route["origin"] | undefined;
  let distance = 0;
  let duration = 0;
  const ids = new Set<string>();
  for (const step of route.steps) {
    if (!step.id || ids.has(step.id) || !isCoordinates(step.location) || !isCoordinates(step.endLocation)) throw new RoutingError("INVALID_ROUTE");
    if (previousEnd && (Math.abs(previousEnd.lat - step.location.lat) > 0.0001 || Math.abs(previousEnd.lng - step.location.lng) > 0.0001)) throw new RoutingError("INVALID_ROUTE");
    previousEnd = step.endLocation;
    ids.add(step.id);
    if (typeof step.instruction !== "string" || !step.instruction.trim() || !["STRAIGHT", "TURN_LEFT", "TURN_RIGHT", "SLIGHT_LEFT", "SLIGHT_RIGHT", "UTURN", "ARRIVE", "OTHER"].includes(step.maneuver)) throw new RoutingError("MISSING_INSTRUCTIONS");
    if (Math.abs(nonnegative(step.distanceFromOriginMeters) - distance) > 1) throw new RoutingError("INVALID_ROUTE");
    distance += nonnegative(step.distanceMeters);
    duration += nonnegative(step.durationSeconds);
  }
  const first = route.geometry[0];
  const last = route.geometry[route.geometry.length - 1];
  const near = (a: Route["origin"], b: Route["origin"], tolerance: number) => Math.abs(a.lat - b.lat) <= tolerance && Math.abs(a.lng - b.lng) <= tolerance;
  if (!near(first, route.steps[0].location, 0.0001) || !near(last, route.steps[route.steps.length - 1].endLocation, 0.0001) ||
    !near(first, route.origin, 0.02) || !near(last, route.destination, 0.02)) throw new RoutingError("INVALID_ROUTE");
  // Google may round each step to meters/seconds.
  if (Math.abs(distance - route.distanceMeters) > route.steps.length + 1 || Math.abs(duration - route.durationSeconds) > route.steps.length + 1) throw new RoutingError("INVALID_ROUTE");
  return route;
}
