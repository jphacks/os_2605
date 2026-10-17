import { describe, expect, it, vi } from "vitest";
import fixtures from "@/data/demoRoutes.json";
import spots from "@/data/spots.json";
import { isDestinationCandidate } from "@/features/adventure/validation";
import { DemoRoutingProvider } from "@/lib/routing/demo-provider";
import { LiveRoutingProvider } from "@/lib/routing/live-provider";
import { adaptGoogleRoute, decodePolyline, GOOGLE_FIELD_MASK } from "@/lib/routing/google-adapter";
import { parseRouteRequest, validateRoute } from "@/lib/routing/validation";
import { prepareAdventure, MAX_ROUTE_CANDIDATES } from "@/features/adventure/route-planner";
import { RoutingError } from "@/lib/routing/errors";
import { POST as routesPost } from "@/app/api/routes/route";
import { POST as adventuresPost } from "@/app/api/adventures/route";
import type { AdventureSettings, Route, DestinationCandidate } from "@/types/adventure";

const candidates = (spots as unknown[]).filter(isDestinationCandidate);
const destination = candidates[0];
const origin = { lat: 35, lng: 135.75 };
const input = { origin, destination, vehicleType: "car" as const };
const settings: AdventureSettings = { origin, vehicleType: "car", durationMinutes: 90, category: "nature" };
const googleInput = { ...input, origin: { lat: 38.5, lng: -120.2 }, destination: { ...destination, location: { lat: 43.252, lng: -126.453 } } };
const liveInput = { ...googleInput, destination: { ...googleInput.destination, liveRoutingVerified: true } };
const loc = (latitude: number, longitude: number) => ({ latLng: { latitude, longitude } });
// Synthetic API-shaped fixture; not sourced from Google or claimed as road geometry.
function googlePayload() {
  return { routes: [{ duration: "30s", distanceMeters: 300,
    polyline: { encodedPolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@" }, legs: [{ steps: [
      { distanceMeters: 100, staticDuration: "10s", startLocation: loc(38.5, -120.2), endLocation: loc(40.7, -120.95), navigationInstruction: { maneuver: "DEPART", instructions: "Continue" } },
      { distanceMeters: 200, staticDuration: "20s", startLocation: loc(40.7, -120.95), endLocation: loc(43.252, -126.453), navigationInstruction: { maneuver: "TURN_RIGHT", instructions: "Turn right" } },
    ] }] }] };
}
const adapted = () => adaptGoogleRoute(googlePayload(), googleInput);
const request = (body: unknown) => new Request("http://localhost/api/routes", { method: "POST", body: JSON.stringify(body) });

