import spots from "@/data/spots.json";
import realSpots from "@/data/real-spots.json";
import { isDestinationCandidate } from "@/features/adventure/validation";
import type { AdventureMode, DestinationCandidate, Route } from "@/types/adventure";
import { DemoRoutingProvider } from "./demo-provider";
import { OsrmRoutingProvider } from "./osrm-provider";
import { RoutingError } from "./errors";
import type { RouteApiRequest, RoutingProvider } from "./types";
import { validateRoute } from "./validation";
export function registeredDestinations(): DestinationCandidate[] {
  const data: unknown[] = spots;
  if (!data.every(isDestinationCandidate)) throw new RoutingError("INVALID_ROUTE", 500);
  return data;
}
export function createRoutingProvider(mode: AdventureMode): RoutingProvider {
  return mode === "demo" ? new DemoRoutingProvider() : new OsrmRoutingProvider();
}
export async function getRegisteredRoute(input: RouteApiRequest): Promise<Route> {
  if (input.mode !== "live") throw new RoutingError("INVALID_INPUT", 400);
  const destinations = realSpots as DestinationCandidate[];
  const destination = destinations.find(s => s.id === input.destinationId && s.isActive);
  if (!destination) throw new RoutingError("UNKNOWN_DESTINATION", 404);
  if (!destination.supportedVehicles.includes(input.vehicleType)) throw new RoutingError("UNSUPPORTED_VEHICLE");
  return validateRoute(await new OsrmRoutingProvider().getRoute({ origin: input.origin, destination, vehicleType: input.vehicleType }));
}
