import type { Route } from "@/types/adventure";
import type { RouteRequest, RoutingProvider } from "./types";
import { RoutingError } from "./errors";
import { adaptGoogleRoute, GOOGLE_FIELD_MASK } from "./google-adapter";
/** Server entry points only. Never import into client components. */
export class LiveRoutingProvider implements RoutingProvider {
  constructor(private apiKey: string | undefined, private request: typeof fetch = fetch) {}
  async getRoute(input: RouteRequest): Promise<Route> {
    if (input.vehicleType !== "car") throw new RoutingError("UNSUPPORTED_VEHICLE");
    if (input.destination.liveRoutingVerified !== true) throw new RoutingError("UNVERIFIED_DESTINATION");
    if (!this.apiKey) throw new RoutingError("API_KEY_MISSING", 503);
    let response: Response;
    try {
      response = await this.request("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST", cache: "no-store", signal: AbortSignal.timeout(8000),
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": this.apiKey, "X-Goog-FieldMask": GOOGLE_FIELD_MASK },
        body: JSON.stringify({ origin: { location: { latLng: { latitude: input.origin.lat, longitude: input.origin.lng } } },
          destination: { location: { latLng: { latitude: input.destination.location.lat, longitude: input.destination.location.lng } } },
          travelMode: "DRIVE", routingPreference: "TRAFFIC_UNAWARE", computeAlternativeRoutes: false,
          polylineEncoding: "ENCODED_POLYLINE", polylineQuality: "HIGH_QUALITY", languageCode: "ja", units: "METRIC" }),
      });
    } catch (error) {
      const timeout = error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name);
      throw new RoutingError(timeout ? "TIMEOUT" : "NETWORK_ERROR", 503);
    }
    if (response.status === 401 || response.status === 403) throw new RoutingError("AUTH_ERROR", 503);
    if (response.status === 429) throw new RoutingError("RATE_LIMITED", 503);
    if (!response.ok) {
      // Invalid API keys may be reported as HTTP 400 instead of 401/403.
      let status: unknown;
      let keyInvalid = false;
      try {
        const body = await response.json();
        status = body?.error?.status;
        keyInvalid = Array.isArray(body?.error?.details) && body.error.details.some((detail: { reason?: unknown }) => detail?.reason === "API_KEY_INVALID");
      } catch { /* Never expose or log upstream response bodies. */ }
      if (keyInvalid || status === "UNAUTHENTICATED" || status === "PERMISSION_DENIED") throw new RoutingError("AUTH_ERROR", 503);
      if (status === "RESOURCE_EXHAUSTED") throw new RoutingError("RATE_LIMITED", 503);
      throw new RoutingError("NETWORK_ERROR", 503);
    }
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new RoutingError("INVALID_ROUTE", 502); }
    return adaptGoogleRoute(payload, input);
  }
}
