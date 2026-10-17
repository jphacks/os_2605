import fixtures from "@/data/demoRoutes.json";
import type { Route } from "@/types/adventure";
import type { RouteRequest, RoutingProvider } from "./types";
import { RoutingError } from "./errors";
import { validateRoute } from "./validation";
export class DemoRoutingProvider implements RoutingProvider {
  async getRoute(input: RouteRequest): Promise<Route> {
    const fixture = fixtures.find(r => r.destinationId === input.destination.id &&
      r.origin.lat === input.origin.lat && r.origin.lng === input.origin.lng);
    if (!fixture) throw new RoutingError("NO_ROUTE", 404);
    if (!input.destination.supportedVehicles.includes(input.vehicleType)) throw new RoutingError("UNSUPPORTED_VEHICLE");
    if (fixture.destination.lat !== input.destination.location.lat || fixture.destination.lng !== input.destination.location.lng) throw new RoutingError("INVALID_ROUTE");
    return validateRoute(structuredClone(fixture) as Route);
  }
}
