import type { Coordinates, Maneuver, Route, RouteStep } from "@/types/adventure";
import { isCoordinates } from "@/features/adventure/validation";
import type { RoutingProvider, RouteRequest } from "./types";
import { RoutingError } from "./errors";
import { nonnegative, record, validateRoute } from "./validation";

// Shared across providers in this server process, including concurrent selections.
let queue: Promise<void> = Promise.resolve();
let lastRequest = 0;
async function reserveSlot() {
  const slot = queue.then(async () => {
    const delay = Math.max(0, lastRequest + 1100 - Date.now());
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    lastRequest = Date.now();
  });
  queue = slot.catch(() => {});
  await slot;
}
function point(value: unknown): Coordinates {
  if (!Array.isArray(value) || value.length < 2) throw new RoutingError("INVALID_ROUTE");
  const p = { lat: value[1], lng: value[0] };
  if (!isCoordinates(p)) throw new RoutingError("INVALID_ROUTE");
  return p;
}
export function adaptOsrmRoute(payload: unknown, input: RouteRequest): Route {
  const data = record(payload);
  if (data.code === "NoRoute" || data.code === "NoSegment") throw new RoutingError("NO_ROUTE", 404);
  if (data.code !== "Ok" || !Array.isArray(data.routes) || !data.routes.length) throw new RoutingError("INVALID_ROUTE");
  const raw = record(data.routes[0]);
  const coordinates = record(raw.geometry).coordinates;
  if (!Array.isArray(coordinates) || !Array.isArray(raw.legs)) throw new RoutingError("INVALID_ROUTE");
  const steps: RouteStep[] = [];
  let cumulative = 0;
  for (const leg of raw.legs) {
    const items = record(leg).steps;
    if (!Array.isArray(items)) throw new RoutingError("MISSING_INSTRUCTIONS");
    for (const item of items) {
      const step = record(item), maneuver = record(step.maneuver);
      const geometry = record(step.geometry).coordinates;
      if (!Array.isArray(geometry) || !geometry.length || typeof maneuver.type !== "string") throw new RoutingError("MISSING_INSTRUCTIONS");
      const modifiers: Record<string, Maneuver> = { left: "TURN_LEFT", right: "TURN_RIGHT", "slight left": "SLIGHT_LEFT", "slight right": "SLIGHT_RIGHT", straight: "STRAIGHT", uturn: "UTURN", "sharp left": "TURN_LEFT", "sharp right": "TURN_RIGHT" };
      const kind: Maneuver = maneuver.type === "arrive" ? "ARRIVE" : maneuver.type === "depart" ? "STRAIGHT" :
        ["turn", "continue", "new name", "end of road", "fork", "on ramp", "off ramp", "merge", "ramp"].includes(maneuver.type) ? modifiers[String(maneuver.modifier)] ?? "OTHER" : "OTHER";
      const labels: Record<Maneuver, string> = { STRAIGHT: "直進", TURN_LEFT: "左折", TURN_RIGHT: "右折", SLIGHT_LEFT: "緩やかに左へ", SLIGHT_RIGHT: "緩やかに右へ", UTURN: "Uターン", ARRIVE: "到着", OTHER: "道路の案内を確認" };
      steps.push({ id: `step-${steps.length}`, maneuver: kind, instruction: labels[kind], location: point(geometry[0]),
        endLocation: point(geometry[geometry.length - 1]), distanceMeters: nonnegative(step.distance),
        durationSeconds: nonnegative(step.duration), distanceFromOriginMeters: cumulative });
      cumulative += nonnegative(step.distance);
    }
  }
  return validateRoute({ id: crypto.randomUUID(), origin: input.origin, destination: input.destination.location,
    durationSeconds: nonnegative(raw.duration), distanceMeters: nonnegative(raw.distance), geometry: coordinates.map(point), steps,
    provider: "osrm", mode: "live", geometryKind: "road", mapCompatibility: "openstreetmap" });
}
export class OsrmRoutingProvider implements RoutingProvider {
  constructor(private request: typeof fetch = fetch) {}
  async getRoute(input: RouteRequest): Promise<Route> {
    if (input.vehicleType !== "car" && input.vehicleType !== "motorcycle") throw new RoutingError("UNSUPPORTED_VEHICLE");
    if (!["openstreetmap", "curated"].includes(input.destination.source ?? "")) throw new RoutingError("UNVERIFIED_DESTINATION");
    await reserveSlot();
    const { origin, destination } = input;
    let response: Response;
    try {
      response = await this.request(`https://routing.openstreetmap.de/routed-car/route/v1/driving/${origin.lng},${origin.lat};${destination.location.lng},${destination.location.lat}?steps=true&geometries=geojson&overview=full`, {
        cache: "no-store", signal: AbortSignal.timeout(10000), headers: { "User-Agent": "MysteryDestinationNavi/0.1 (+https://github.com/jphacks/os_2605)" } });
    } catch (error) { throw new RoutingError(error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name) ? "TIMEOUT" : "NETWORK_ERROR", 503); }
    if (response.status === 429) throw new RoutingError("RATE_LIMITED", 503);
    if (!response.ok) throw new RoutingError("NETWORK_ERROR", 503);
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new RoutingError("INVALID_ROUTE", 502); }
    return adaptOsrmRoute(payload, input);
  }
}
