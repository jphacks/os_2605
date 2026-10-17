import { isCoordinates } from "@/features/adventure/validation";
import type { Coordinates, Maneuver, Route, RouteStep } from "@/types/adventure";
import type { RouteRequest } from "./types";
import { RoutingError } from "./errors";
import { nonnegative, record, validateRoute } from "./validation";
export const GOOGLE_FIELD_MASK = [
  "routes.duration", "routes.distanceMeters", "routes.polyline.encodedPolyline",
  "routes.legs.steps.distanceMeters", "routes.legs.steps.staticDuration",
  "routes.legs.steps.startLocation", "routes.legs.steps.endLocation",
  "routes.legs.steps.navigationInstruction",
].join(",");
function seconds(value: unknown): number {
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,9})?s$/.test(value)) throw new RoutingError("INVALID_ROUTE");
  return nonnegative(Number(value.slice(0, -1)));
}
function location(value: unknown): Coordinates {
  const p = record(record(value).latLng);
  const point = { lat: p.latitude, lng: p.longitude };
  if (!isCoordinates(point)) throw new RoutingError("INVALID_ROUTE");
  return point;
}
export function decodePolyline(value: unknown): Coordinates[] {
  if (typeof value !== "string" || !value || value.length > 2_000_000) throw new RoutingError("INVALID_ROUTE");
  let index = 0, lat = 0, lng = 0;
  const points: Coordinates[] = [];
  function component(): number {
    let result = 0, shift = 0, byte: number;
    do {
      if (index >= (value as string).length || shift > 30) throw new RoutingError("INVALID_ROUTE");
      byte = (value as string).charCodeAt(index++) - 63;
      if (byte < 0 || byte > 63) throw new RoutingError("INVALID_ROUTE");
      result += (byte & 31) * 2 ** shift;
      shift += 5;
    } while (byte >= 32);
    return result % 2 ? -(Math.floor(result / 2) + 1) : result / 2;
  }
  while (index < value.length) {
    lat += component(); lng += component();
    const point = { lat: lat / 1e5, lng: lng / 1e5 };
    if (!isCoordinates(point)) throw new RoutingError("INVALID_ROUTE");
    points.push(point);
  }
  return points;
}
const maneuvers: Record<string, Maneuver> = {
  STRAIGHT: "STRAIGHT", DEPART: "STRAIGHT", TURN_LEFT: "TURN_LEFT", TURN_RIGHT: "TURN_RIGHT",
  TURN_SLIGHT_LEFT: "SLIGHT_LEFT", TURN_SLIGHT_RIGHT: "SLIGHT_RIGHT",
  UTURN_LEFT: "UTURN", UTURN_RIGHT: "UTURN", ARRIVE: "ARRIVE",
};
export function adaptGoogleRoute(payload: unknown, input: RouteRequest): Route {
  const routes = record(payload).routes;
  if (!Array.isArray(routes)) throw new RoutingError("INVALID_ROUTE");
  if (!routes.length) throw new RoutingError("NO_ROUTE", 404);
  const raw = record(routes[0]);
  if (!Array.isArray(raw.legs) || !raw.legs.length) throw new RoutingError("MISSING_INSTRUCTIONS");
  const steps: RouteStep[] = [];
  let cumulative = 0;
  for (const leg of raw.legs) {
    const rawSteps = record(leg).steps;
    if (!Array.isArray(rawSteps) || !rawSteps.length) throw new RoutingError("MISSING_INSTRUCTIONS");
    for (const item of rawSteps) {
      const step = record(item);
      if (!step.navigationInstruction) throw new RoutingError("MISSING_INSTRUCTIONS");
      const instruction = record(step.navigationInstruction);
      if (typeof instruction.instructions !== "string" || typeof instruction.maneuver !== "string" || instruction.maneuver === "MANEUVER_UNSPECIFIED") throw new RoutingError("MISSING_INSTRUCTIONS");
      const distance = nonnegative(step.distanceMeters ?? 0);
      steps.push({ id: `step-${steps.length}`, maneuver: maneuvers[instruction.maneuver] ?? "OTHER",
        instruction: instruction.instructions, location: location(step.startLocation), endLocation: location(step.endLocation),
        distanceMeters: distance, durationSeconds: seconds(step.staticDuration), distanceFromOriginMeters: cumulative });
      cumulative += distance;
    }
  }
  return validateRoute({ id: crypto.randomUUID(), origin: input.origin, destination: input.destination.location,
    durationSeconds: seconds(raw.duration), distanceMeters: nonnegative(raw.distanceMeters),
    geometry: decodePolyline(record(raw.polyline).encodedPolyline), steps,
    provider: "google-routes", mode: "live", geometryKind: "road", mapCompatibility: "google-maps" });
}