describe("demo routing", () => {
  it("returns consistent independent data with geometry and ordered instructions", async () => {
    const provider = new DemoRoutingProvider();
    const route = await provider.getRoute(input);
    expect(route).toMatchObject({ durationSeconds: 5400, distanceMeters: 45000, provider: "demo-schematic", geometryKind: "schematic", mapCompatibility: "schematic-only" });
    expect(route.geometry[0]).toEqual(origin);
    expect(route.geometry.at(-1)).toEqual(destination.location);
    expect(route.steps.map(s => s.distanceFromOriginMeters)).toEqual([0, 22500]);
    const again = await provider.getRoute(input);
    expect(again).toEqual(route);
    route.geometry[0].lat = 0;
    expect(again.geometry[0]).toEqual(origin);
    await expect(provider.getRoute({ ...input, vehicleType: "motorcycle" })).resolves.toMatchObject({ id: again.id });
  });
  it("validates every local fixture", () => {
    for (const fixture of fixtures) expect(validateRoute(fixture as Route)).toEqual(fixture);
  });
  it("never relabels the origin of a demo route", async () => {
    await expect(new DemoRoutingProvider().getRoute({ ...input, origin: { lat: 0, lng: 0 } })).rejects.toMatchObject({ code: "NO_ROUTE" });
    await expect(new DemoRoutingProvider().getRoute({ ...input, destination: { ...destination, id: "missing" } })).rejects.toMatchObject({ code: "NO_ROUTE" });
  });
});
describe("Google adapter", () => {
  it("converts seconds, meters, polyline and instructions in source order", () => {
    const route = adapted();
    expect(route.durationSeconds).toBe(30);
    expect(route.distanceMeters).toBe(300);
    expect(route.geometry).toEqual([{ lat: 38.5, lng: -120.2 }, { lat: 40.7, lng: -120.95 }, { lat: 43.252, lng: -126.453 }]);
    expect(route.steps.map(s => [s.maneuver, s.distanceFromOriginMeters, s.durationSeconds])).toEqual([["STRAIGHT", 0, 10], ["TURN_RIGHT", 100, 20]]);
  });
  it.each([null, {}, { routes: "invalid" }, { routes: [{}] }])("rejects malformed responses %j", value => {
    expect(() => adaptGoogleRoute(value, input)).toThrow(RoutingError);
  });
  it("rejects missing navigation and corrupt metrics", () => {
    const payload = googlePayload(); payload.routes[0].legs[0].steps[0].navigationInstruction.instructions = "";
    expect(() => adaptGoogleRoute(payload, googleInput)).toThrow(RoutingError);
    const route = adapted(); route.distanceMeters = -1;
    expect(() => validateRoute(route)).toThrow(RoutingError);
    const bad = adapted(); bad.steps[1].distanceFromOriginMeters = 0;
    expect(() => validateRoute(bad)).toThrow(RoutingError);
    const mixed = adapted(); mixed.mode = "demo";
    expect(() => validateRoute(mixed)).toThrow(RoutingError);
    const disconnected = adapted(); disconnected.steps[1].location = { lat: 0, lng: 0 };
    expect(() => validateRoute(disconnected)).toThrow(RoutingError);
    expect(() => adaptGoogleRoute({ routes: [] }, input)).toThrow(RoutingError);
    for (const polyline of ["_", "!", "~~~~~~~~~~~~", ""]) expect(() => decodePolyline(polyline)).toThrow(RoutingError);
  });
  it("does not misrepresent an unfamiliar maneuver as straight", () => {
    const payload = googlePayload(); payload.routes[0].legs[0].steps[0].navigationInstruction.maneuver = "ROUNDABOUT_LEFT";
    expect(adaptGoogleRoute(payload, googleInput).steps[0].maneuver).toBe("OTHER");
  });
});
describe("live routing", () => {
  it("uses a fixed endpoint, minimal mask, server key and no cache", async () => {
    const mock = vi.fn<typeof fetch>().mockResolvedValue(Response.json(googlePayload()));
    await new LiveRoutingProvider("dummy", mock).getRoute(liveInput);
    const [url, options] = mock.mock.calls[0];
    expect(url).toBe("https://routes.googleapis.com/directions/v2:computeRoutes");
    expect(options).toMatchObject({ cache: "no-store", headers: { "X-Goog-Api-Key": "dummy", "X-Goog-FieldMask": GOOGLE_FIELD_MASK } });
    expect(JSON.parse(options!.body as string)).toMatchObject({ travelMode: "DRIVE", routingPreference: "TRAFFIC_UNAWARE" });
    expect(GOOGLE_FIELD_MASK).not.toContain("*");
  });
  it("stops unsupported vehicles, fake destinations and missing keys before fetch", async () => {
    const mock = vi.fn<typeof fetch>();
    await expect(new LiveRoutingProvider("dummy", mock).getRoute({ ...liveInput, vehicleType: "motorcycle" })).rejects.toMatchObject({ code: "UNSUPPORTED_VEHICLE" });
    await expect(new LiveRoutingProvider("dummy", mock).getRoute(input)).rejects.toMatchObject({ code: "UNVERIFIED_DESTINATION" });
    await expect(new LiveRoutingProvider(undefined, mock).getRoute(liveInput)).rejects.toMatchObject({ code: "API_KEY_MISSING" });
    expect(mock).not.toHaveBeenCalled();
  });
  it.each([[401, "AUTH_ERROR"], [403, "AUTH_ERROR"], [429, "RATE_LIMITED"], [500, "NETWORK_ERROR"]])("handles HTTP %i", async (status, code) => {
    const mock = vi.fn<typeof fetch>().mockResolvedValue(new Response("private details", { status: status as number }));
    await expect(new LiveRoutingProvider("dummy", mock).getRoute(liveInput)).rejects.toMatchObject({ code });
  });
  it.each([[new DOMException("private", "TimeoutError"), "TIMEOUT"], [new TypeError("private"), "NETWORK_ERROR"]])("handles transport errors", async (error, code) => {
    const mock = vi.fn<typeof fetch>().mockRejectedValue(error);
    await expect(new LiveRoutingProvider("dummy", mock).getRoute(liveInput)).rejects.toMatchObject({ code });
  });
  it("handles HTTP 400 invalid API keys", async () => {
    const mock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ error: { status: "INVALID_ARGUMENT", details: [{ reason: "API_KEY_INVALID" }] } }, { status: 400 }));
    await expect(new LiveRoutingProvider("dummy", mock).getRoute(liveInput)).rejects.toMatchObject({ code: "AUTH_ERROR" });
  });
  it("rejects invalid JSON without leaking it", async () => {
    const mock = vi.fn<typeof fetch>().mockResolvedValue(new Response("private"));
    await expect(new LiveRoutingProvider("dummy", mock).getRoute(liveInput)).rejects.toMatchObject({ code: "INVALID_ROUTE" });
  });
});
function fakeCandidate(id: string): DestinationCandidate { return { ...destination, id }; }
function timedProvider(durationSeconds: number) {
  return { getRoute: vi.fn(async () => { const route = structuredClone(fixtures[0]) as Route; route.durationSeconds = durationSeconds; route.steps.forEach(s => { s.durationSeconds = durationSeconds / 2; }); return route; }) };
}
describe("route based selection", () => {
  it.each([4500, 6300])("includes the ±15 minute boundary %i", async seconds => {
    const provider = timedProvider(seconds);
    const result = await prepareAdventure(settings, "demo", [{ ...destination, demoDurations: { unrelated: 1 } }], provider, () => 0);
    expect(result.route?.durationSeconds).toBe(seconds);
    expect(result.estimatedDurationMinutes).toBe(seconds / 60);
    expect(result.status).toBe("ready");
  });
  it.each([4499, 6301])("rejects outside the boundary %i", async seconds => {
    await expect(prepareAdventure(settings, "demo", [destination], timedProvider(seconds))).rejects.toMatchObject({ code: "NO_DURATION_MATCH" });
  });
  it("limits calls even with many candidates", async () => {
    const provider = timedProvider(5400);
    await prepareAdventure(settings, "demo", Array.from({ length: 40 }, (_, i) => fakeCandidate(`test-${i}`)), provider, () => 0);
    expect(provider.getRoute).toHaveBeenCalledTimes(MAX_ROUTE_CANDIDATES);
  });
  it("reselects after no route or a time mismatch", async () => {
    const provider = timedProvider(5400);
    provider.getRoute.mockRejectedValueOnce(new RoutingError("NO_ROUTE"));
    const plan = await prepareAdventure(settings, "demo", [fakeCandidate("a"), fakeCandidate("b")], provider, () => 0);
    expect(plan.route).toBeDefined();
    const mismatch = timedProvider(5400);
    mismatch.getRoute.mockResolvedValueOnce(await timedProvider(900).getRoute());
    await expect(prepareAdventure(settings, "demo", [fakeCandidate("a"), fakeCandidate("b")], mismatch, () => 0)).resolves.toMatchObject({ status: "ready" });
  });
  it("fails safely for no data and API outages, and accepts motorcycles in live mode", async () => {
    await expect(prepareAdventure(settings, "demo", [], timedProvider(5400))).rejects.toMatchObject({ code: "NO_ROUTE" });
    const provider = { getRoute: vi.fn().mockRejectedValue(new RoutingError("AUTH_ERROR")) };
    await expect(prepareAdventure(settings, "demo", [destination], provider)).rejects.toMatchObject({ code: "AUTH_ERROR" });
    const motorcycleDestination = { ...destination, source: "openstreetmap" as const, supportedVehicles: ["motorcycle" as const] };
    const motorcycleRoute = structuredClone(fixtures[0]) as Route;
    Object.assign(motorcycleRoute, { mode: "live", provider: "osrm", geometryKind: "road", mapCompatibility: "openstreetmap" });
    await expect(prepareAdventure({ ...settings, vehicleType: "motorcycle" }, "live", [motorcycleDestination], { getRoute: async () => motorcycleRoute }, () => 0)).resolves.toMatchObject({ status: "ready" });
  });
});
describe("Route Handlers", () => {
  const body = { origin, destinationId: destination.id, vehicleType: "car", mode: "demo" };
  it("rejects the demo route endpoint instead of returning schematic geometry", async () => {
    const response = await routesPost(request(body));
    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ error: { code: "INVALID_INPUT" } });
  });
  it.each([{}, { ...body, origin: { lat: 91, lng: 0 } }, { ...body, vehicleType: "bicycle" }, { ...body, mode: "oops" }, null])("validates input %j", async value => {
    expect((await routesPost(request(value))).status).toBe(400);
  });
  it("rejects invalid JSON and unregistered destinations", async () => {
    expect((await routesPost(new Request("http://localhost", { method: "POST", body: "{" }))).status).toBe(400);
    const response = await routesPost(request({ ...body, mode: "live", destinationId: "https://example.com" }));
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: "UNKNOWN_DESTINATION" } });
    expect(() => parseRouteRequest({ ...body, origin: { lat: NaN, lng: 0 } })).toThrow(RoutingError);
  });
  it("does not return demo data for an unknown live motorcycle destination", async () => {
    const response = await routesPost(request({ ...body, mode: "live", vehicleType: "motorcycle" }));
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: "UNKNOWN_DESTINATION" } });
  });
  it("rejects adventure demo requests instead of preparing fake data", async () => {
    const response = await adventuresPost(request({ mode: "demo", settings }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "INVALID_INPUT" } });
  });
});
